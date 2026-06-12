import { getSupabaseAdminClient } from './supabaseClient.js';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

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

async function fetchOtpGraphql(query, variables = {}) {
  const response = await fetch(otpUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
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

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
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

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || '');
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function findGtfsPath(dir, targetName, depth = 0) {
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
    if (entry.isFile() && entry.name === targetName) return fullPath;
    if (entry.isFile() && targetName.endsWith('.zip') && entry.name.toLowerCase().endsWith('.zip')) return fullPath;
    if (entry.isDirectory()) {
      const found = findGtfsPath(fullPath, targetName, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

function findGtfsZip() {
  if (process.env.GTFS_PATH && fs.existsSync(process.env.GTFS_PATH) && process.env.GTFS_PATH.endsWith('.zip')) {
    return process.env.GTFS_PATH;
  }
  return findGtfsPath(process.cwd(), 'gtfs.zip') || findGtfsPath(process.cwd(), 'cairo-gtfs.zip');
}

function readZipEntry(zipPath, entryName) {
  const buffer = fs.readFileSync(zipPath);
  const minEocdOffset = Math.max(0, buffer.length - 0x10000 - 22);
  let eocdOffset = -1;
  for (let offset = buffer.length - 22; offset >= minEocdOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset === -1) return '';

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;

  while (offset < centralDirectoryOffset + centralDirectorySize) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString('utf8');

    if (path.basename(fileName) === entryName) {
      if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) return '';
      const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
      const data = buffer.slice(dataOffset, dataOffset + compressedSize);
      if (compressionMethod === 0) return data.toString('utf8');
      if (compressionMethod === 8) return zlib.inflateRawSync(data).toString('utf8');
      return '';
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return '';
}

function readGtfsText(fileName) {
  if (process.env.GTFS_PATH && fs.existsSync(process.env.GTFS_PATH)) {
    const stat = fs.statSync(process.env.GTFS_PATH);
    if (stat.isDirectory()) {
      const filePath = path.join(process.env.GTFS_PATH, fileName);
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8');
    }
    if (stat.isFile() && process.env.GTFS_PATH.endsWith('.zip')) {
      const text = readZipEntry(process.env.GTFS_PATH, fileName);
      if (text) return text;
    }
  }

  const filePath = findGtfsPath(process.cwd(), fileName);
  if (filePath) return fs.readFileSync(filePath, 'utf8');

  const zipPath = findGtfsZip();
  return zipPath ? readZipEntry(zipPath, fileName) : '';
}

function readGtfsRows(fileName) {
  const text = readGtfsText(fileName);
  return text ? parseCsv(text) : [];
}

function readGtfsStops() {
  const stops = readGtfsRows('stops.txt').map((row) => ({
    id: row.stop_id,
    name: row.stop_name || '',
    lat: row.stop_lat ? Number(row.stop_lat) : null,
    lng: row.stop_lon ? Number(row.stop_lon) : null,
    zone_id: row.zone_id || null,
    raw: row,
  })).filter((stop) => stop.id);

  if (stops.length) console.log(`[otpImport] loaded ${stops.length} stops from GTFS.`);
  return stops;
}

function readGtfsRoutes() {
  return readGtfsRows('routes.txt').map((row) => ({
    id: row.route_id,
    short_name: row.route_short_name || '',
    long_name: row.route_long_name || '',
    mode: row.route_type || '',
    raw: row,
  })).filter((route) => route.id);
}

function stripFeedPrefix(id) {
  const value = String(id || '');
  return value.includes(':') ? value.split(':').pop() : value;
}

function idsMatch(left, right) {
  return String(left || '') === String(right || '') || stripFeedPrefix(left) === stripFeedPrefix(right);
}

function findRouteRow(routes, routeId) {
  return routes.find((route) =>
    idsMatch(route.route_id || route.id, routeId) ||
    idsMatch(route.route_short_name || route.short_name, routeId)
  );
}

function findStopRow(stops, stopId) {
  return stops.find((stop) =>
    idsMatch(stop.stop_id || stop.id, stopId) ||
    idsMatch(stop.stop_code || stop.code, stopId) ||
    idsMatch(stop.stop_name || stop.name, stopId)
  );
}

function routeTypeLabel(value) {
  const type = String(value || '').toLowerCase();
  if (type === '3' || type === 'bus') return 'Bus';
  if (type === '1' || type === 'subway' || type === 'metro' || type === 'rail') return 'Metro';
  return value || '';
}

function getGtfsRouteDetails(routeId) {
  const [routes, stops, trips, stopTimes] = [
    readGtfsRows('routes.txt'),
    readGtfsRows('stops.txt'),
    readGtfsRows('trips.txt'),
    readGtfsRows('stop_times.txt'),
  ];
  if (!routes.length || !stops.length || !trips.length || !stopTimes.length) return null;

  const routeRow = findRouteRow(routes, routeId);
  if (!routeRow) return null;

  const routeTrips = trips.filter((trip) => idsMatch(trip.route_id, routeRow.route_id));
  const tripById = new Map(routeTrips.map((trip) => [trip.trip_id, trip]));
  const stopsById = new Map(stops.map((stop) => [stop.stop_id, stop]));
  const stopMap = new Map();

  for (const stopTime of stopTimes) {
    const trip = tripById.get(stopTime.trip_id);
    if (!trip) continue;
    const stop = stopsById.get(stopTime.stop_id);
    const existing = stopMap.get(stopTime.stop_id) || {
      id: stopTime.stop_id,
      code: stop?.stop_code || stopTime.stop_id,
      name: stop?.stop_name || stopTime.stop_id,
      lat: stop?.stop_lat ? Number(stop.stop_lat) : null,
      lng: stop?.stop_lon ? Number(stop.stop_lon) : null,
      stopOrder: Number(stopTime.stop_sequence) || null,
      directionIds: new Set(),
      tripIds: new Set(),
    };

    const sequence = Number(stopTime.stop_sequence);
    if (Number.isFinite(sequence)) {
      existing.stopOrder = existing.stopOrder === null ? sequence : Math.min(existing.stopOrder, sequence);
    }
    if (trip.direction_id !== undefined && trip.direction_id !== '') existing.directionIds.add(String(trip.direction_id));
    existing.tripIds.add(stopTime.trip_id);
    stopMap.set(stopTime.stop_id, existing);
  }

  const relatedStops = Array.from(stopMap.values())
    .sort((a, b) => (a.stopOrder ?? 999999) - (b.stopOrder ?? 999999) || String(a.name).localeCompare(String(b.name)))
    .map((stop) => ({
      ...stop,
      directionIds: Array.from(stop.directionIds),
      tripCount: stop.tripIds.size,
      sampleTripId: Array.from(stop.tripIds)[0],
      tripIds: undefined,
    }));

  return {
    route: {
      id: routeRow.route_id,
      short_name: routeRow.route_short_name || '',
      long_name: routeRow.route_long_name || '',
      mode: routeTypeLabel(routeRow.route_type),
      raw: routeRow,
    },
    relatedStops,
    source: 'GTFS',
  };
}

function getGtfsStopDetails(stopId) {
  const [routes, stops, trips, stopTimes] = [
    readGtfsRows('routes.txt'),
    readGtfsRows('stops.txt'),
    readGtfsRows('trips.txt'),
    readGtfsRows('stop_times.txt'),
  ];
  if (!routes.length || !stops.length || !trips.length || !stopTimes.length) return null;

  const stopRow = findStopRow(stops, stopId);
  if (!stopRow) return null;

  const matchingStopTimes = stopTimes.filter((stopTime) => idsMatch(stopTime.stop_id, stopRow.stop_id));
  const tripIds = new Set(matchingStopTimes.map((stopTime) => stopTime.trip_id));
  const tripById = new Map(trips.filter((trip) => tripIds.has(trip.trip_id)).map((trip) => [trip.trip_id, trip]));
  const routeById = new Map(routes.map((route) => [route.route_id, route]));
  const routeMap = new Map();

  for (const stopTime of matchingStopTimes) {
    const trip = tripById.get(stopTime.trip_id);
    if (!trip) continue;
    const route = routeById.get(trip.route_id);
    const existing = routeMap.get(trip.route_id) || {
      id: trip.route_id,
      short_name: route?.route_short_name || '',
      long_name: route?.route_long_name || '',
      mode: routeTypeLabel(route?.route_type),
      directionIds: new Set(),
      tripIds: new Set(),
    };
    if (trip.direction_id !== undefined && trip.direction_id !== '') existing.directionIds.add(String(trip.direction_id));
    existing.tripIds.add(stopTime.trip_id);
    routeMap.set(trip.route_id, existing);
  }

  const relatedRoutes = Array.from(routeMap.values())
    .sort((a, b) => String(a.short_name || a.id).localeCompare(String(b.short_name || b.id), undefined, { numeric: true }))
    .map((route) => ({
      ...route,
      directionIds: Array.from(route.directionIds),
      tripCount: route.tripIds.size,
      tripIds: undefined,
    }));

  return {
    stop: {
      id: stopRow.stop_id,
      code: stopRow.stop_code || stopRow.stop_id,
      name: stopRow.stop_name || '',
      lat: stopRow.stop_lat ? Number(stopRow.stop_lat) : null,
      lng: stopRow.stop_lon ? Number(stopRow.stop_lon) : null,
      zone_id: stopRow.zone_id || null,
      raw: stopRow,
    },
    relatedRoutes,
    source: 'GTFS',
  };
}

async function getStoredRoute(routeId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('transit_routes')
    .select('*')
    .or(`id.eq.${routeId},short_name.eq.${routeId}`)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

async function getStoredStop(stopId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('transit_stops')
    .select('*')
    .or(`id.eq.${stopId},name.eq.${stopId}`)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

async function fetchOtpRouteDetails(routeId) {
  const data = await fetchOtpGraphql(
    `query RouteDetails($id: String!) {
      route(id: $id) {
        gtfsId
        shortName
        longName
        mode
        patterns {
          code
          directionId
          stops {
            gtfsId
            name
            lat
            lon
          }
        }
      }
    }`,
    { id: routeId },
  );

  if (!data.route) return null;
  const stopMap = new Map();
  for (const pattern of data.route.patterns || []) {
    for (const [index, stop] of (pattern.stops || []).entries()) {
      const id = stop.gtfsId || stop.name;
      const existing = stopMap.get(id) || {
        id,
        code: stripFeedPrefix(id),
        name: stop.name || id,
        lat: stop.lat ?? null,
        lng: stop.lon ?? null,
        stopOrder: index + 1,
        directionIds: new Set(),
        patternCodes: new Set(),
      };
      existing.stopOrder = Math.min(existing.stopOrder, index + 1);
      if (pattern.directionId !== undefined && pattern.directionId !== null) existing.directionIds.add(String(pattern.directionId));
      if (pattern.code) existing.patternCodes.add(String(pattern.code));
      stopMap.set(id, existing);
    }
  }

  return {
    route: mapRoute(data.route),
    relatedStops: Array.from(stopMap.values()).map((stop) => ({
      ...stop,
      directionIds: Array.from(stop.directionIds),
      patternCodes: Array.from(stop.patternCodes),
    })),
    source: 'OTP GraphQL',
  };
}

async function fetchOtpStopDetails(stopId) {
  const data = await fetchOtpGraphql(
    `query StopDetails($id: String!) {
      stop(id: $id) {
        gtfsId
        name
        lat
        lon
        routes {
          gtfsId
          shortName
          longName
          mode
        }
      }
    }`,
    { id: stopId },
  );

  if (!data.stop) return null;
  return {
    stop: mapStop(data.stop),
    relatedRoutes: (data.stop.routes || []).map((route) => mapRoute(route)),
    source: 'OTP GraphQL',
  };
}

async function upsertOptionalTable(supabase, table, rows, onConflict) {
  if (!rows.length) return false;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) {
    console.warn(`[otpImport] optional ${table} import skipped: ${error.message}`);
    return false;
  }
  console.log(`[otpImport] imported ${table} count: ${rows.length}`);
  return true;
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
      console.log('[otpImport] transit_routes and transit_stops already have data; checking optional relationship tables.');
    }

    let catalog = {};
    try {
      catalog = await fetchOtpCatalog();
    } catch (err) {
      console.warn(`[otpImport] OTP catalog fetch failed: ${err.message}`);
    }

    if (routesEmpty) {
      let routes = (catalog.routes || []).map(mapRoute).filter((route) => route.id);
      if (!routes.length) routes = readGtfsRoutes();
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

    const trips = readGtfsRows('trips.txt').map((row) => ({
      id: row.trip_id,
      trip_id: row.trip_id,
      route_id: row.route_id,
      service_id: row.service_id || null,
      trip_headsign: row.trip_headsign || null,
      direction_id: row.direction_id || null,
      raw: row,
    })).filter((trip) => trip.id && trip.route_id);
    await upsertOptionalTable(supabase, 'transit_trips', trips, 'id');

    const stopTimes = readGtfsRows('stop_times.txt').map((row) => ({
      id: `${row.trip_id}:${row.stop_sequence}:${row.stop_id}`,
      trip_id: row.trip_id,
      stop_id: row.stop_id,
      stop_sequence: row.stop_sequence ? Number(row.stop_sequence) : null,
      arrival_time: row.arrival_time || null,
      departure_time: row.departure_time || null,
      raw: row,
    })).filter((stopTime) => stopTime.trip_id && stopTime.stop_id);
    await upsertOptionalTable(supabase, 'transit_stop_times', stopTimes, 'id');
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

export async function getTransitRouteDetails(routeId) {
  if (!routeId) throw new Error('Route id is required');

  let otpDetails = null;
  try {
    otpDetails = await fetchOtpRouteDetails(routeId);
  } catch (err) {
    console.warn(`[otpImport] OTP route details failed for ${routeId}: ${err.message}`);
  }

  const gtfsDetails = otpDetails || getGtfsRouteDetails(routeId);
  const storedRoute = await getStoredRoute(routeId).catch(() => null);

  if (gtfsDetails) {
    return {
      route: {
        ...(storedRoute || {}),
        ...gtfsDetails.route,
        source: gtfsDetails.source,
        imported_at: storedRoute?.imported_at || storedRoute?.created_at || null,
      },
      relatedStops: gtfsDetails.relatedStops,
      relatedStopsCount: gtfsDetails.relatedStops.length,
      source: gtfsDetails.source,
    };
  }

  if (!storedRoute) {
    const err = new Error('Transit route not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    route: storedRoute,
    relatedStops: [],
    relatedStopsCount: 0,
    source: storedRoute.source || 'Supabase',
    warning: 'No related stops found in OTP or GTFS data.',
  };
}

export async function getTransitStopDetails(stopId) {
  if (!stopId) throw new Error('Stop id is required');

  let otpDetails = null;
  try {
    otpDetails = await fetchOtpStopDetails(stopId);
  } catch (err) {
    console.warn(`[otpImport] OTP stop details failed for ${stopId}: ${err.message}`);
  }

  const gtfsDetails = otpDetails || getGtfsStopDetails(stopId);
  const storedStop = await getStoredStop(stopId).catch(() => null);

  if (gtfsDetails) {
    return {
      stop: {
        ...(storedStop || {}),
        ...gtfsDetails.stop,
        source: gtfsDetails.source,
        imported_at: storedStop?.imported_at || storedStop?.created_at || null,
      },
      relatedRoutes: gtfsDetails.relatedRoutes,
      relatedRoutesCount: gtfsDetails.relatedRoutes.length,
      source: gtfsDetails.source,
    };
  }

  if (!storedStop) {
    const err = new Error('Transit stop not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    stop: storedStop,
    relatedRoutes: [],
    relatedRoutesCount: 0,
    source: storedStop.source || 'Supabase',
    warning: 'No related routes found in OTP or GTFS data.',
  };
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
        route_short_names: row.route_short_names || [],
        route_long_names: row.route_long_names || [],
        route_ids: row.route_ids || [],
        latest_route_short_names: row.route_short_names || [],
        latest_route_long_names: row.route_long_names || [],
        latest_route_ids: row.route_ids || [],
      });
      continue;
    }

    existing.search_count += 1;
    existing.route_short_names = Array.from(new Set([...(existing.route_short_names || []), ...(row.route_short_names || [])]));
    existing.route_long_names = Array.from(new Set([...(existing.route_long_names || []), ...(row.route_long_names || [])]));
    existing.route_ids = Array.from(new Set([...(existing.route_ids || []), ...(row.route_ids || [])]));
    if (new Date(row.created_at || 0) > new Date(existing.latest_created_at || 0)) {
      existing.total_routes = row.total_routes;
      existing.latest_created_at = row.created_at;
      existing.latest_itineraries = row.itineraries;
      existing.latest_route_short_names = row.route_short_names || [];
      existing.latest_route_long_names = row.route_long_names || [];
      existing.latest_route_ids = row.route_ids || [];
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(b.latest_created_at || 0).getTime() - new Date(a.latest_created_at || 0).getTime()
  );
}
