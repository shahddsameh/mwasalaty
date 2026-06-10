import { ErrorCodes } from '../helpers/errors.js';

const PLACE_TYPES = new Set(['home', 'work', 'school', 'other']);

function serviceError(code, message, details = {}) {
  return { code, message, details };
}

function config() {
  const url = String(process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  const apiKey = String(process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
  if (!url || !apiKey) {
    throw serviceError(ErrorCodes.SUPABASE_SERVICE_ERROR, 'Supabase favorite-place storage is not configured');
  }
  return { url, apiKey };
}

function validateString(value, field, maxLength, errors, required = false) {
  if (required && (typeof value !== 'string' || !value.trim())) {
    errors.push(`${field} is required`);
  } else if (value !== undefined && (typeof value !== 'string' || value.length > maxLength)) {
    errors.push(`${field} must be a string no longer than ${maxLength} characters`);
  }
}

function validateTimestamp(value, field, errors) {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    errors.push(`${field} must be a non-negative timestamp`);
  }
}

export function validateFavoritePlace(body, { partial = false } = {}) {
  const errors = [];
  validateString(body?.name, 'name', 120, errors, !partial);
  validateString(body?.address, 'address', 300, errors, !partial);
  if (body?.type !== undefined && !PLACE_TYPES.has(body.type)) {
    errors.push('type must be one of home, work, school, or other');
  }
  for (const field of ['lat', 'lng']) {
    if (body?.[field] !== undefined && !Number.isFinite(body[field])) {
      errors.push(`${field} must be numeric`);
    }
  }
  validateTimestamp(body?.createdAt, 'createdAt', errors);
  validateTimestamp(body?.updatedAt, 'updatedAt', errors);
  return errors;
}

export function validateFavoriteId(id) {
  return typeof id === 'string' && id.length >= 1 && id.length <= 200 && !/[/\\\u0000-\u001f]/.test(id);
}

function toRow(userId, id, place) {
  return {
    user_id: userId,
    id,
    name: place.name?.trim(),
    address: place.address?.trim(),
    type: place.type ?? 'other',
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    created_at: place.createdAt ?? Date.now(),
    updated_at: place.updatedAt ?? Date.now(),
  };
}

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    type: row.type,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

async function supabaseRequest(token, path, options = {}) {
  const { url, apiKey } = config();
  let response;
  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (error) {
    throw serviceError(ErrorCodes.SUPABASE_SERVICE_ERROR, 'Supabase favorite-place storage is unavailable', {
      cause: error.message,
    });
  }

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw serviceError(ErrorCodes.SUPABASE_SERVICE_ERROR, 'Supabase favorite-place request failed', details);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function listFavoritePlaces(token) {
  const rows = await supabaseRequest(token, 'favorite_places?select=*&order=name.asc');
  return rows.map(fromRow);
}

export async function upsertFavoritePlace(token, userId, id, place) {
  const existing = await supabaseRequest(
    token,
    `favorite_places?id=eq.${encodeURIComponent(id)}&select=*`
  );
  const incomingUpdatedAt = place.updatedAt ?? Date.now();
  if (existing[0] && Number(existing[0].updated_at) > incomingUpdatedAt) {
    return fromRow(existing[0]);
  }

  const rows = await supabaseRequest(token, 'favorite_places?on_conflict=user_id,id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(toRow(userId, id, place)),
  });
  return fromRow(rows[0]);
}

export async function patchFavoritePlace(token, id, updates) {
  const existing = await supabaseRequest(
    token,
    `favorite_places?id=eq.${encodeURIComponent(id)}&select=*`
  );
  if (!existing.length) {
    throw serviceError(ErrorCodes.FAVORITE_PLACE_NOT_FOUND, 'Favorite place not found', { id });
  }
  if (Number(existing[0].updated_at) > (updates.updatedAt ?? Date.now())) {
    return fromRow(existing[0]);
  }

  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.address !== undefined) payload.address = updates.address.trim();
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.lat !== undefined) payload.lat = updates.lat;
  if (updates.lng !== undefined) payload.lng = updates.lng;
  payload.updated_at = updates.updatedAt ?? Date.now();

  const rows = await supabaseRequest(token, `favorite_places?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  return fromRow(rows[0]);
}

export async function deleteFavoritePlace(token, id) {
  await supabaseRequest(token, `favorite_places?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}
