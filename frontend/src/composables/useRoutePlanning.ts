import { ref, computed } from 'vue';
import { getRoutes, type RoutesResult } from '@/core/offline/repositories/routesRepository';
import { addRecentSearch } from '@/core/offline/repositories/recentSearchesRepository';
import type { ApiRouteOption, TripConstraints, TripWhen } from '@/services/api';

/**
 * Composable for route planning with offline-first support
 * 
 * Provides methods to search for routes with automatic caching and offline fallback.
 * Includes loading states and error handling.
 */
export function useRoutePlanning() {
  const routes = ref<ApiRouteOption[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const dataSource = ref<'cache' | 'network' | null>(null);
  const isStale = ref(false);
  const cachedAt = ref<number | null>(null);

  // Computed properties
  const hasRoutes = computed(() => routes.value.length > 0);
  const isFromCache = computed(() => dataSource.value === 'cache');
  const isFromNetwork = computed(() => dataSource.value === 'network');

  /**
   * Search for routes with offline-first strategy
   */
  async function searchRoutes(
    fromLabel: string,
    toLabel: string,
    filter: 'fastest' | 'cheapest' | 'comfortable' = 'fastest',
    coords: { fromCoords?: { lat: number; lng: number }; toCoords?: { lat: number; lng: number } } = {},
    when: TripWhen = { mode: 'now' },
    constraints: TripConstraints = {},
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      // Use offline-first repository
      const result: RoutesResult = await getRoutes(fromLabel, toLabel, filter, coords, when, constraints);
      
      routes.value = result.routes;
      dataSource.value = result.source;
      isStale.value = result.isStale || false;
      cachedAt.value = result.cachedAt || null;

      // Save to recent searches
      await addRecentSearch({
        from: fromLabel,
        to: toLabel,
        filter,
        searchedAt: Date.now(),
      });
    } catch (err) {
      console.error('Failed to search routes:', err);
      error.value = err instanceof Error ? err.message : 'Failed to search routes';
      routes.value = [];
      dataSource.value = null;
      isStale.value = false;
      cachedAt.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clear current routes
   */
  function clearRoutes(): void {
    routes.value = [];
    error.value = null;
    dataSource.value = null;
    isStale.value = false;
    cachedAt.value = null;
  }

  /**
   * Get human-readable cache status message
   */
  const cacheStatusMessage = computed(() => {
    if (isFromCache.value && cachedAt.value) {
      const ageMinutes = Math.floor((Date.now() - cachedAt.value) / 60000);
      if (isStale.value) {
        return `Using saved data from ${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} ago`;
      }
      return `Cached ${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} ago`;
    }
    return null;
  });

  return {
    // State
    routes,
    isLoading,
    error,
    dataSource,
    isStale,
    cachedAt,

    // Computed
    hasRoutes,
    isFromCache,
    isFromNetwork,
    cacheStatusMessage,

    // Methods
    searchRoutes,
    clearRoutes,
  };
}
