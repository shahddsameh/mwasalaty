import { LOCAL_PLACES, normalizePlaceName } from '../data-seed/localPlaces.js';
import * as catalogStore from '../stores/catalogStore.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MAPBOX_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const CAIRO_PROXIMITY = '31.2357,30.0444';
const NOMINATIM_MIN_INTERVAL_MS = 1000;

const NORMALIZED_LOCAL_PLACES = Object.fromEntries(
  Object.entries(LOCAL_PLACES).map(([name, coordinates]) => [
    normalizePlaceName(name),
    { ...coordinates, label: name, source: 'local' },
  ])
);

const cache = new Map();
let lastNominatimRequestAt = 0;

export { normalizePlaceName };

export class GeocodingError extends Error {
  constructor(message, details = {}, statusCode = 404) {
    super(message);
    this.name = 'GeocodingError';
    this.details = details;
    this.statusCode = statusCode;
  }
}

export function clearCache() {
  cache.clear();
}

export async function resolvePlace(place) {
  const query = String(place ?? '').trim();
  const normalized = normalizePlaceName(query);
  if (!normalized) throw new GeocodingError('Place label is required');

  const catalogPlace = catalogStore.listActivePlaces().find((candidate) =>
    [candidate.name, ...(candidate.aliases ?? [])].some((name) => normalizePlaceName(name) === normalized)
  );
  if (catalogPlace) {
    return { ...catalogPlace.location, label: catalogPlace.name, source: 'catalog' };
  }

  if (cache.has(normalized)) return cache.get(normalized);
  const localPlace = NORMALIZED_LOCAL_PLACES[normalized];
  if (localPlace) return cacheResult(normalized, { ...localPlace, label: query });

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
    throw new GeocodingError(`Mapbox geocoding failed with HTTP ${response.status}`, { provider: 'mapbox', status: response.status }, 503);
  }
  const feature = (await response.json()).features?.[0];
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
  const response = await fetch(url, { headers: { 'User-Agent': process.env.NOMINATIM_USER_AGENT || 'MwasalatyStudentProject/1.0' } });
  if (!response.ok) {
    throw new GeocodingError(`Nominatim geocoding failed with HTTP ${response.status}`, { provider: 'nominatim', status: response.status }, 503);
  }
  const result = (await response.json())[0];
  if (!result) return null;
  return { lat: Number.parseFloat(result.lat), lng: Number.parseFloat(result.lon), label: result.display_name || query, source: 'nominatim' };
}
