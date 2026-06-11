import { getSupabaseAdminClient } from './supabaseClient.js';

function firstLeg(ticket) {
  return ticket?.legs?.[0] || {};
}

function lastLeg(ticket) {
  return ticket?.legs?.[ticket?.legs?.length - 1] || {};
}

function routeTextFromTicket(ticket) {
  const leg = firstLeg(ticket);
  const route = leg.route;
  return route?.shortName || route?.longName || route || null;
}

function placeName(value) {
  return value?.name || value || null;
}

function uuidOrNull(value) {
  const text = String(value || '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function mapDbTicket(row) {
  const raw = row.raw || {};
  return {
    id: row.id,
    ticketId: raw.ticketId || row.id,
    userId: row.user_id || raw.passenger?.userId,
    userName: raw.passenger?.name || raw.passenger?.email || row.user_email || '',
    route: row.route_summary || routeTextFromTicket(raw),
    from: row.from_label || placeName(firstLeg(raw).from),
    to: row.to_label || placeName(lastLeg(raw).to),
    status: row.status || raw.status,
    paymentStatus: row.payment_status || raw.payment?.status,
    refundStatus: row.refund_status || raw.refundStatus || raw.payment?.refundStatus || null,
    created_at: row.created_at || raw.createdAt,
    valid_until: row.valid_until || raw.expiresAt,
    raw,
  };
}

function cleanNullish(value) {
  return value === undefined ? null : value;
}

function rawTicketFromRow(row) {
  const raw = row.raw && typeof row.raw === 'object' ? structuredClone(row.raw) : {};
  const ticketId = raw.ticketId || row.id;

  return {
    ...raw,
    ticketId,
    status: row.status || raw.status || 'active',
    expiresAt: row.valid_until || raw.expiresAt,
    createdAt: row.created_at || raw.createdAt,
    passenger: {
      ...(raw.passenger || {}),
      ...(row.user_id && { userId: row.user_id }),
      ...(row.user_email && !raw.passenger?.email && { email: row.user_email }),
    },
    payment: {
      ...(raw.payment || {}),
      status: row.payment_status || raw.payment?.status || 'paid',
    },
    legs: Array.isArray(raw.legs) ? raw.legs : [],
  };
}

function reactivatedRawTicket(row, validUntil) {
  const raw = rawTicketFromRow(row);
  raw.status = 'active';
  raw.expiresAt = validUntil;
  raw.refundStatus = null;

  if (raw.payment && typeof raw.payment === 'object') {
    raw.payment.status = 'paid';
    raw.payment.refundStatus = null;
  }

  return raw;
}

function ticketToRow(ticket) {
  const first = firstLeg(ticket);
  const last = lastLeg(ticket);
  return {
    user_id: uuidOrNull(ticket.passenger?.userId),
    user_email: ticket.passenger?.email || null,
    from_label: placeName(first.from),
    to_label: placeName(last.to),
    route_summary: routeTextFromTicket(ticket),
    price: ticket.payment?.amount ?? null,
    status: ticket.status || null,
    payment_status: ticket.payment?.status || null,
    refund_status: ticket.refundStatus || ticket.payment?.refundStatus || null,
    valid_until: ticket.expiresAt || null,
    raw: ticket,
    created_at: ticket.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function syncTicketToSupabase(ticket) {
  try {
    const supabase = getSupabaseAdminClient();
    const row = ticketToRow(ticket);
    const { data: existing, error: lookupError } = await supabase
      .from('tickets')
      .select('id')
      .eq('raw->>ticketId', ticket.ticketId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const result = existing?.id
      ? await supabase.from('tickets').update(row).eq('id', existing.id)
      : await supabase.from('tickets').insert(row);
    if (result.error) throw result.error;
  } catch (err) {
    console.warn(`[adminTickets] Supabase ticket sync skipped: ${err?.error?.message || err.message}`);
  }
}

export async function listAdminTicketsFromSupabase() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []).map(mapDbTicket);
}

export async function getTicketPayloadFromSupabase(ticketId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .or(`id.eq.${ticketId},raw->>ticketId.eq.${ticketId}`)
    .maybeSingle();
  if (error) throw error;
  return data ? rawTicketFromRow(data) : null;
}

export async function listTicketPayloadsFromSupabase(userId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .or(`user_id.eq.${userId},raw->passenger->>userId.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []).map(rawTicketFromRow);
}

export async function getAdminTicketFromSupabase(id) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDbTicket(data) : null;
}

export async function reactivateAdminTicketInSupabase(id) {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: lookupError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!existing) return null;

  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const raw = reactivatedRawTicket(existing, validUntil);
  const payload = {
    status: 'active',
    payment_status: 'paid',
    refund_status: null,
    valid_until: validUntil,
    raw,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('tickets')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) {
    console.error('[adminTickets] Failed to reactivate ticket in Supabase', {
      id,
      validUntil,
      message: error.message,
    });
    throw error;
  }
  return data ? mapDbTicket(data) : null;
}

export async function updateAdminTicketInSupabase(id, updates) {
  const payload = {
    updated_at: new Date().toISOString(),
  };
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.refundStatus !== undefined) payload.refund_status = cleanNullish(updates.refundStatus);
  if (updates.paymentStatus !== undefined) payload.payment_status = cleanNullish(updates.paymentStatus);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tickets')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapDbTicket(data) : null;
}
