import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type SavedTrip } from "@/db/appDb";
import {
  saveTrip as saveTripRepo,
  removeSavedTrip as removeSavedTripRepo,
  clearSavedTrips as clearSavedTripsRepo,
} from "@/core/offline/repositories/savedTripsRepository";

/**
 * Composable for managing saved trips with offline-first support
 * 
 * Saved trips are stored locally and synced to backend when online.
 * All operations are optimistically updated in local cache.
 */
export function useSavedTrips() {
  // Use liveQuery for reactive updates from IndexedDB
  const savedTrips = useObservable(
    from(liveQuery(() => db.savedTrips.orderBy("createdAt").reverse().toArray())),
    { initialValue: [] as SavedTrip[] },
  );

  return {
    savedTrips,
    
    /**
     * Save a trip (offline-first with optimistic updates)
     */
    saveTrip: (trip: SavedTrip) => saveTripRepo(trip),
    
    /**
     * Remove a saved trip (offline-first)
     */
    removeTrip: (id: string) => removeSavedTripRepo(id),
    
    /**
     * Clear all saved trips
     */
    clearSavedTrips: () => clearSavedTripsRepo(),
  };
}
