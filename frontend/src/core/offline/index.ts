/**
 * Offline-First Infrastructure
 * 
 * This module provides a complete offline-first layer for the Mwaslaty PWA.
 * 
 * Features:
 * - Network status monitoring
 * - Offline data caching with IndexedDB (via Dexie)
 * - Optimistic updates for user actions
 * - Sync queue for pending changes
 * - Automatic background synchronization
 * - Cache management and cleanup
 * 
 * Usage:
 * 
 * 1. Network Status:
 *    import { useNetworkStatus } from '@/core/offline';
 *    const { isOnline } = useNetworkStatus();
 * 
 * 2. Offline/Sync Status:
 *    import { useOffline } from '@/composables/useOffline';
 *    const { isOffline, syncStatus, performSync } = useOffline();
 * 
 * 3. Data Repositories:
 *    import { 
 *      getFavoritePlaces, 
 *      saveFavoritePlace 
 *    } from '@/core/offline/repositories/favoritePlacesRepository';
 * 
 * 4. Route Planning:
 *    import { useRoutePlanning } from '@/composables/useRoutePlanning';
 *    const { searchRoutes, routes, isFromCache } = useRoutePlanning();
 * 
 * 5. Cache Management:
 *    import { getCacheStats, cleanupCache } from '@/core/offline/cacheManager';
 */

// Network status
export { useNetworkStatus, checkOnline } from './networkStatus';

// Sync infrastructure
export { 
  initializeSyncService, 
  performSync, 
  useSyncService 
} from './syncService';

export { 
  queuePendingAction, 
  processSyncQueue, 
  getPendingActionCount,
  registerSyncHandler,
  getAllPendingActions,
  clearPendingActions,
} from './syncQueue';

// Cache management
export {
  getCacheStats,
  cleanupCache,
  clearAllCache,
  resetOfflineDatabase,
  initializeCacheManager,
} from './cacheManager';

// Repositories
export * from './repositories/favoritePlacesRepository';
export * from './repositories/recentSearchesRepository';
export * from './repositories/routesRepository';
export * from './repositories/savedTripsRepository';

// Types
export type { DataSource } from './repositories/favoritePlacesRepository';
export type { CacheStats } from './cacheManager';
export type { SyncStatus } from './syncService';
export type { SyncHandler } from './syncQueue';
