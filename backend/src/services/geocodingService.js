const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MAPBOX_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const CAIRO_PROXIMITY = '31.2357,30.0444';
const NOMINATIM_MIN_INTERVAL_MS = 1000;

// All entries are derived from the live OSM+GTFS graph (verified coverage).
// - The 61 SUBWAY (metro) stops use their exact GTFS coordinates.
// - Aliases map common search spellings onto the right stop.
// - Curated landmarks are only kept when within ~1.2 km of a graph stop so they
//   actually route. Out-of-coverage places (e.g. Cairo Airport) are intentionally absent.
const LOCAL_PLACES = {
  // --- SUBWAY / metro stops (exact GTFS coords) ---
  'abbassiya': { lat: 30.06966, lng: 31.28107 },
  'abdou pasha': { lat: 30.06474, lng: 31.27484 },
  'ain helwan': { lat: 29.86261, lng: 31.32507 },
  'ain shams': { lat: 30.13102, lng: 31.31894 },
  'al-ahram': { lat: 30.09126, lng: 31.32664 },
  'al-sayeda zeinab': { lat: 30.02903, lng: 31.2355 },
  'al-shohadaa': { lat: 30.06163, lng: 31.24627 },
  'attaba': { lat: 30.05333, lng: 31.24771 },
  'bab el-shaaria': { lat: 30.05388, lng: 31.25618 },
  'bohooth': { lat: 30.03575, lng: 31.20029 },
  'cairo university': { lat: 30.02625, lng: 31.20146 },
  'dar el-salam': { lat: 29.98211, lng: 31.24256 },
  'dokki': { lat: 30.0384, lng: 31.2124 },
  'el-demerdash': { lat: 30.07688, lng: 31.27774 },
  'el-geish': { lat: 30.06184, lng: 31.267 },
  'el-giza': { lat: 30.01059, lng: 31.2072 },
  'el-maasara': { lat: 29.90639, lng: 31.29966 },
  'el-malek el-saleh': { lat: 30.01766, lng: 31.23123 },
  'el-marg': { lat: 30.15211, lng: 31.33548 },
  'el-matareyya': { lat: 30.12092, lng: 31.31379 },
  'el-mounib': { lat: 29.98164, lng: 31.21138 },
  'el-zahraa': { lat: 29.99556, lng: 31.23159 },
  'ezbet el-nakhl': { lat: 30.13932, lng: 31.32472 },
  'fair zone': { lat: 30.07312, lng: 31.30086 },
  'faisal': { lat: 30.01738, lng: 31.20359 },
  'ghamra': { lat: 30.0689, lng: 31.26484 },
  'hadayek el-maadi': { lat: 29.96989, lng: 31.251 },
  'hadayek helwan': { lat: 29.8972, lng: 31.3041 },
  'hadayeq el-zaitoun': { lat: 30.10608, lng: 31.31034 },
  'hammamat el-qobba': { lat: 30.09107, lng: 31.29863 },
  'helmeyet el-zaitoun': { lat: 30.11328, lng: 31.31388 },
  'helwan': { lat: 29.84921, lng: 31.33443 },
  'helwan university': { lat: 29.86946, lng: 31.32009 },
  'khalafawy': { lat: 30.09792, lng: 31.24545 },
  'kobri el-qobba': { lat: 30.08702, lng: 31.29426 },
  'koleyet el-banat': { lat: 30.08405, lng: 31.32912 },
  'kolleyyet el-zeraa': { lat: 30.11358, lng: 31.24907 },
  'kozzika': { lat: 29.93656, lng: 31.28175 },
  'maadi': { lat: 29.96032, lng: 31.25781 },
  'manshiet el-sadr': { lat: 30.08216, lng: 31.28753 },
  'mar girgis': { lat: 30.00624, lng: 31.2297 },
  'masarra': { lat: 30.07097, lng: 31.24503 },
  'mezallat': { lat: 30.10391, lng: 31.24601 },
  'mohamed naguib': { lat: 30.04529, lng: 31.24423 },
  'nasser': { lat: 30.05333, lng: 31.23865 },
  'new el-marg': { lat: 30.16351, lng: 31.33838 },
  'omm el-misryeen': { lat: 30.00596, lng: 31.20777 },
  'opera': { lat: 30.04191, lng: 31.22505 },
  'orabi': { lat: 30.05708, lng: 31.24253 },
  'rod el farag': { lat: 30.08051, lng: 31.24539 },
  'saad zaghloul': { lat: 30.03557, lng: 31.23784 },
  'sadat': { lat: 30.04403, lng: 31.23567 },
  'sakanat el-maadi': { lat: 29.95335, lng: 31.263 },
  'sakiat mekki': { lat: 29.99532, lng: 31.20851 },
  'saray el-qobba': { lat: 30.09762, lng: 31.3045 },
  'shubra el-kheima': { lat: 30.12246, lng: 31.24455 },
  'st. teresa': { lat: 30.08776, lng: 31.2454 },
  'stadium': { lat: 30.07284, lng: 31.31724 },
  'tora el-asmant': { lat: 29.92653, lng: 31.28792 },
  'tora el-balad': { lat: 29.94666, lng: 31.27268 },
  'wadi hof': { lat: 29.87909, lng: 31.31363 },

  // --- Common aliases mapped onto the right stop ---
  'tahrir': { lat: 30.04403, lng: 31.23567 },
  'tahrir square': { lat: 30.04403, lng: 31.23567 },
  'sadat square': { lat: 30.04403, lng: 31.23567 },
  'ramses': { lat: 30.06163, lng: 31.24627 },
  'giza': { lat: 30.01059, lng: 31.2072 },
  'giza station': { lat: 30.01059, lng: 31.2072 },

  // --- Curated landmarks (verified in-coverage) ---
  'egyptian museum': { lat: 30.0478, lng: 31.2336 },
  'cairo tower': { lat: 30.0459, lng: 31.2243 },
  'khan el-khalili': { lat: 30.0477, lng: 31.2622 },
  'downtown cairo': { lat: 30.05, lng: 31.24 },
  'zamalek': { lat: 30.0618, lng: 31.2194 },
  'heliopolis': { lat: 30.0878, lng: 31.326 },
  'nasr city': { lat: 30.0511, lng: 31.3656 },
  'makram ebeid': { lat: 30.0596, lng: 31.3444 },
  'city stars mall': { lat: 30.0726, lng: 31.3457 },
  'cairo stadium': { lat: 30.07284, lng: 31.31724 },
  'giza pyramids': { lat: 29.9773, lng: 31.1325 },
  'grand egyptian museum': { lat: 29.9939, lng: 31.119 },
  'new cairo': { lat: 30.03, lng: 31.47 },
  'adly mansour': { lat: 30.1418, lng: 31.4148 },

  // --- Arabic aliases (map onto covered places) ---
  'ميدان التحرير': { lat: 30.04403, lng: 31.23567 },
  'المعادي': { lat: 29.96032, lng: 31.25781 },
  'الزمالك': { lat: 30.0618, lng: 31.2194 },
  'مدينة نصر': { lat: 30.0511, lng: 31.3656 },
};

const NORMALIZED_LOCAL_PLACES = Object.fromEntries(
  Object.entries(LOCAL_PLACES).map(([name, coordinates]) => [
    normalizePlaceName(name),
    { ...coordinates, label: name, source: 'local' },
  ])
);

// Pre-built, deduped list used for the /api/places/search autocomplete.
// Reuses the same LOCAL_PLACES coverage so every suggestion is routable.
const SEARCHABLE_PLACES = (() => {
  const seen = new Set();
  const list = [];
  for (const [name, coords] of Object.entries(LOCAL_PLACES)) {
    const label = toDisplayLabel(name);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      label,
      normalized: normalizePlaceName(name),
      lat: coords.lat,
      lng: coords.lng,
      source: 'local',
    });
  }
  return list;
})();

const cache = new Map();
let lastNominatimRequestAt = 0;

function toDisplayLabel(name) {
  // Keep Arabic / non-Latin labels as authored; Title-Case Latin ones.
  if (/[\u0080-\uffff]/.test(name)) return name;
  return name.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Autocomplete-style place search over the curated in-coverage places.
 * Ranks starts-with matches ahead of contains matches (mirrors the client).
 * Returns up to `limit` of { label, lat, lng, source }.
 */
export function searchPlaces(query, limit = 8) {
  const normalized = normalizePlaceName(query);
  const strip = ({ normalized: _n, ...rest }) => rest;

  if (!normalized) return SEARCHABLE_PLACES.slice(0, limit).map(strip);

  const startsWith = [];
  const contains = [];
  for (const place of SEARCHABLE_PLACES) {
    if (place.normalized.startsWith(normalized)) startsWith.push(place);
    else if (place.normalized.includes(normalized)) contains.push(place);
  }
  return [...startsWith, ...contains].slice(0, limit).map(strip);
}

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
