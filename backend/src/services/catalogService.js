import crypto from 'node:crypto';
import { ErrorCodes } from '../helpers/errors.js';
import * as catalogStore from '../stores/catalogStore.js';
import * as routeStore from '../stores/routeStore.js';
import * as geocodingService from './geocodingService.js';
import { normalizePlaceName } from '../data-seed/localPlaces.js';

const CAIRO_BOUNDS = { minLat: 29.7, maxLat: 30.4, minLng: 31.0, maxLng: 31.7 };

export function listPlaces(options = {}) {
  return catalogStore.listPlaces(options);
}

export function listActivePlaces(options = {}) {
  return catalogStore.listActivePlaces(options);
}

export function getPlaceById(id) {
  const place = catalogStore.getPlace(id);
  if (!place) throw { code: ErrorCodes.PLACE_NOT_FOUND, message: `Place '${id}' not found`, details: { id } };
  return place;
}

export function createPlace(input) {
  const place = validatePlace(input, { isCreate: true });
  const now = new Date().toISOString();
  place.id = `${place.type === 'station' ? 'stn' : 'stop'}_${crypto.randomBytes(6).toString('hex')}`;
  place.createdAt = now;
  place.updatedAt = now;
  const warnings = computeWarnings(place);
  catalogStore.savePlace(place);
  geocodingService.clearCache();
  return { place, warnings };
}

export function updatePlace(id, input) {
  const existing = getPlaceById(id);
  const place = validatePlace({ ...input, type: existing.type }, { isCreate: false });
  place.id = existing.id;
  place.type = existing.type;
  place.createdAt = existing.createdAt;
  place.updatedAt = new Date().toISOString();
  const warnings = computeWarnings(place, id);
  catalogStore.updatePlace(place);
  geocodingService.clearCache();
  return { place, warnings };
}

export function deletePlace(id) {
  getPlaceById(id);
  catalogStore.removePlace(id);
  geocodingService.clearCache();
  return { deleted: true, id };
}

export function validatePlace(input) {
  const fields = [];
  const name = String(input?.name ?? '').trim();
  if (!name) fields.push('name is required');
  const type = input?.type;
  if (!['stop', 'station'].includes(type)) fields.push('type must be stop or station');
  const lat = Number(input?.location?.lat);
  const lng = Number(input?.location?.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) fields.push('location.lat must be a finite number between -90 and 90');
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) fields.push('location.lng must be a finite number between -180 and 180');
  const routeIds = [...new Set((Array.isArray(input?.routeIds) ? input.routeIds : []).map((id) => String(id).trim()).filter(Boolean))];
  if (routeIds.length === 0) fields.push('routeIds must contain at least one route');
  for (const routeId of routeIds) {
    if (!routeStore.getRouteById(routeId)) {
      throw { code: ErrorCodes.ROUTE_NOT_FOUND, message: `Route '${routeId}' not found`, details: { routeId } };
    }
  }
  const line = String(input?.line ?? '').trim();
  if (type === 'station' && !line) fields.push('line is required for stations');
  if (fields.length > 0) {
    throw { code: ErrorCodes.VALIDATION_ERROR, message: 'Place validation failed', details: { fields } };
  }
  const seenAliases = new Set([normalizePlaceName(name)]);
  const aliases = (Array.isArray(input?.aliases) ? input.aliases : []).map((alias) => String(alias).trim()).filter((alias) => {
    const normalized = normalizePlaceName(alias);
    if (!normalized || seenAliases.has(normalized)) return false;
    seenAliases.add(normalized);
    return true;
  });
  return {
    type,
    name,
    aliases,
    location: { lat, lng },
    routeIds,
    status: input?.status === 'inactive' ? 'inactive' : 'active',
    ...(type === 'station' ? { line } : {}),
  };
}

export function computeWarnings(input, excludeId) {
  const warnings = [];
  const conflict = catalogStore.listPlaces().find((place) =>
    place.id !== excludeId
    && normalizePlaceName(place.name) === normalizePlaceName(input.name)
    && haversineMeters(place.location, input.location) <= 50
  );
  if (conflict) {
    warnings.push({ code: 'POSSIBLE_DUPLICATE', message: 'A nearby place has the same name', details: { conflictId: conflict.id } });
  }
  const { lat, lng } = input.location;
  if (lat < CAIRO_BOUNDS.minLat || lat > CAIRO_BOUNDS.maxLat || lng < CAIRO_BOUNDS.minLng || lng > CAIRO_BOUNDS.maxLng) {
    warnings.push({ code: 'OUT_OF_COVERAGE', message: 'This place is outside Greater Cairo coverage', details: {} });
  }
  return warnings;
}

export function getDashboardSummary() {
  const places = catalogStore.listPlaces();
  const stops = places.filter((place) => place.type === 'stop').length;
  const stations = places.filter((place) => place.type === 'station').length;
  const byLine = {};
  for (const place of places.filter((candidate) => candidate.type === 'station')) {
    byLine[place.line] = (byLine[place.line] ?? 0) + 1;
  }
  return {
    totals: { stops, stations, total: places.length },
    byLine,
    activeInactive: {
      active: places.filter((place) => place.status === 'active').length,
      inactive: places.filter((place) => place.status === 'inactive').length,
    },
    recent: [...places].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(({ id, type, name, status, updatedAt }) => ({ id, type, name, status, updatedAt })),
  };
}

function haversineMeters(a, b) {
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
