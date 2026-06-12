import { ref, readonly } from 'vue';
import { db } from '@/db/appDb';
import { checkOnline, useNetworkStatus } from './networkStatus';
import { processSyncQueue, getPendingActionCount } from './syncQueue';
import { synchronizeFavoritePlaces } from './repositories/favoritePlacesRepository';

/**
 * Sync Service
 * Coordinates synchronization between local cache and backend
 */

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const syncStatus = ref<SyncStatus>('idle');
const lastSyncAt = ref<number | null>(null);
const pendingCount = ref(0);
const syncError = ref<string | null>(null);

/**
 * Update sync metadata for an entity type
 */
async function updateSyncMetadata(
  entityType: string,
  status: 'idle' | 'syncing' | 'error',
  errorMessage?: string,
) {
  await db.syncMetadata.put({
    key: entityType,
    lastSyncAt: Date.now(),
    syncStatus: status,
    errorMessage,
  });
}

/**
 * Perform a full sync
 */
export async function performSync(force = false): Promise<void> {
  if (!checkOnline()) {
    console.log('Cannot sync: offline');
    return;
  }

  if (syncStatus.value === 'syncing' && !force) {
    console.log('Sync already in progress');
    return;
  }

  syncStatus.value = 'syncing';
  syncError.value = null;

  try {
    console.log('Starting sync...');

    // Process pending actions
    const result = await processSyncQueue();
    await synchronizeFavoritePlaces();
    
    console.log(`Sync complete: ${result.successful} successful, ${result.failed} failed`);

    // Update pending count
    pendingCount.value = await getPendingActionCount();

    if (result.failed === 0) {
      syncStatus.value = 'success';
      lastSyncAt.value = Date.now();
    } else {
      syncStatus.value = 'error';
      syncError.value = `${result.failed} actions failed to sync`;
    }

    // Auto-reset status after 3 seconds
    setTimeout(() => {
      if (syncStatus.value === 'success' || syncStatus.value === 'error') {
        syncStatus.value = 'idle';
        syncError.value = null;
      }
    }, 3000);
  } catch (error) {
    console.error('Sync failed:', error);
    syncStatus.value = 'error';
    syncError.value = error instanceof Error ? error.message : 'Sync failed';
  }
}

/**
 * Initialize sync service
 */
export function initializeSyncService(): void {
  const { isOnline } = useNetworkStatus();

  // Update pending count on startup
  getPendingActionCount().then(count => {
    pendingCount.value = count;
  });

  // Sync when coming online
  window.addEventListener('online', () => {
    console.log('Network online: triggering sync');
    setTimeout(() => performSync(), 1000); // Small delay to ensure connection is stable
  });
  window.addEventListener('mwasalaty:sync-needed', () => {
    void getPendingActionCount().then((count) => {
      pendingCount.value = count;
      if (checkOnline()) void performSync();
    });
  });

  // Sync on app startup if online
  if (isOnline.value) {
    setTimeout(() => performSync(), 2000); // Give app time to initialize
  }

  // Periodic sync every 5 minutes if online and there are pending actions
  setInterval(() => {
    if (checkOnline() && pendingCount.value > 0) {
      performSync();
    }
  }, 5 * 60 * 1000);
}

/**
 * Composable for sync service state
 */
export function useSyncService() {
  return {
    syncStatus: readonly(syncStatus),
    lastSyncAt: readonly(lastSyncAt),
    pendingCount: readonly(pendingCount),
    syncError: readonly(syncError),
    performSync,
  };
}
