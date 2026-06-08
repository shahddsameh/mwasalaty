import { db, type FavoritePlace } from '@/db/appDb';
import { queuePendingAction, registerSyncHandler } from '../syncQueue';
import { checkOnline } from '../networkStatus';

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
  // TODO: Implement actual backend API calls when backend supports favorite places
  // For now, we'll just log and assume success since data is in Supabase
  
  console.log(`[Sync] FavoritePlace ${action.actionType}:`, action.payload);

  // When backend API is ready, implement:
  // switch (action.actionType) {
  //   case 'create':
  //     await fetch('/api/favorite-places', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(action.payload),
  //     });
  //     break;
  //   case 'update':
  //     await fetch(`/api/favorite-places/${action.entityId}`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(action.payload),
  //     });
  //     break;
  //   case 'delete':
  //     await fetch(`/api/favorite-places/${action.entityId}`, {
  //       method: 'DELETE',
  //     });
  //     break;
  // }
}

// Register the sync handler
registerSyncHandler('favoritePlace', syncFavoritePlaceAction);
