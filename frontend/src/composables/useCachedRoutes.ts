import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type CachedRoute } from "@/db/appDb";
import { removeCachedRoute as removeCachedRouteRepo } from "@/core/offline/repositories/routesRepository";

/**
 * Composable for the offline-cached routes (offline-first).
 *
 * Routes are cached automatically by routesRepository.getRoutes on every
 * successful plan. This exposes them reactively (newest first) for the
 * Saved page's "Offline" tab, plus a single-entry remove.
 */
export function useCachedRoutes() {
  // Reactive list, newest cached first.
  const cachedRoutes = useObservable(
    from(
      liveQuery(() =>
        db.cachedRoutes.orderBy("cachedAt").reverse().toArray(),
      ),
    ),
    { initialValue: [] as CachedRoute[] },
  );

  return {
    cachedRoutes,

    /**
     * Remove a single cached route by its composite key.
     */
    removeCachedRoute: (cacheKey: string) => removeCachedRouteRepo(cacheKey),
  };
}
