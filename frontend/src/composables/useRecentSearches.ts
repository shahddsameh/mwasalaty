import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type RecentSearchRecord } from "@/db/appDb";

export function useRecentSearches(limit = 10) {
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
    addRecentSearch: (search: Omit<RecentSearchRecord, "id">) =>
      db.recentSearches.add(search),
    clearRecentSearches: () => db.recentSearches.clear(),
  };
}
