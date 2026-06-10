import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Scanner profiles are single-mode (one mode per scanner). Only the transport
// modes that actually exist in the OSM+GTFS graph are represented: BUS and
// SUBWAY (route_type 3 and 1). METRO is treated as SUBWAY — the GTFS term.
//
// Profiles are derived from the GTFS feed so the operator can scan every real
// route: one profile per metro line (M1/M2/M3) and one per bus route. Subway is
// validated per line (the rider scans the entry line and again the exit line),
// so per-line profiles each match only their own leg via routeShortName.

const __dirname = dirname(fileURLToPath(import.meta.url));
// backend/src/stores -> repo root -> otp-cairo/data/cairo/temp_extract/routes.txt
const ROUTES_TXT = join(
  __dirname,
  '..',
  '..',
  '..',
  'otp-cairo',
  'data',
  'cairo',
  'temp_extract',
  'routes.txt',
);

// The two generic catch-alls match any route of their mode. Kept first so demos
// and existing operator unit tests (scanner_bus_001 / scanner_subway_001) work.
const GENERIC_PROFILES = [
  { scannerProfileId: 'scanner_bus_001',    label: 'Bus Scanner',    operatorId: 'operator_bus_001',    deviceId: 'scanner_web_demo_bus',    mode: 'BUS' },
  { scannerProfileId: 'scanner_subway_001', label: 'Subway Scanner', operatorId: 'operator_subway_001', deviceId: 'scanner_web_demo_subway', mode: 'SUBWAY' },
];

// Fallback used only if routes.txt cannot be read/parsed at startup.
const FALLBACK_PROFILES = [
  ...GENERIC_PROFILES,
  { scannerProfileId: 'scanner_subway_m1', label: 'Subway M1', operatorId: 'operator_subway_001', deviceId: 'scanner_web_l1', mode: 'SUBWAY', routeShortName: 'M1' },
  { scannerProfileId: 'scanner_subway_m2', label: 'Subway M2', operatorId: 'operator_subway_001', deviceId: 'scanner_web_l2', mode: 'SUBWAY', routeShortName: 'M2' },
  { scannerProfileId: 'scanner_subway_m3', label: 'Subway M3', operatorId: 'operator_subway_001', deviceId: 'scanner_web_l3', mode: 'SUBWAY', routeShortName: 'M3' },
  { scannerProfileId: 'scanner_bus_14',  label: 'Bus 14',  operatorId: 'operator_bus_001', deviceId: 'scanner_web_demo_001', mode: 'BUS', routeShortName: '14' },
  { scannerProfileId: 'scanner_bus_108', label: 'Bus 108', operatorId: 'operator_bus_001', deviceId: 'scanner_web_demo_002', mode: 'BUS', routeShortName: '108' },
];

// Minimal quote-aware CSV row parser — handles double-quoted fields that may
// contain commas (e.g. some route_long_name values).
function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { value += '"'; i++; }
        else inQuotes = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(value);
      value = '';
    } else {
      value += ch;
    }
  }
  fields.push(value);
  return fields;
}

function buildProfilesFromGtfs() {
  const raw = readFileSync(ROUTES_TXT, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = parseCsvLine(lines[0]).map(h => h.trim());
  const idx = {
    routeId: header.indexOf('route_id'),
    shortName: header.indexOf('route_short_name'),
    longName: header.indexOf('route_long_name'),
    routeType: header.indexOf('route_type'),
  };

  const subway = [];
  const bus = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const routeId = (cols[idx.routeId] ?? '').trim();
    const shortName = (cols[idx.shortName] ?? '').trim();
    const longName = (cols[idx.longName] ?? '').trim();
    const routeType = (cols[idx.routeType] ?? '').trim();
    if (!routeId || !shortName) continue;

    if (routeType === '1') {
      subway.push({
        scannerProfileId: `scanner_subway_${shortName.toLowerCase()}`,
        label: `Subway ${shortName}${longName ? ` — ${longName}` : ''}`,
        operatorId: 'operator_subway_001',
        deviceId: `scanner_web_${routeId}`,
        mode: 'SUBWAY',
        routeShortName: shortName,
      });
    } else if (routeType === '3') {
      bus.push({
        scannerProfileId: `scanner_bus_${routeId}`,
        label: `Bus ${shortName}${longName ? ` — ${longName}` : ''}`,
        operatorId: 'operator_bus_001',
        deviceId: `scanner_web_${routeId}`,
        mode: 'BUS',
        routeShortName: shortName,
      });
    }
  }

  return [...GENERIC_PROFILES, ...subway, ...bus];
}

let profiles;
try {
  profiles = buildProfilesFromGtfs();
} catch (err) {
  console.warn(
    `[scannerProfileStore] Could not load GTFS routes from ${ROUTES_TXT}; ` +
      `falling back to static demo profiles. ${err?.message ?? err}`,
  );
  profiles = FALLBACK_PROFILES;
}

export function getAllProfiles() {
  return profiles;
}

export function getProfileById(id) {
  return profiles.find(p => p.scannerProfileId === id) ?? null;
}
