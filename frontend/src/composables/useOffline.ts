import { computed } from 'vue';
import { useNetworkStatus } from '@/core/offline/networkStatus';
import { useSyncService } from '@/core/offline/syncService';

/**
 * Composable for offline status and sync management
 * 
 * Provides reactive state for network connectivity, sync status,
 * and methods to manage offline/sync operations.
 */
export function useOffline() {
  const { isOnline, lastOnlineAt, lastOfflineAt } = useNetworkStatus();
  const { syncStatus, lastSyncAt, pendingCount, syncError, performSync } = useSyncService();

  // Computed properties
  const isOffline = computed(() => !isOnline.value);
  const hasPendingChanges = computed(() => pendingCount.value > 0);
  const isSyncing = computed(() => syncStatus.value === 'syncing');
  const syncStatusText = computed(() => {
    if (isOffline.value) return 'offline';
    if (isSyncing.value) return 'syncing';
    if (hasPendingChanges.value) return 'pending';
    return 'synced';
  });

  // Human-readable status messages
  const offlineMessage = computed(() => {
    if (isOffline.value) {
      return 'You are currently offline. Using saved data.';
    }
    return null;
  });

  const syncMessage = computed(() => {
    if (isSyncing.value) {
      return 'Syncing changes...';
    }
    if (hasPendingChanges.value) {
      return `${pendingCount.value} change${pendingCount.value > 1 ? 's' : ''} pending sync`;
    }
    if (syncStatus.value === 'success' && lastSyncAt.value) {
      return 'All changes synced';
    }
    if (syncError.value) {
      return `Sync error: ${syncError.value}`;
    }
    return null;
  });

  return {
    // Network state
    isOnline,
    isOffline,
    lastOnlineAt,
    lastOfflineAt,

    // Sync state
    syncStatus,
    syncStatusText,
    lastSyncAt,
    pendingCount,
    hasPendingChanges,
    isSyncing,
    syncError,

    // Messages
    offlineMessage,
    syncMessage,

    // Actions
    performSync,
  };
}
