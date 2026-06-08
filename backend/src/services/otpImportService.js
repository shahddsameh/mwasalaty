import { getSupabaseAdminClient } from './supabaseClient.js';
import fs from 'fs';
import path from 'path';

const DEFAULT_OTP_URL = 'http://localhost:8081/otp/routers/default/index/graphql';

function otpUrl() {
  return process.env.OTP_GRAPHQL_URL || DEFAULT_OTP_URL;
}

async function tableCount(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

async function fetchOtpCatalog() {
  const query = `{
    routes {
      gtfsId
      shortName
      longName
      mode
    }
    stops {
      gtfsId
      name
      lat
      lon
    }
  }`;

  const response = await fetch(otpUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) throw new Error(`OTP returned HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data || {};
}

function mapRoute(route) {
  return {
    id: route.gtfsId || route.shortName || route.longName,
    short_name: route.shortName || '',
    long_name: route.longName || '',
    mode: route.mode || '',
    raw: route,
  };
}

function mapStop(stop) {
  return {
    id: stop.gtfsId || stop.name,
    name: stop.name || '',
    lat: stop.lat ?? null,
    lng: stop.lng ?? stop.lon ?? null,
    zone_id: stop.zoneId ?? stop.zone_id ?? null,
    raw: stop,
  };
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function findStopsTxt(dir, depth = 0) {
  if (depth > 5) return '';
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return '';
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === 'stops.txt') return fullPath;
    if (entry.isDirectory()) {
      const found = findStopsTxt(fullPath, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

function readGtfsStops() {
  const filePath = findStopsTxt(process.cwd());
  if (!filePath) return [];

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || '');
  const stops = lines.map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    return {
      id: row.stop_id,
      name: row.stop_name || '',
      lat: row.stop_lat ? Number(row.stop_lat) : null,
      lng: row.stop_lon ? Number(row.stop_lon) : null,
      zone_id: row.zone_id || null,
      raw: row,
    };
  }).filter((stop) => stop.id);

  console.log(`[otpImport] loaded ${stops.length} stops from ${filePath}.`);
  return stops;
}

export async function syncOtpTransitCatalog() {
  let supabase;
  try {
    supabase = getSupabaseAdminClient();
  } catch (err) {
    console.warn(`[otpImport] Supabase skipped: ${err?.error?.message || err.message}`);
    return;
  }

  try {
    const [routesCount, stopsCount] = await Promise.all([
      tableCount(supabase, 'transit_routes'),
      tableCount(supabase, 'transit_stops'),
    ]);
    console.log(`[otpImport] transit_routes count before import: ${routesCount}`);
    console.log(`[otpImport] transit_stops count before import: ${stopsCount}`);

    const routesEmpty = routesCount === 0;
    const stopsEmpty = stopsCount === 0;

    if (!routesEmpty && !stopsEmpty) {
      console.log('[otpImport] transit_routes and transit_stops already have data; skipping import.');
      return;
    }

    let catalog = {};
    try {
      catalog = await fetchOtpCatalog();
    } catch (err) {
      console.warn(`[otpImport] OTP catalog fetch failed: ${err.message}`);
    }

    if (routesEmpty) {
      const routes = (catalog.routes || []).map(mapRoute).filter((route) => route.id);
      if (routes.length) {
        const { error } = await supabase.from('transit_routes').upsert(routes, { onConflict: 'id' });
        if (error) throw error;
      }
      console.log(`[otpImport] imported routes count: ${routes.length}`);
    }

    if (stopsEmpty) {
      let stops = (catalog.stops || []).map(mapStop).filter((stop) => stop.id);
      if (!stops.length) stops = readGtfsStops();
      if (stops.length) {
        const { error } = await supabase.from('transit_stops').upsert(stops, { onConflict: 'id' });
        if (error) throw error;
      }
      console.log(`[otpImport] imported stops count: ${stops.length}`);
    }
  } catch (err) {
    console.warn(`[otpImport] OTP/Supabase sync skipped: ${err.message}`);
  }
}

export async function listTransitRoutes() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('transit_routes')
    .select('*')
    .order('id', { ascending: true })
    .limit(1000);
  if (error) throw error;
  return data || [];
}

export async function listTransitStops() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('transit_stops')
    .select('*')
    .order('id', { ascending: true })
    .limit(1000);
  if (error) throw error;
  return data || [];
}

export async function listRouteSearches() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('route_searches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  const grouped = new Map();

  for (const row of data || []) {
    const key = [
      row.from_label || '',
      row.to_label || '',
      row.date || '',
      row.time || '',
      row.optimized_for || '',
    ].join('||');
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        from_label: row.from_label,
        to_label: row.to_label,
        date: row.date,
        time: row.time,
        optimized_for: row.optimized_for,
        total_routes: row.total_routes,
        search_count: 1,
        latest_created_at: row.created_at,
        latest_itineraries: row.itineraries,
      });
      continue;
    }

    existing.search_count += 1;
    if (new Date(row.created_at || 0) > new Date(existing.latest_created_at || 0)) {
      existing.total_routes = row.total_routes;
      existing.latest_created_at = row.created_at;
      existing.latest_itineraries = row.itineraries;
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(b.latest_created_at || 0).getTime() - new Date(a.latest_created_at || 0).getTime()
  );
}
