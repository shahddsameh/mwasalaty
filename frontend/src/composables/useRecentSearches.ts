import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type RecentSearchRecord } from "@/db/appDb";
import {
  addRecentSearch as addRecentSearchRepo,
  clearRecentSearches as clearRecentSearchesRepo,
} from "@/core/offline/repositories/recentSearchesRepository";

/**
 * Composable for managing recent searches with offline-first support
 * 
 * Recent searches are stored locally and automatically deduplicated.
 * The list is limited to the most recent searches.
 */
export function useRecentSearches(limit = 10) {
  // Use liveQuery for reactive updates from IndexedDB
  const recentSearches = useObservable(
    from(
      liveQuery(() =>
        db.recentSearches.orderBy("searchedAt").reverse().limit(limit).toArray(),
      ),
    ),
    { initialValue: [] as RecentSearchRecord[] },
  );

  return {
    recentSearches,
    
    /**
     * Add a recent search (automatically deduplicates)
     */
    addRecentSearch: (search: Omit<RecentSearchRecord, "id">) =>
      addRecentSearchRepo(search),
    
    /**
     * Clear all recent searches
     */
    clearRecentSearches: () => clearRecentSearchesRepo(),
  };
}
