import { getSupabaseAdminClient } from './supabaseClient.js';

export async function saveRouteSearch({ result, request, userId = null }) {
  const row = {
    plan_id: result.planId,
    user_id: userId,
    from_label: result.from.label,
    from_lat: result.from.lat,
    from_lng: result.from.lng,
    to_label: result.to.label,
    to_lat: result.to.lat,
    to_lng: result.to.lng,
    date: request.date,
    time: request.time,
    optimized_for: result.optimizedFor,
    total_routes: result.itineraries.length,
    itineraries: result.itineraries,
  };
  const { error } = await getSupabaseAdminClient().from('route_searches').insert(row);
  if (error) throw error;
}

export async function listRouteSearches(limit = 100) {
  const { data, error } = await getSupabaseAdminClient()
    .from('route_searches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
