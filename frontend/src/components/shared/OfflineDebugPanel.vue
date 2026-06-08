<template>
  <div v-if="showPanel" class="debug-panel">
    <div class="debug-panel__header">
      <h3>Offline Debug Panel</h3>
      <button @click="close" aria-label="Close">✕</button>
    </div>

    <div class="debug-panel__content">
      <!-- Network Status -->
      <section class="debug-section">
        <h4>Network Status</h4>
        <div class="debug-item">
          <span>Status:</span>
          <strong :class="isOnline ? 'text-success' : 'text-error'">
            {{ isOnline ? 'Online' : 'Offline' }}
          </strong>
        </div>
        <div v-if="lastOnlineAt" class="debug-item">
          <span>Last Online:</span>
          <span>{{ formatTimestamp(lastOnlineAt) }}</span>
        </div>
        <div v-if="lastOfflineAt" class="debug-item">
          <span>Last Offline:</span>
          <span>{{ formatTimestamp(lastOfflineAt) }}</span>
        </div>
      </section>

      <!-- Sync Status -->
      <section class="debug-section">
        <h4>Sync Status</h4>
        <div class="debug-item">
          <span>Status:</span>
          <strong>{{ syncStatus }}</strong>
        </div>
        <div class="debug-item">
          <span>Pending Changes:</span>
          <strong>{{ pendingCount }}</strong>
        </div>
        <div v-if="lastSyncAt" class="debug-item">
          <span>Last Sync:</span>
          <span>{{ formatTimestamp(lastSyncAt) }}</span>
        </div>
        <div v-if="syncError" class="debug-item error">
          <span>Error:</span>
          <span>{{ syncError }}</span>
        </div>
        <button 
          @click="handleSync" 
          :disabled="isSyncing || !isOnline"
          class="btn btn-primary"
        >
          {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
        </button>
      </section>

      <!-- Cache Stats -->
      <section class="debug-section">
        <h4>Cache Statistics</h4>
        <div v-if="cacheStats">
          <div class="debug-item">
            <span>Total Size:</span>
            <strong>{{ cacheStats.totalSize }}</strong>
          </div>
          <div class="debug-item">
            <span>Cached Routes:</span>
            <span>{{ cacheStats.routes.valid }} valid, {{ cacheStats.routes.expired }} expired</span>
          </div>
          <div class="debug-item">
            <span>Favorite Places:</span>
            <span>{{ cacheStats.favoritePlaces }}</span>
          </div>
          <div class="debug-item">
            <span>Recent Searches:</span>
            <span>{{ cacheStats.recentSearches }}</span>
          </div>
          <div class="debug-item">
            <span>Saved Trips:</span>
            <span>{{ cacheStats.savedTrips }}</span>
          </div>
          <div class="debug-item">
            <span>Tickets:</span>
            <span>{{ cacheStats.tickets }}</span>
          </div>
        </div>
        <div class="debug-actions">
          <button @click="handleRefreshStats" class="btn btn-secondary">
            Refresh Stats
          </button>
          <button @click="handleCleanup" class="btn btn-secondary">
            Cleanup Cache
          </button>
          <button @click="handleClearCache" class="btn btn-danger">
            Clear All Cache
          </button>
        </div>
      </section>

      <!-- Pending Actions -->
      <section v-if="pendingActions.length > 0" class="debug-section">
        <h4>Pending Actions ({{ pendingActions.length }})</h4>
        <div class="pending-actions-list">
          <div 
            v-for="action in pendingActions" 
            :key="action.id"
            class="pending-action-item"
          >
            <div class="action-type">
              {{ action.actionType }} {{ action.entityType }}
            </div>
            <div class="action-details">
              <span>Retries: {{ action.retryCount }}</span>
              <span v-if="action.error" class="error">{{ action.error }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOffline } from '@/composables/useOffline';
import { 
  getCacheStats, 
  cleanupCache, 
  clearAllCache,
  type CacheStats,
} from '@/core/offline/cacheManager';
import { getAllPendingActions } from '@/core/offline/syncQueue';
import type { PendingAction } from '@/db/appDb';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const {
  isOnline,
  lastOnlineAt,
  lastOfflineAt,
  syncStatus,
  lastSyncAt,
  pendingCount,
  isSyncing,
  syncError,
  performSync,
} = useOffline();

const showPanel = ref(props.show);
const cacheStats = ref<CacheStats | null>(null);
const pendingActions = ref<PendingAction[]>([]);

function close() {
  showPanel.value = false;
  emit('close');
}

async function loadStats() {
  cacheStats.value = await getCacheStats();
  pendingActions.value = await getAllPendingActions();
}

async function handleSync() {
  await performSync();
  await loadStats();
}

async function handleRefreshStats() {
  await loadStats();
}

async function handleCleanup() {
  await cleanupCache();
  await loadStats();
}

async function handleClearCache() {
  if (confirm('Are you sure you want to clear all cache? This cannot be undone.')) {
    await clearAllCache();
    await loadStats();
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: var(--color-surface, white);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.debug-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-background, #f9fafb);
}

.debug-panel__header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.debug-panel__header button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.debug-panel__header button:hover {
  background: var(--color-hover, #f3f4f6);
}

.debug-panel__content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.debug-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.debug-section:last-child {
  border-bottom: none;
}

.debug-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
}

.debug-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.debug-item.error {
  color: var(--color-error, #ef4444);
}

.text-success {
  color: var(--color-success, #10b981);
}

.text-error {
  color: var(--color-error, #ef4444);
}

.debug-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.btn-secondary {
  background: var(--color-secondary, #6b7280);
  color: white;
}

.btn-danger {
  background: var(--color-error, #ef4444);
  color: white;
}

.pending-actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pending-action-item {
  padding: 0.75rem;
  background: var(--color-background, #f9fafb);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.action-type {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.action-details {
  display: flex;
  gap: 1rem;
  color: var(--color-text-secondary, #6b7280);
}

.action-details .error {
  color: var(--color-error, #ef4444);
}
</style>
