import { createHash } from 'node:crypto';
import { getSupabaseAdminClient } from './supabaseClient.js';

function labelFor(point, fallback = null) {
  return point?.resolvedLabel || point?.label || fallback || null;
}

function coord(point, key) {
  return typeof point?.[key] === 'number' ? point[key] : null;
}

function routeNames(itineraries, field) {
  const names = new Set();
  for (const itinerary of itineraries || []) {
    for (const leg of itinerary.legs || []) {
      const value = leg.route?.[field];
      if (value) names.add(String(value));
    }
  }
  return Array.from(names);
}

function routeIds(itineraries) {
  const ids = new Set();
  for (const itinerary of itineraries || []) {
    for (const leg of itinerary.legs || []) {
      const route = leg.route;
      const id = route?.id || route?.gtfsId || route?.routeId;
      if (id) ids.add(String(id));
    }
  }
  return Array.from(ids);
}

function planIdFor(input) {
  const seed = [
    input.fromLabel,
    input.toLabel,
    input.fromLat,
    input.fromLng,
    input.toLat,
    input.toLng,
    input.date,
    input.time,
    input.optimizedFor,
  ].join('|');
  return `plan_${createHash('sha256').update(seed).digest('hex').slice(0, 10)}`;
}

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

export async function resolveRouteSearchUserId(req) {
  const token = bearerToken(req);
  if (!token) return null;

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      console.warn(`[routeSearchLog] user token ignored: ${error.message}`);
      return null;
    }
    return data?.user?.id || null;
  } catch (err) {
    console.warn(`[routeSearchLog] user lookup skipped: ${err?.error?.message || err.message}`);
    return null;
  }
}

function buildPayload(input) {
  const fromLabel = labelFor(input.resolvedFrom, input.requestFrom?.label);
  const toLabel = labelFor(input.resolvedTo, input.requestTo?.label);
  const fromLat = coord(input.resolvedFrom, 'lat') ?? coord(input.requestFrom, 'lat');
  const fromLng = coord(input.resolvedFrom, 'lng') ?? coord(input.requestFrom, 'lng');
  const toLat = coord(input.resolvedTo, 'lat') ?? coord(input.requestTo, 'lat');
  const toLng = coord(input.resolvedTo, 'lng') ?? coord(input.requestTo, 'lng');
  const itineraries = input.itineraries || [];

  const base = {
    plan_id: input.planId || planIdFor({
      fromLabel,
      toLabel,
      fromLat,
      fromLng,
      toLat,
      toLng,
      date: input.date,
      time: input.time,
      optimizedFor: input.optimizedFor,
    }),
    user_id: input.userId || null,
    from_label: fromLabel,
    from_lat: fromLat,
    from_lng: fromLng,
    to_label: toLabel,
    to_lat: toLat,
    to_lng: toLng,
    date: input.date,
    time: input.time,
    optimized_for: input.optimizedFor,
    total_routes: itineraries.length,
    itineraries,
  };

  return {
    base,
    extended: {
      ...base,
      anonymous_session_id: input.anonymousSessionId || null,
      status: input.status,
      error_message: input.errorMessage || null,
      source: input.source || 'otp',
      route_short_names: routeNames(itineraries, 'shortName'),
      route_long_names: routeNames(itineraries, 'longName'),
      route_ids: routeIds(itineraries),
    },
  };
}

function unsupportedColumns(error) {
  return error?.code === 'PGRST204' || /column|schema cache|route_short_names|anonymous_session_id|status/i.test(error?.message || '');
}

export async function logRouteSearch(input) {
  const { base, extended } = buildPayload(input);
  const supabase = getSupabaseAdminClient();

  let result = await supabase
    .from('route_searches')
    .insert(extended)
    .select('id')
    .single();

  if (result.error && unsupportedColumns(result.error)) {
    console.warn(`[routeSearchLog] extended route_searches columns unavailable; retrying base insert: ${result.error.message}`);
    result = await supabase
      .from('route_searches')
      .insert(base)
      .select('id')
      .single();
  }

  if (result.error) throw result.error;
  return {
    id: result.data?.id,
    status: input.status,
  };
}

export async function safeLogRouteSearch(input) {
  try {
    return await logRouteSearch(input);
  } catch (err) {
    console.error('[routeSearchLog] failed to save route search', {
      from: input.resolvedFrom?.label || input.requestFrom?.label,
      to: input.resolvedTo?.label || input.requestTo?.label,
      date: input.date,
      time: input.time,
      status: input.status,
      error: err?.message,
    });
    return {
      status: input.status,
      error: err?.message || 'Failed to save route search',
    };
  }
}
