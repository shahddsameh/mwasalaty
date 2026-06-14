import { getSupabaseAdminClient } from './supabaseClient.js';

const VALID_RATINGS = new Set(['good', 'bad']);
const TABLE_CANDIDATES = ['journey_feedback', 'feedback'];

function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION_ERROR';
  return err;
}

function uuidOrNull(value) {
  const text = String(value || '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function optionalText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeModes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((mode) => String(mode || '').trim())
    .filter(Boolean);
}

function normalizeFeedback(input = {}) {
  const rating = String(input.rating || '').trim().toLowerCase();
  if (!rating) throw validationError('rating is required');
  if (!VALID_RATINGS.has(rating)) {
    throw validationError('rating must be "good" or "bad"');
  }

  const issueMessage = optionalText(input.issueMessage);
  if (rating === 'bad' && !issueMessage) {
    throw validationError('issueMessage is required for bad feedback');
  }

  const now = new Date().toISOString();
  const raw = {
    userId: optionalText(input.userId),
    routeId: optionalText(input.routeId),
    tripId: optionalText(input.tripId),
    ticketId: optionalText(input.ticketId),
    origin: optionalText(input.origin),
    destination: optionalText(input.destination),
    rating,
    issueMessage: rating === 'bad' ? issueMessage : null,
    routeSummary: optionalText(input.routeSummary),
    transportModes: normalizeModes(input.transportModes),
  };

  return {
    user_id: uuidOrNull(raw.userId),
    userId: raw.userId,
    route_id: raw.routeId,
    routeId: raw.routeId,
    trip_id: raw.tripId,
    tripId: raw.tripId,
    ticket_id: raw.ticketId,
    ticketId: raw.ticketId,
    origin: raw.origin,
    from_label: raw.origin,
    destination: raw.destination,
    to_label: raw.destination,
    rating,
    feedback_type: rating,
    type: rating,
    issue_message: raw.issueMessage,
    issueMessage: raw.issueMessage,
    message: raw.issueMessage,
    comment: raw.issueMessage,
    route_summary: raw.routeSummary,
    routeSummary: raw.routeSummary,
    transport_modes: raw.transportModes,
    transportModes: raw.transportModes,
    raw,
    metadata: raw,
    created_at: now,
    updated_at: now,
  };
}

function mapFeedback(row = {}) {
  const raw = row.raw || row.metadata || {};
  const rating = row.rating || row.feedback_type || row.type || raw.rating || 'good';
  return {
    id: row.id,
    userId: row.user_id || row.userId || raw.userId || null,
    user: row.user_email || raw.userEmail || row.user_id || row.userId || raw.userId || 'Guest',
    routeId: row.route_id || row.routeId || raw.routeId || null,
    tripId: row.trip_id || row.tripId || raw.tripId || null,
    ticketId: row.ticket_id || row.ticketId || raw.ticketId || null,
    origin: row.origin || row.from_label || raw.origin || null,
    destination: row.destination || row.to_label || raw.destination || null,
    rating,
    issueMessage: row.issue_message || row.issueMessage || row.message || row.comment || raw.issueMessage || null,
    routeSummary: row.route_summary || row.routeSummary || raw.routeSummary || null,
    transportModes: Array.isArray(row.transport_modes)
      ? row.transport_modes
      : Array.isArray(row.transportModes)
        ? row.transportModes
      : normalizeModes(raw.transportModes),
    createdAt: row.created_at || raw.createdAt || null,
    updatedAt: row.updated_at || row.created_at || raw.updatedAt || null,
    raw,
  };
}

function isMissingTable(error) {
  return error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '');
}

function missingColumn(error) {
  if (error?.code !== 'PGRST204') return null;
  const match = String(error.message || '').match(/'([^']+)' column/i);
  return match?.[1] || null;
}

async function insertWithColumnPruning(table, row) {
  const payload = { ...row };
  let lastResult = null;
  for (let attempts = 0; attempts <= Object.keys(row).length; attempts += 1) {
    const result = await table.insert(payload).select('*').single();
    if (!result.error) return result;

    lastResult = result;
    const column = missingColumn(result.error);
    if (!column || !(column in payload)) return result;
    delete payload[column];
  }
  return lastResult;
}

async function withFeedbackTable(operation) {
  const supabase = getSupabaseAdminClient();
  let lastError = null;
  for (const table of TABLE_CANDIDATES) {
    const result = await operation(supabase.from(table), table);
    if (!result.error) return { ...result, table };
    lastError = result.error;
    if (!isMissingTable(result.error)) break;
  }
  throw lastError;
}

export async function createJourneyFeedback(input) {
  const row = normalizeFeedback(input);
  const { data } = await withFeedbackTable((table) => insertWithColumnPruning(table, row));
  return mapFeedback(data);
}

export async function listJourneyFeedback() {
  const { data } = await withFeedbackTable((table) =>
    table.select('*').order('created_at', { ascending: false }).limit(1000),
  );
  return (data || []).map(mapFeedback);
}
