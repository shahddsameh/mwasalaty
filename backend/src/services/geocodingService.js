const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MAPBOX_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const CAIRO_PROXIMITY = '31.2357,30.0444';
const NOMINATIM_MIN_INTERVAL_MS = 1000;

const LOCAL_PLACES = {
  abbasiya: { lat: 30.06963, lng: 31.28102 },
  abbassiya: { lat: 30.06963, lng: 31.28102 },
  'cairo stadium': { lat: 30.07286, lng: 31.31725 },
  stadium: { lat: 30.07286, lng: 31.31725 },
  attaba: { lat: 30.0558, lng: 31.2444 },
  'adly mansour': { lat: 30.1418, lng: 31.4148 },
  sadat: { lat: 30.0444, lng: 31.2357 },
  'sadat square': { lat: 30.0444, lng: 31.2357 },
  tahrir: { lat: 30.0444, lng: 31.2357 },
  'tahrir square': { lat: 30.0444, lng: 31.2357 },
  'ميدان التحرير': { lat: 30.0444, lng: 31.2357 },
  helwan: { lat: 29.8475, lng: 31.334 },
  'new el marg': { lat: 30.1302, lng: 31.3193 },
  'new el-marg': { lat: 30.1302, lng: 31.3193 },
  'shubra el kheima': { lat: 30.1225, lng: 31.2438 },
  'shubra el-kheima': { lat: 30.1225, lng: 31.2438 },
  giza: { lat: 30.0082, lng: 31.2146 },
  'giza station': { lat: 30.0082, lng: 31.2146 },
  'el mounib': { lat: 29.9742, lng: 31.1997 },
  'el-mounib': { lat: 29.9742, lng: 31.1997 },
  'el maadi': { lat: 29.9587, lng: 31.2533 },
  'el-maadi': { lat: 29.9587, lng: 31.2533 },
  maadi: { lat: 29.9587, lng: 31.2533 },
  'المعادي': { lat: 29.9587, lng: 31.2533 },
  zamalek: { lat: 30.0618, lng: 31.2194 },
  'الزمالك': { lat: 30.0618, lng: 31.2194 },
  'nasr city': { lat: 30.05957, lng: 31.34438 },
  'مدينة نصر': { lat: 30.05957, lng: 31.34438 },
  'makram ebeid': { lat: 30.05957, lng: 31.34438 },
  'makram ebeid nasr city': { lat: 30.05957, lng: 31.34438 },
  'makram ebeid, nasr city': { lat: 30.05957, lng: 31.34438 },
  'al tawheed wal nour mostafa al nahas': { lat: 30.0544619, lng: 31.346392 },
  'al tawheed wal nour - mostafa al nahas': { lat: 30.0544619, lng: 31.346392 },
  'awwal makram ebeid': { lat: 30.069495, lng: 31.3438036 },
  ramses: { lat: 30.06247, lng: 31.24715 },
  'al shohadaa': { lat: 30.06108, lng: 31.24606 },
  'al-shohadaa': { lat: 30.06108, lng: 31.24606 },
  faisal: { lat: 30.01714, lng: 31.20382 },
  'cairo university': { lat: 30.01309, lng: 31.20869 },
  'cairo university metro': { lat: 30.0262473, lng: 31.2014575 },
  'cairo university main gate': { lat: 30.0280115, lng: 31.2105681 },
};

const NORMALIZED_LOCAL_PLACES = Object.fromEntries(
  Object.entries(LOCAL_PLACES).map(([name, coordinates]) => [
    normalizePlaceName(name),
    { ...coordinates, label: name, source: 'local' },
  ]),
);

const cache = new Map();
let lastNominatimRequestAt = 0;

export class GeocodingError extends Error {
  constructor(message, details = {}, statusCode = 404) {
    super(message);
    this.name = 'GeocodingError';
    this.details = details;
    this.statusCode = statusCode;
  }
}

export function normalizePlaceName(place) {
  return String(place ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export async function resolvePlace(place) {
  const query = String(place ?? '').trim();
  const normalized = normalizePlaceName(query);

  if (!normalized) {
    throw new GeocodingError('Place label is required');
  }

  if (cache.has(normalized)) {
    return cache.get(normalized);
  }

  const localPlace = NORMALIZED_LOCAL_PLACES[normalized];
  if (localPlace) {
    return cacheResult(normalized, {
      lat: localPlace.lat,
      lng: localPlace.lng,
      label: query,
      source: localPlace.source,
    });
  }

  const resolved = process.env.MAPBOX_ACCESS_TOKEN
    ? await geocodeWithMapbox(query)
    : await geocodeWithNominatim(query);

  if (!resolved) {
    throw new GeocodingError(`Could not find coordinates for ${query}.`, {
      query,
      provider: process.env.MAPBOX_ACCESS_TOKEN ? 'mapbox' : 'nominatim',
    });
  }

  return cacheResult(normalized, resolved);
}

function cacheResult(key, value) {
  cache.set(key, value);
  return value;
}

async function geocodeWithMapbox(query) {
  const url = new URL(MAPBOX_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', process.env.MAPBOX_ACCESS_TOKEN);
  url.searchParams.set('country', 'eg');
  url.searchParams.set('language', 'ar,en');
  url.searchParams.set('proximity', CAIRO_PROXIMITY);
  url.searchParams.set('limit', '5');

  const response = await fetch(url);
  if (!response.ok) {
    throw new GeocodingError(`Mapbox geocoding failed with HTTP ${response.status}`, {
      provider: 'mapbox',
      status: response.status,
    }, 503);
  }

  const data = await response.json();
  const feature = data.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;

  return {
    lat: coordinates[1],
    lng: coordinates[0],
    label: feature.properties?.name_preferred || feature.properties?.name || query,
    source: 'mapbox',
  };
}

async function geocodeWithNominatim(query) {
  const elapsed = Date.now() - lastNominatimRequestAt;
  if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, NOMINATIM_MIN_INTERVAL_MS - elapsed));
  }
  lastNominatimRequestAt = Date.now();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', `${query}, Cairo, Egypt`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'eg');
  url.searchParams.set('accept-language', 'ar,en');
  url.searchParams.set('email', process.env.NOMINATIM_EMAIL || 'student-project@example.com');

  const response = await fetch(url, {
    headers: {
      'User-Agent': process.env.NOMINATIM_USER_AGENT || 'MwasalatyStudentProject/1.0',
    },
  });
  if (!response.ok) {
    throw new GeocodingError(`Nominatim geocoding failed with HTTP ${response.status}`, {
      provider: 'nominatim',
      status: response.status,
    }, 503);
  }

  const data = await response.json();
  const result = data[0];
  if (!result) return null;

  return {
    lat: Number.parseFloat(result.lat),
    lng: Number.parseFloat(result.lon),
    label: result.display_name || query,
    source: 'nominatim',
  };
}
