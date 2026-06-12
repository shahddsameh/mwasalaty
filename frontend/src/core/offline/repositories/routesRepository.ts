import { db, type CachedRoute } from '@/db/appDb';
import { checkOnline } from '../networkStatus';
import { planRoute, type ApiRouteOption, type TripConstraints, type TripWhen } from '@/services/api';

/**
 * Routes Repository
 * Implements offline-first pattern for route planning
 */

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export type DataSource = 'cache' | 'network';

export interface RoutesResult {
  routes: ApiRouteOption[];
  source: DataSource;
  isStale: boolean;
  cachedAt?: number;
}

/**
 * Generate cache key for route query
 */
function getCacheKey(from: string, to: string, filter: string, constraints: TripConstraints = {}): string {
  return `${from}|${to}|${filter}|${constraints.maxDurationMinutes ?? ''}`;
}

/**
 * Check if cached route is still valid
 */
function isCacheValid(cachedRoute: CachedRoute): boolean {
  return Date.now() < cachedRoute.expiresAt;
}

/**
 * Get routes with offline-first strategy
 */
export async function getRoutes(
  fromLabel: string,
  toLabel: string,
  filter: 'fastest' | 'cheapest' | 'comfortable' = 'fastest',
  coords: { fromCoords?: { lat: number; lng: number }; toCoords?: { lat: number; lng: number } } = {},
  when: TripWhen = { mode: 'now' },
  constraints: TripConstraints = {},
): Promise<RoutesResult> {
  const cacheKey = getCacheKey(fromLabel, toLabel, filter, constraints);

  // Try to get from cache first
  const cachedRoute = await db.cachedRoutes.get(cacheKey);

  // If offline, return cached data or throw
  if (!checkOnline()) {
    if (cachedRoute) {
      return {
        routes: cachedRoute.routes,
        source: 'cache',
        isStale: !isCacheValid(cachedRoute),
        cachedAt: cachedRoute.cachedAt,
      };
    }
    throw new Error('No cached route available and device is offline');
  }

  // If online, try to fetch fresh data
  try {
    const routes = await planRoute(fromLabel, toLabel, filter, coords, when, constraints);
    
    // Cache the result
    const now = Date.now();
    await db.cachedRoutes.put({
      cacheKey,
      from: fromLabel,
      to: toLabel,
      filter,
      routes,
      cachedAt: now,
      expiresAt: now + CACHE_DURATION_MS,
    });

    return {
      routes,
      source: 'network',
      isStale: false,
    };
  } catch (error) {
    console.warn('Failed to fetch routes from network:', error);

    // Fallback to cache if available
    if (cachedRoute) {
      return {
        routes: cachedRoute.routes,
        source: 'cache',
        isStale: !isCacheValid(cachedRoute),
        cachedAt: cachedRoute.cachedAt,
      };
    }

    // No cache available, rethrow error
    throw error;
  }
}

/**
 * Preload/cache routes
 */
export async function cacheRoutes(
  fromLabel: string,
  toLabel: string,
  filter: 'fastest' | 'cheapest' | 'comfortable',
  routes: ApiRouteOption[],
): Promise<void> {
  const cacheKey = getCacheKey(fromLabel, toLabel, filter);
  const now = Date.now();

  await db.cachedRoutes.put({
    cacheKey,
    from: fromLabel,
    to: toLabel,
    filter,
    routes,
    cachedAt: now,
    expiresAt: now + CACHE_DURATION_MS,
  });
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredRoutes(): Promise<void> {
  const now = Date.now();
  const expiredRoutes = await db.cachedRoutes
    .where('expiresAt')
    .below(now)
    .toArray();

  const keysToDelete = expiredRoutes.map(r => r.cacheKey);
  await db.cachedRoutes.bulkDelete(keysToDelete);
}

/**
 * Remove a single cached route by its composite key
 */
export async function removeCachedRoute(cacheKey: string): Promise<void> {
  await db.cachedRoutes.delete(cacheKey);
}

/**
 * Clear all cached routes
 */
export async function clearAllCachedRoutes(): Promise<void> {
  await db.cachedRoutes.clear();
}

/**
 * Get cache statistics
 */
export async function getRouteCacheStats(): Promise<{
  total: number;
  valid: number;
  expired: number;
}> {
  const allRoutes = await db.cachedRoutes.toArray();
  const now = Date.now();

  const valid = allRoutes.filter(r => r.expiresAt > now).length;
  const expired = allRoutes.length - valid;

  return {
    total: allRoutes.length,
    valid,
    expired,
  };
}
