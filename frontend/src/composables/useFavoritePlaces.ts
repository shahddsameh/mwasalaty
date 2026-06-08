import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type FavoritePlace } from "@/db/appDb";
import {
  saveFavoritePlace as saveFavoritePlaceRepo,
  removeFavoritePlace as removeFavoritePlaceRepo,
  clearFavoritePlaces as clearFavoritePlacesRepo,
} from "@/core/offline/repositories/favoritePlacesRepository";

/**
 * Composable for managing favorite places with offline-first support
 * 
 * This composable provides reactive access to favorite places and methods
 * to manage them. All operations are optimistically updated in local cache
 * and synced to backend when online.
 */
export function useFavoritePlaces() {
  // Use liveQuery for reactive updates from IndexedDB
  const favoritePlaces = useObservable(
    from(liveQuery(() => db.favoritePlaces.orderBy("name").toArray())),
    { initialValue: [] as FavoritePlace[] },
  );

  return {
    favoritePlaces,
    
    /**
     * Save a favorite place (offline-first with optimistic updates)
     */
    saveFavoritePlace: (place: FavoritePlace) => saveFavoritePlaceRepo(place),
    
    /**
     * Remove a favorite place (offline-first)
     */
    removeFavoritePlace: (id: string) => removeFavoritePlaceRepo(id),
    
    /**
     * Clear all favorite places
     */
    clearFavoritePlaces: () => clearFavoritePlacesRepo(),
  };
}
