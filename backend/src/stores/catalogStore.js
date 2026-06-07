import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { ErrorCodes } from '../helpers/errors.js';
import { LOCAL_PLACES, normalizePlaceName } from '../data-seed/localPlaces.js';
import { STATION_SEED } from '../data-seed/stationSeed.js';

const DEFAULT_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/catalog.json');
const CATALOG_FILE = process.env.CATALOG_FILE_PATH ? path.resolve(process.env.CATALOG_FILE_PATH) : DEFAULT_FILE;
let places = loadOrSeed();

function persistenceError(error) {
  return { code: ErrorCodes.CATALOG_PERSISTENCE_ERROR, message: 'Could not persist the place catalog', details: { cause: error?.message } };
}

function loadOrSeed() {
  try {
    fs.mkdirSync(path.dirname(CATALOG_FILE), { recursive: true });
    if (fs.existsSync(CATALOG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
      return Array.isArray(parsed.places) ? parsed.places : [];
    }
    const seeded = seedPlaces();
    persistPlaces(seeded);
    return seeded;
  } catch (error) {
    if (error?.code === ErrorCodes.CATALOG_PERSISTENCE_ERROR) throw error;
    throw persistenceError(error);
  }
}

function seedPlaces() {
  const groups = new Map();
  for (const [name, location] of Object.entries(LOCAL_PLACES)) {
    const key = `${location.lat},${location.lng}`;
    const group = groups.get(key) ?? { names: [], location };
    group.names.push(name);
    groups.set(key, group);
  }
  const now = new Date().toISOString();
  return [...groups.values()].map(({ names, location }) => {
    const stationEntry = names.map((name) => STATION_SEED[normalizePlaceName(name)]).find(Boolean);
    const looksLikeStation = names.some((name) => STATION_SEED[normalizePlaceName(name)]);
    if (looksLikeStation && !stationEntry) throw persistenceError(new Error(`Missing station seed for ${names[0]}`));
    const type = stationEntry ? 'station' : 'stop';
    return {
      id: `${type === 'station' ? 'stn' : 'stop'}_${crypto.randomBytes(6).toString('hex')}`,
      type,
      name: names[0],
      aliases: names.slice(1),
      location: { ...location },
      routeIds: stationEntry ? [stationEntry.routeId, ...(stationEntry.extraRouteIds ?? [])] : ['route_bus_generic'],
      status: 'active',
      ...(stationEntry ? { line: stationEntry.line } : {}),
      createdAt: now,
      updatedAt: now,
    };
  });
}

function persistPlaces(nextPlaces) {
  try {
    fs.mkdirSync(path.dirname(CATALOG_FILE), { recursive: true });
    fs.writeFileSync(`${CATALOG_FILE}.tmp`, JSON.stringify({ version: 1, places: nextPlaces }, null, 2));
    try {
      fs.renameSync(`${CATALOG_FILE}.tmp`, CATALOG_FILE);
    } catch (error) {
      if (error?.code !== 'EPERM') throw error;
      // Some Windows hosts deny rename even inside a writable workspace.
      fs.copyFileSync(`${CATALOG_FILE}.tmp`, CATALOG_FILE);
      try {
        fs.rmSync(`${CATALOG_FILE}.tmp`, { force: true });
      } catch {
        // The committed target is valid; a stale temp file is harmless.
      }
    }
  } catch (error) {
    throw persistenceError(error);
  }
}

function clone(place) {
  return place ? structuredClone(place) : null;
}

export function listPlaces({ type, includeInactive = true } = {}) {
  return places.filter((place) => (!type || place.type === type) && (includeInactive || place.status === 'active')).map(clone);
}

export function getPlace(id) {
  return clone(places.find((place) => place.id === id));
}

export function listActivePlaces({ q } = {}) {
  const normalizedQ = normalizePlaceName(q);
  return places.filter((place) => {
    if (place.status !== 'active') return false;
    if (!normalizedQ) return true;
    return [place.name, ...(place.aliases ?? [])].some((name) => normalizePlaceName(name).includes(normalizedQ));
  }).map(clone);
}

export function savePlace(place) {
  const next = [...places, clone(place)];
  persistPlaces(next);
  places = next;
  return clone(place);
}

export function updatePlace(place) {
  const index = places.findIndex((candidate) => candidate.id === place.id);
  if (index < 0) return null;
  const next = [...places];
  next[index] = clone(place);
  persistPlaces(next);
  places = next;
  return clone(place);
}

export function removePlace(id) {
  const next = places.filter((place) => place.id !== id);
  if (next.length === places.length) return false;
  persistPlaces(next);
  places = next;
  return true;
}
