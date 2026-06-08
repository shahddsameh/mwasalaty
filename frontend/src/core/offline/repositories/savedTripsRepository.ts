import { db, type SavedTrip } from '@/db/appDb';
import { queuePendingAction, registerSyncHandler } from '../syncQueue';

/**
 * Saved Trips Repository
 * Implements offline-first pattern for saved trips
 */

export type DataSource = 'cache' | 'network';

export interface SavedTripsResult {
  data: SavedTrip[];
  source: DataSource;
}

/**
 * Get all saved trips (offline-first)
 */
export async function getSavedTrips(): Promise<SavedTripsResult> {
  const trips = await db.savedTrips
    .orderBy('createdAt')
    .reverse()
    .toArray();

  return {
    data: trips,
    source: 'cache',
  };
}

/**
 * Save a trip (offline-first with optimistic updates)
 */
export async function saveTrip(trip: SavedTrip): Promise<void> {
  const now = Date.now();
  const tripWithTimestamp = {
    ...trip,
    createdAt: trip.createdAt || now,
  };

  // Optimistically update local cache
  await db.savedTrips.put(tripWithTimestamp);

  // Queue for backend sync
  await queuePendingAction('create', 'savedTrip', tripWithTimestamp, trip.id);
}

/**
 * Remove a saved trip (offline-first)
 */
export async function removeSavedTrip(id: string): Promise<void> {
  // Optimistically remove from local cache
  await db.savedTrips.delete(id);

  // Queue deletion for backend sync
  await queuePendingAction('delete', 'savedTrip', { id }, id);
}

/**
 * Clear all saved trips
 */
export async function clearSavedTrips(): Promise<void> {
  await db.savedTrips.clear();
}

/**
 * Sync handler for saved trips
 */
async function syncSavedTripAction(action: any): Promise<void> {
  // TODO: Implement actual backend API calls when backend supports saved trips
  console.log(`[Sync] SavedTrip ${action.actionType}:`, action.payload);

  // When backend API is ready, implement:
  // switch (action.actionType) {
  //   case 'create':
  //     await fetch('/api/saved-trips', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(action.payload),
  //     });
  //     break;
  //   case 'delete':
  //     await fetch(`/api/saved-trips/${action.entityId}`, {
  //       method: 'DELETE',
  //     });
  //     break;
  // }
}

// Register the sync handler
registerSyncHandler('savedTrip', syncSavedTripAction);
