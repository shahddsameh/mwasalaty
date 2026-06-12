import { db, type FavoritePlace } from '@/db/appDb';
import { queuePendingAction, registerSyncHandler, SyncDeferredError } from '../syncQueue';
import { checkOnline } from '../networkStatus';
import { getCurrentSession } from '@/services/supabaseAuth';

/**
 * Favorite Places Repository
 * Implements offline-first pattern for saved places
 */

export type DataSource = 'cache' | 'network';

export interface FavoritePlacesResult {
  data: FavoritePlace[];
  source: DataSource;
  isStale?: boolean;
}

/**
 * Get all favorite places (offline-first)
 */
export async function getFavoritePlaces(): Promise<FavoritePlacesResult> {
  // Always read from local cache first
  const cachedPlaces = await db.favoritePlaces.orderBy('name').toArray();

  return {
    data: cachedPlaces,
    source: 'cache',
    isStale: false, // Favorite places are user-managed, not stale
  };
}

/**
 * Save a favorite place (offline-first with optimistic updates)
 */
export async function saveFavoritePlace(place: FavoritePlace): Promise<void> {
  const now = Date.now();
  const placeWithTimestamp = {
    ...place,
    createdAt: place.createdAt || now,
    updatedAt: now,
  };

  // Optimistically update local cache immediately
  await db.favoritePlaces.put(placeWithTimestamp);

  // Queue for backend sync if needed
  if (checkOnline()) {
    // When online, queue the action (it will sync immediately or retry)
    await queuePendingAction('create', 'favoritePlace', placeWithTimestamp, place.id);
  } else {
    // When offline, queue for later sync
    await queuePendingAction('create', 'favoritePlace', placeWithTimestamp, place.id);
  }
}

/**
 * Update a favorite place
 */
export async function updateFavoritePlace(
  id: string,
  updates: Partial<FavoritePlace>,
): Promise<void> {
  const now = Date.now();
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: now,
  };

  // Optimistically update local cache
  await db.favoritePlaces.update(id, updatesWithTimestamp);

  // Queue for backend sync
  await queuePendingAction('update', 'favoritePlace', updatesWithTimestamp, id);
}

/**
 * Remove a favorite place (offline-first)
 */
export async function removeFavoritePlace(id: string): Promise<void> {
  // Optimistically remove from local cache
  await db.favoritePlaces.delete(id);

  // Queue deletion for backend sync
  await queuePendingAction('delete', 'favoritePlace', { id }, id);
}

/**
 * Clear all favorite places (use with caution!)
 */
export async function clearFavoritePlaces(): Promise<void> {
  await db.favoritePlaces.clear();
  // Note: This doesn't queue individual deletions - use with caution
}

/**
 * Sync handler for favorite places
 * This is called by the sync queue to push changes to backend
 */
async function syncFavoritePlaceAction(action: any): Promise<void> {
  const session = await getCurrentSession();
  if (!session?.access_token) throw new SyncDeferredError('Sign in to sync favorite places');

  const id = action.entityId ?? action.payload.id;
  const method = action.actionType === 'delete' ? 'DELETE' : action.actionType === 'update' ? 'PATCH' : 'PUT';
  const response = await fetch(`/api/favorite-places/${encodeURIComponent(String(id))}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(method === 'DELETE' ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(method === 'DELETE' ? {} : { body: JSON.stringify(action.payload) }),
  });
  if (!response.ok) throw new Error(await readFavoriteApiError(response));
}

async function readFavoriteApiError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.error?.message ?? `Favorite-place sync failed (${response.status})`;
}

export async function synchronizeFavoritePlaces(): Promise<void> {
  if (!checkOnline()) return;
  const session = await getCurrentSession();
  if (!session?.access_token) return;

  const headers = { Authorization: `Bearer ${session.access_token}` };
  const response = await fetch('/api/favorite-places', { headers });
  if (!response.ok) throw new Error(await readFavoriteApiError(response));

  const body = (await response.json()) as { places?: FavoritePlace[] };
  const serverPlaces = body.places ?? [];
  const localPlaces = await db.favoritePlaces.toArray();
  const merged = new Map<string, FavoritePlace>();

  for (const place of [...serverPlaces, ...localPlaces]) {
    const current = merged.get(place.id);
    if (!current || (place.updatedAt ?? place.createdAt) > (current.updatedAt ?? current.createdAt)) {
      merged.set(place.id, place);
    }
  }

  for (const place of merged.values()) {
    const serverPlace = serverPlaces.find((candidate) => candidate.id === place.id);
    if (!serverPlace || (serverPlace.updatedAt ?? serverPlace.createdAt) < (place.updatedAt ?? place.createdAt)) {
      await syncFavoritePlaceAction({ actionType: 'create', entityId: place.id, payload: place });
    }
  }

  const refreshed = await fetch('/api/favorite-places', { headers });
  if (!refreshed.ok) throw new Error(await readFavoriteApiError(refreshed));
  const refreshedBody = (await refreshed.json()) as { places?: FavoritePlace[] };
  await db.transaction('rw', db.favoritePlaces, async () => {
    await db.favoritePlaces.clear();
    await db.favoritePlaces.bulkPut(refreshedBody.places ?? []);
  });
}

// Register the sync handler
registerSyncHandler('favoritePlace', syncFavoritePlaceAction);
