import { readFileSync } from 'node:fs';
import { ARABIC_LABELS, LANDMARKS } from '../data/placeOverlay.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MAPBOX_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const CAIRO_PROXIMITY = '31.2357,30.0444';
const NOMINATIM_MIN_INTERVAL_MS = 1000;

// Data-derived place core: generated straight from the GTFS feed
// (scripts/generate_places.py), so coordinates match the OTP graph and every
// suggestion routes. The GTFS has no Arabic and no landmarks, so those are
// layered on from the curated overlay (../data/placeOverlay.js).
const GENERATED_PLACES = JSON.parse(
  readFileSync(new URL('../data/places.generated.json', import.meta.url), 'utf-8')
);

// English (normalized) -> Arabic label, combining stop translations with
// landmark names. Landmarks are folded in too because some GTFS stops share a
// landmark's name (e.g. a bus stop literally named "City Stars Mall"); without
// this they would win deduplication and lose their Arabic label.
const EN_TO_AR = (() => {
  const map = {};
  for (const [en, ar] of Object.entries(ARABIC_LABELS)) {
    map[normalizePlaceName(en)] = ar;
  }
  for (const place of LANDMARKS) {
    if (place.arLabel) map[normalizePlaceName(place.label)] = place.arLabel;
  }
  return map;
})();

// Unified, deduped dataset: each entry carries both an English `label` and an
// optional Arabic `arLabel`. Deduplicated by normalized English label.
const ALL_PLACES = (() => {
  const seen = new Set();
  const list = [];
  const push = (label, arLabel, lat, lng) => {
    const key = normalizePlaceName(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    list.push({ label, arLabel: arLabel ?? null, lat, lng });
  };
  for (const p of GENERATED_PLACES) {
    const ar = EN_TO_AR[normalizePlaceName(p.label)] ?? null;
    push(p.label, ar, p.lat, p.lng);
  }
  for (const p of LANDMARKS) {
    push(p.label, p.arLabel ?? null, p.lat, p.lng);
  }
  return list;
})();

// Resolver index keyed by BOTH the normalized English and Arabic labels, so a
// query in either language maps straight to coordinates without a network call.
const NORMALIZED_LOCAL_PLACES = (() => {
  const map = {};
  for (const place of ALL_PLACES) {
    const entry = { lat: place.lat, lng: place.lng, label: place.label, source: 'local' };
    map[normalizePlaceName(place.label)] = entry;
    if (place.arLabel) map[normalizePlaceName(place.arLabel)] = entry;
  }
  return map;
})();

// Autocomplete corpus for /api/places/search. Pre-normalizes both labels so the
// search can match English or Arabic input.
const SEARCHABLE_PLACES = ALL_PLACES.map((place) => ({
  label: place.label,
  arLabel: place.arLabel,
  normalized: normalizePlaceName(place.label),
  normalizedAr: place.arLabel ? normalizePlaceName(place.arLabel) : null,
  lat: place.lat,
  lng: place.lng,
  source: 'local',
}));

const cache = new Map();
let lastNominatimRequestAt = 0;

/**
 * Autocomplete-style place search over the in-coverage places.
 * Matches English OR Arabic labels, ranking starts-with matches ahead of
 * contains matches. Returns up to `limit` of { label, lat, lng, source }.
 */
export function searchPlaces(query, limit = 8) {
  const normalized = normalizePlaceName(query);
  const toResult = ({ label, lat, lng, source }) => ({ label, lat, lng, source });

  if (!normalized) return SEARCHABLE_PLACES.slice(0, limit).map(toResult);

  const startsWith = [];
  const contains = [];
  for (const place of SEARCHABLE_PLACES) {
    const { normalized: en, normalizedAr: ar } = place;
    if (en.startsWith(normalized) || (ar && ar.startsWith(normalized))) {
      startsWith.push(place);
    } else if (en.includes(normalized) || (ar && ar.includes(normalized))) {
      contains.push(place);
    }
  }
  return [...startsWith, ...contains].slice(0, limit).map(toResult);
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
    // Arabic tashkeel (diacritics), superscript alef, and tatweel
    .replace(/[ً-ٰٟـ]/g, '')
    // Unify alef variants (أ إ آ ٱ) -> ا
    .replace(/[أإآٱ]/g, 'ا')
    // Ta marbuta (ة) -> ha (ه); alef maqsura (ى) -> ya (ي)
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    // Treat Arabic/Latin commas and dashes/underscores as separators
    .replace(/[،,]/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
