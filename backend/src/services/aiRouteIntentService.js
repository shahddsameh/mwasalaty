import { findMentionedPlaces, getPlaceCatalog, matchLocalPlaceLabel } from './geocodingService.js';
import { ErrorCodes } from '../helpers/errors.js';

const DEFAULT_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_TIMEOUT_MS = 8000;
const FILTERS = new Set(['fastest', 'cheapest', 'comfortable']);
const TIME_MODES = new Set(['now', 'depart', 'arrive']);

function aiError(code, message, details = {}) {
  return { code, message, details };
}

function parseFilter(prompt) {
  if (/\b(cheap|cheapest|lowest cost|budget)\b|ارخص|الأرخص/i.test(prompt)) return 'cheapest';
  if (/\b(comfortable|comfort|minimal walking|least walking|fewest transfers)\b|مريح|اقل مشي|أقل مشي/i.test(prompt)) {
    return 'comfortable';
  }
  return 'fastest';
}

function parseMaxDurationMinutes(prompt) {
  const hourMatch = prompt.match(/\b(?:under|within|less than|in)\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60);
  if (/\bunder an hour\b|\bwithin an hour\b|اقل من ساع[هة]|أقل من ساع[هة]/i.test(prompt)) return 60;
  const minuteMatch = prompt.match(/\b(?:under|within|less than|in)\s+(\d+)\s*(?:minutes?|mins?)\b/i);
  return minuteMatch ? Number(minuteMatch[1]) : null;
}

function parseSchedule(prompt) {
  const isoDate = prompt.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] ?? null;
  const timeMatch = prompt.match(/\b(?:at|by|before)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!timeMatch) return { timeMode: 'now', date: isoDate, time: null };

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? 0);
  const meridiem = timeMatch[3]?.toLowerCase();
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return { timeMode: 'now', date: isoDate, time: null };
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const arrive = /\b(arrive|arrival|by|before)\b|اوصل|الوصول/i.test(prompt);
  return { timeMode: arrive ? 'arrive' : 'depart', date: isoDate, time };
}

function cleanPlaceFragment(value) {
  return String(value ?? '')
    .replace(/[?!.,،؛]+$/g, '')
    .replace(/\s+(?:with|minimal|using|under|within|in under|in less than|at|by|before)\b.*$/i, '')
    .replace(/\s+(?:بأقل|اقل|أقل|قبل|الساعة|الساعه)\b.*$/i, '')
    .trim();
}

// Personal saved-place keywords. The user's actual home/work/school coordinates
// live in their (client-side) favorites, so the parser only emits the canonical
// token here ('home' | 'work' | 'school'); the frontend swaps in the saved place.
const PERSONAL_PLACES = [
  { token: 'home', word: 'home|house', en: /^(?:my\s+)?(?:home|house|place)$/i, ar: /^(?:بيتي|البيت|المنزل|منزلي)$/ },
  { token: 'work', word: 'work|office|workplace|job', en: /^(?:my\s+)?(?:work|office|workplace|job)$/i, ar: /^(?:شغلي|الشغل|العمل|عملي|مكتبي|المكتب)$/ },
  { token: 'school', word: 'school|college|university|uni', en: /^(?:my\s+)?(?:school|college|university|uni)$/i, ar: /^(?:مدرستي|المدرسه|الجامعه|كليتي|الكليه)$/ },
];
const PERSONAL_WORD = PERSONAL_PLACES.map((p) => p.word).join('|');

// Canonical personal token for a whole fragment that *is* a personal place
// (e.g. "my home", "البيت"), else null. Matches the full fragment only, so a real
// stop that merely contains the word (e.g. "Fatima School") is left untouched.
function personalTokenFor(label) {
  const value = String(label ?? '').trim().replace(/[?!.,،؛]+$/g, '').trim();
  if (!value) return null;
  for (const p of PERSONAL_PLACES) {
    if (p.en.test(value) || p.ar.test(value)) return p.token;
  }
  return null;
}

function parseDirectionalPlaces(prompt) {
  // "<personal> from <origin>"  e.g. "take me home from Abbassiya"
  const personalReversed = prompt.match(
    new RegExp(`\\b(${PERSONAL_WORD})\\b\\s+from\\s+(.+?)(?=$|\\s+(?:with|using|under|within|in under|in less than|at|by|before)\\b)`, 'i')
  );
  if (personalReversed) return { from: cleanPlaceFragment(personalReversed[2]), to: personalReversed[1] };

  const english = prompt.match(/\bfrom\s+(.+?)\s+to\s+(.+?)(?=$|\s+(?:with|using|under|within|in under|in less than|at|by|before)\b)/i);
  if (english) return { from: cleanPlaceFragment(english[1]), to: cleanPlaceFragment(english[2]) };

  const arabic = prompt.match(/من\s+(.+?)\s+(?:إلى|الى)\s+(.+?)(?=$|\s+(?:بأقل|اقل|أقل|قبل|الساعة|الساعه)\b)/i);
  if (arabic) return { from: cleanPlaceFragment(arabic[1]), to: cleanPlaceFragment(arabic[2]) };

  const destinationOnly = prompt.match(/\b(?:to\s+(?:reach\s+)?|reach\s+)(.+?)(?=$|\s+(?:with|using|under|within|in under|in less than|at|by|before)\b)/i);
  if (destinationOnly) return { from: null, to: cleanPlaceFragment(destinationOnly[1]) };

  // Bare personal destination with no "to": "go home", "i wanna go home", "take me home"
  const barePersonal = prompt.match(
    new RegExp(`\\b(?:go|going|get\\s+me|take\\s+me|head|back|return)\\b[\\s\\w']*?\\b(${PERSONAL_WORD})\\b`, 'i')
  ) || prompt.match(new RegExp(`^\\s*(${PERSONAL_WORD})\\s*$`, 'i'));
  if (barePersonal) return { from: null, to: barePersonal[1] };

  return { from: null, to: null };
}

// Snap a free-text place to a canonical label: a personal token wins first, then
// an exact catalog stop (English / Arabic / alias); otherwise keep the cleaned
// text so a legitimate off-catalog place (e.g. "Cairo Airport") can still geocode.
function snapPlace(label) {
  const value = typeof label === 'string' ? label.trim() : '';
  if (!value) return null;
  return personalTokenFor(value) ?? matchLocalPlaceLabel(value) ?? value;
}

export function parseRouteIntentDeterministically(prompt) {
  const places = findMentionedPlaces(prompt);
  const directional = parseDirectionalPlaces(prompt);
  const schedule = parseSchedule(prompt);
  return {
    from: snapPlace(directional.to ? directional.from : places[0]?.label || null),
    to: snapPlace(directional.to || places[1]?.label || null),
    filter: parseFilter(prompt),
    ...schedule,
    maxDurationMinutes: parseMaxDurationMinutes(prompt),
  };
}

function normalizeIntent(intent) {
  return {
    from: typeof intent?.from === 'string' && intent.from.trim() ? intent.from.trim() : null,
    to: typeof intent?.to === 'string' && intent.to.trim() ? intent.to.trim() : null,
    filter: FILTERS.has(intent?.filter) ? intent.filter : 'fastest',
    timeMode: TIME_MODES.has(intent?.timeMode) ? intent.timeMode : 'now',
    date: /^\d{4}-\d{2}-\d{2}$/.test(intent?.date) ? intent.date : null,
    time: /^\d{2}:\d{2}$/.test(intent?.time) ? intent.time : null,
    maxDurationMinutes: Number.isFinite(intent?.maxDurationMinutes) && intent.maxDurationMinutes > 0
      ? Math.round(intent.maxDurationMinutes)
      : null,
  };
}

function missingFields(intent) {
  const missing = [];
  if (!intent.from) missing.push('from');
  if (!intent.to) missing.push('to');
  if (intent.timeMode !== 'now' && (!intent.date || !intent.time)) missing.push('date_time');
  return missing;
}

function responseForIntent(intent, source) {
  const missing = missingFields(intent);
  if (missing.length) {
    return {
      status: 'needs_clarification',
      missingFields: missing,
      message: missing.includes('from')
        ? 'Please include your starting point.'
        : missing.includes('to')
          ? 'Please include your destination.'
          : 'Please include both a date and time for the scheduled journey.',
      intent,
      source,
    };
  }
  return { status: 'ready', intent, source };
}

// Canonical place catalog, built once. Metro/interchange stops are marked with a
// trailing '*' so the model can prefer them when a major area is ambiguous.
const PLACE_CATALOG_TEXT = getPlaceCatalog()
  .map(({ label, arLabel, metro }) =>
    `${label}${arLabel ? ` (${arLabel})` : ''}${metro ? '*' : ''}`
  )
  .join(', ');

const GROQ_SYSTEM_PROMPT = [
  'Extract a Greater Cairo public-transport route request as strict JSON with keys:',
  "from (string|null), to (string|null), filter ('fastest'|'cheapest'|'comfortable'),",
  "timeMode ('now'|'depart'|'arrive'), date ('YYYY-MM-DD'|null), time ('HH:MM'|null),",
  'maxDurationMinutes (integer|null).',
  'Map the user\'s origin and destination to the place from the list below whose name they mean,',
  'even when it is misspelled or written in Arabic; output that place\'s EXACT English name as it',
  'appears in the list. Metro/interchange stations are marked with a trailing "*"; prefer a marked',
  'station when a major area is ambiguous. If a place is clearly a real Cairo location not in the',
  'list, output it as the user wrote it.',
  "When the user refers to their own saved place, output the literal token 'home', 'work', or",
  "'school' (e.g. \"get me home\" -> to:'home'); do not map these to a list stop.",
  'Never invent an origin, destination, date, or time; use null when missing.',
  `Known places: ${PLACE_CATALOG_TEXT}.`,
  'Respond with only the JSON object.',
].join(' ');

export async function parseRouteIntentWithGroq(prompt, fetchImpl = fetch) {
  if (!process.env.GROQ_API_KEY) {
    throw aiError(ErrorCodes.AI_SERVICE_UNAVAILABLE, 'Groq AI is not configured');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.GROQ_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: GROQ_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      throw aiError(ErrorCodes.AI_SERVICE_UNAVAILABLE, 'Groq AI request failed', { status: response.status });
    }
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (!text) throw aiError(ErrorCodes.AI_INVALID_RESPONSE, 'Groq returned no route intent');
    try {
      return normalizeIntent(JSON.parse(text));
    } catch {
      throw aiError(ErrorCodes.AI_INVALID_RESPONSE, 'Groq returned an invalid route intent');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw aiError(ErrorCodes.AI_REQUEST_TIMEOUT, 'Groq AI request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveRouteIntent(prompt, fetchImpl = fetch) {
  const deterministic = normalizeIntent(parseRouteIntentDeterministically(prompt));

  // Fast path: both endpoints already resolve to a real catalog stop and any
  // scheduled trip has its date/time — no need to consult the LLM.
  const exactlyResolved =
    matchLocalPlaceLabel(deterministic.from) && matchLocalPlaceLabel(deterministic.to);
  if (exactlyResolved && !missingFields(deterministic).length) {
    return responseForIntent(deterministic, 'deterministic');
  }

  if (!process.env.GROQ_API_KEY) return responseForIntent(deterministic, 'deterministic');

  // Let the LLM map any misspelled / colloquial / Arabic place to a catalog stop,
  // but keep the reliable regex-derived filter and schedule fields.
  const llmIntent = await parseRouteIntentWithGroq(prompt, fetchImpl);
  const merged = normalizeIntent({
    ...deterministic,
    from: snapPlace(llmIntent.from) ?? deterministic.from,
    to: snapPlace(llmIntent.to) ?? deterministic.to,
  });
  return responseForIntent(merged, 'groq');
}
