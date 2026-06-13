// Build-time generator for the route place-name translation dictionary.
//
// Pipeline (all at build time — runtime stays a pure static lookup):
//   1. Collect every English stop name (GTFS-derived) + route long-name that can
//      appear in a planned route step.
//   2. Resolve Arabic for each, in priority order:
//        a) curated backend seeds (ARABIC_LABELS / LANDMARKS)
//        b) curated lexicon in placeLexicon.mjs (exact, or split "A-B" route
//           compounds into curated segments)
//        c) Groq LLM fallback (optional; only for what (a)/(b) miss) — drafts
//           Arabic for the long tail of bus stop/route names.
//   3. Write the committed flat map + a review artifact + a TODO list.
//
// Outputs (in src/services/data/):
//   placeTranslations.generated.json   { normalizedKey: arabic }   (committed, runtime)
//   place-names.source.json            { key: { en, ar } }         (review)
//   place-names.todo.json              [ "English name", … ]       (unresolved)
//
// Run: node frontend/scripts/generatePlaceTranslations.mjs
//   Set GROQ_API_KEY (read from backend/.env) to enable the AI fallback;
//   without it the script runs lexicon-only and lists the rest in the TODO file.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { EXACT, norm as normalizePlace } from "./placeLexicon.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

const STOPS_JSON = resolve(repoRoot, "backend/src/data/places.generated.json");
const ROUTES_TXT = resolve(repoRoot, "otp-cairo/data/cairo/temp_extract/routes.txt");
const OVERLAY_JS = resolve(repoRoot, "backend/src/data/placeOverlay.js");
const BACKEND_ENV = resolve(repoRoot, "backend/.env");
const OUT_DIR = resolve(here, "..", "src/services/data");
const OUT_MAP = resolve(OUT_DIR, "placeTranslations.generated.json");
const OUT_SOURCE = resolve(OUT_DIR, "place-names.source.json");
const OUT_TODO = resolve(OUT_DIR, "place-names.todo.json");

// ── Load GROQ_* from backend/.env (no dependency) ──────────────────────────
function loadBackendEnv() {
  if (!existsSync(BACKEND_ENV)) return;
  for (const line of readFileSync(BACKEND_ENV, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*(GROQ_[A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadBackendEnv();

// ── CSV helper (respects quoted fields) ────────────────────────────────────
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// ── 1) Collect English names ───────────────────────────────────────────────
const englishByKey = new Map(); // key -> representative English string
function addName(en) {
  const key = normalizePlace(en);
  if (key && !englishByKey.has(key)) englishByKey.set(key, String(en).trim());
}

for (const stop of JSON.parse(readFileSync(STOPS_JSON, "utf-8"))) {
  if (stop?.label) addName(stop.label);
}
const routeLines = readFileSync(ROUTES_TXT, "utf-8").split(/\r?\n/).filter(Boolean);
const header = splitCsvLine(routeLines[0]).map((h) => h.trim());
const longNameIdx = header.indexOf("route_long_name");
for (let i = 1; i < routeLines.length; i += 1) {
  const longName = splitCsvLine(routeLines[i])[longNameIdx]?.trim();
  if (longName) addName(longName);
}

// ── 2a) Curated backend seeds (ARABIC_LABELS + LANDMARKS) ──────────────────
const seed = {}; // key -> arabic
const overlay = readFileSync(OVERLAY_JS, "utf-8");
const labelsBlock = overlay.match(/export const ARABIC_LABELS\s*=\s*{([\s\S]*?)};/);
if (labelsBlock) {
  const re = /(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_]+))\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(labelsBlock[1]))) seed[normalizePlace(m[1] ?? m[2] ?? m[3])] = m[4];
}
const landmarkRe = /label:\s*'([^']+)'[\s\S]*?arLabel:\s*'([^']+)'/g;
let lm;
while ((lm = landmarkRe.exec(overlay))) seed[normalizePlace(lm[1])] = lm[2];

// ── 2b) Lexicon composition (exact, or split route compound into segments) ──
function resolveExact(name) {
  const key = normalizePlace(name);
  return seed[key] ?? EXACT[key] ?? null;
}
function compose(en) {
  const direct = resolveExact(en);
  if (direct) return direct;
  const parts = String(en).split(/\s-\s|-/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const tr = parts.map(resolveExact);
    if (tr.every(Boolean)) return tr.join(" - ");
  }
  return null;
}

// Resume support: reuse Arabic already committed so re-runs only fill the gaps
// (curated seed/lexicon still override any stale prior value).
const prior = existsSync(OUT_MAP)
  ? JSON.parse(readFileSync(OUT_MAP, "utf-8"))
  : {};

const resolved = {}; // key -> arabic
const unresolved = []; // [{ key, en }]
let fromLexicon = 0;
let fromPrior = 0;
for (const [key, en] of englishByKey) {
  const ar = compose(en);
  if (ar) { resolved[key] = ar; fromLexicon += 1; }
  else if (prior[key]) { resolved[key] = prior[key]; fromPrior += 1; }
  else unresolved.push({ key, en });
}

const afterLexicon = fromLexicon;

// ── 2c) Groq fallback for the remainder (optional, build-time, batched) ────
async function groqTranslateBatch(names) {
  const system = [
    "You translate Greater Cairo public-transport stop and route names from English to Arabic.",
    "Rules: render proper nouns in standard Egyptian Arabic spelling (transliterate names of people/places);",
    "translate generic words (Street->شارع, Square->ميدان, Mosque->مسجد, Hospital->مستشفى, Bridge->كوبري,",
    "University->جامعة, Station->محطة, Entrance->مدخل, Exit->مخرج, Gas Station->محطة وقود, Ring Road->الطريق الدائري,",
    "Mall->مول, Club->نادي, Gate->بوابة, District->الحي, Settlement->التجمع);",
    "keep digits as digits; keep a ' - ' separator between two place parts; do NOT add commentary.",
    "Respond with a JSON object mapping each input string EXACTLY to its Arabic translation.",
  ].join(" ");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      temperature: 0,
      // gpt-oss burns its completion budget on reasoning; keep it low and give
      // enough room so the JSON object always finishes (avoids HTTP 400).
      reasoning_effort: "low",
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(names) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Groq HTTP ${response.status}`);
  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  return JSON.parse(text);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Translate one batch; on a recoverable failure (rate limit / payload too
// large) wait and retry, then split the batch in half and recurse. Successful
// Arabic values are written straight into `resolved`.
async function translateInto(batch, depth = 0) {
  if (!batch.length) return;
  try {
    const map = await groqTranslateBatch(batch.map((b) => b.en));
    for (const { key, en } of batch) {
      const ar = map[en];
      if (typeof ar === "string" && ar.trim() && /[؀-ۿ]/.test(ar)) {
        resolved[key] = ar.trim();
      }
    }
  } catch (err) {
    const status = Number(String(err.message).match(/\b(\d{3})\b/)?.[1]);
    // 400 = the model overran tokens (too many names) -> split. 413/429 are
    // Groq's tokens-per-minute throttle -> back off and retry the same batch.
    if (batch.length > 4 && status === 400) {
      const mid = Math.ceil(batch.length / 2);
      await translateInto(batch.slice(0, mid), depth + 1);
      await translateInto(batch.slice(mid), depth + 1);
    } else if (depth < 5 && (status === 413 || status === 429 || status >= 500 || !status)) {
      await sleep(6000 * (depth + 1));
      await translateInto(batch, depth + 1);
    } else {
      console.warn(`\n  giving up on ${batch.length} name(s): ${err.message}`);
    }
  }
}

let groqAdded = 0;
if (process.env.GROQ_API_KEY && unresolved.length) {
  const BATCH = 20;
  console.log(`Groq fallback: translating ${unresolved.length} names in batches of ${BATCH}…`);
  for (let i = 0; i < unresolved.length; i += BATCH) {
    await translateInto(unresolved.slice(i, i + BATCH));
    groqAdded = Object.keys(resolved).length - afterLexicon - fromPrior;
    process.stdout.write(`  ${Math.min(i + BATCH, unresolved.length)}/${unresolved.length} (added ${groqAdded})\r`);
    await sleep(350); // be gentle with rate limits
  }
  console.log("");
} else if (!process.env.GROQ_API_KEY) {
  console.log("Groq fallback skipped (GROQ_API_KEY not set) — lexicon-only run.");
}

// ── 3) Write outputs ───────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });

const sortedMap = {};
for (const key of Object.keys(resolved).sort()) sortedMap[key] = resolved[key];
writeFileSync(OUT_MAP, JSON.stringify(sortedMap, null, 2) + "\n", "utf-8");

const sourceOut = {};
for (const [key, en] of [...englishByKey].sort((a, b) => a[0].localeCompare(b[0]))) {
  sourceOut[key] = { en, ar: resolved[key] ?? "" };
}
writeFileSync(OUT_SOURCE, JSON.stringify(sourceOut, null, 2) + "\n", "utf-8");

const stillMissing = [...englishByKey.entries()]
  .filter(([key]) => !resolved[key])
  .map(([, en]) => en)
  .sort();
writeFileSync(OUT_TODO, JSON.stringify(stillMissing, null, 2) + "\n", "utf-8");

const total = englishByKey.size;
const done = Object.keys(resolved).length;
console.log(`\nDone. ${done}/${total} translated (${Math.round((done / total) * 100)}%).`);
console.log(`  lexicon+seed: ${afterLexicon}`);
console.log(`  reused prior: ${fromPrior}`);
console.log(`  groq (new):   ${groqAdded}`);
console.log(`  still TODO:   ${stillMissing.length}`);
console.log(`Wrote:\n  ${OUT_MAP}\n  ${OUT_SOURCE}\n  ${OUT_TODO}`);
