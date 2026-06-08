import { db } from '@/db/appDb';
import { clearExpiredRoutes, getRouteCacheStats } from './repositories/routesRepository';

/**
 * Cache Manager
 * Provides utilities for managing offline cache
 */

export interface CacheStats {
  routes: {
    total: number;
    valid: number;
    expired: number;
  };
  favoritePlaces: number;
  recentSearches: number;
  savedTrips: number;
  tickets: number;
  pendingActions: number;
  totalSize: string;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  const [
    routeStats,
    favoritePlacesCount,
    recentSearchesCount,
    savedTripsCount,
    ticketsCount,
    pendingActionsCount,
  ] = await Promise.all([
    getRouteCacheStats(),
    db.favoritePlaces.count(),
    db.recentSearches.count(),
    db.savedTrips.count(),
    db.tickets.count(),
    db.pendingActions.count(),
  ]);

  // Estimate total size (rough approximation)
  const totalRecords = routeStats.total + favoritePlacesCount + recentSearchesCount + 
                       savedTripsCount + ticketsCount + pendingActionsCount;
  const estimatedSizeKB = totalRecords * 2; // Rough estimate: 2KB per record
  const totalSize = estimatedSizeKB < 1024 
    ? `${estimatedSizeKB} KB` 
    : `${(estimatedSizeKB / 1024).toFixed(2)} MB`;

  return {
    routes: routeStats,
    favoritePlaces: favoritePlacesCount,
    recentSearches: recentSearchesCount,
    savedTrips: savedTripsCount,
    tickets: ticketsCount,
    pendingActions: pendingActionsCount,
    totalSize,
  };
}

/**
 * Clean up expired cache entries
 */
export async function cleanupCache(): Promise<{
  routesDeleted: number;
}> {
  const beforeStats = await getRouteCacheStats();
  
  await clearExpiredRoutes();
  
  const afterStats = await getRouteCacheStats();
  const routesDeleted = beforeStats.total - afterStats.total;

  console.log(`Cache cleanup: removed ${routesDeleted} expired route caches`);

  return {
    routesDeleted,
  };
}

/**
 * Clear all cache data (use with caution!)
 */
export async function clearAllCache(): Promise<void> {
  await Promise.all([
    db.cachedRoutes.clear(),
    db.cachedPlaces.clear(),
  ]);
  
  console.log('All cache data cleared');
}

/**
 * Reset entire offline database (nuclear option!)
 */
export async function resetOfflineDatabase(): Promise<void> {
  await db.delete();
  console.log('Offline database reset complete');
  
  // Reload page to reinitialize database
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Initialize cache cleanup on app start
 */
export function initializeCacheManager(): void {
  // Clean up expired cache on startup
  cleanupCache().catch(err => {
    console.error('Failed to cleanup cache on startup:', err);
  });

  // Schedule periodic cleanup (every hour)
  setInterval(() => {
    cleanupCache().catch(err => {
      console.error('Failed to cleanup cache:', err);
    });
  }, 60 * 60 * 1000);
}
