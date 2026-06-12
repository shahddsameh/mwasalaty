<template>
  <Transition name="slide-down">
    <div
      v-if="shouldShow"
      :class="['offline-indicator', `offline-indicator--${statusType}`]"
      role="status"
      aria-live="polite"
    >
      <div class="offline-indicator__content">
        <div class="offline-indicator__icon">
          <WifiOff v-if="isOffline" :size="16" />
          <RefreshCw v-else-if="isSyncing" :size="16" class="spinning" />
          <AlertCircle v-else-if="syncError" :size="16" />
          <Cloud v-else :size="16" />
        </div>

        <div class="offline-indicator__text">
          <template v-if="isOffline">
            {{ offlineMessage }}
          </template>
          <template v-else-if="syncMessage">
            {{ syncMessage }}
          </template>
        </div>

        <button
          v-if="hasPendingChanges && !isSyncing && isOnline"
          class="offline-indicator__button"
          @click="handleSync"
          aria-label="Sync changes now"
        >
          <RefreshCw :size="14" />
          Sync
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { WifiOff, RefreshCw, AlertCircle, Cloud } from "@lucide/vue";
import { useOffline } from "@/composables/useOffline";

const {
  isOnline,
  isOffline,
  isSyncing,
  hasPendingChanges,
  syncError,
  offlineMessage,
  syncMessage,
  performSync,
} = useOffline();

// Show indicator if offline, has pending changes, or there's an error.
// Routine background syncing (e.g. right after a page refresh) stays invisible.
const shouldShow = computed(() => {
  return (
    isOffline.value ||
    syncError.value ||
    (hasPendingChanges.value && !isSyncing.value)
  );
});

const statusType = computed(() => {
  if (isOffline.value) return "offline";
  if (syncError.value) return "error";
  if (isSyncing.value) return "syncing";
  if (hasPendingChanges.value) return "pending";
  return "online";
});

async function handleSync() {
  await performSync();
}
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.offline-indicator__content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
}

.offline-indicator__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.offline-indicator__text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.offline-indicator__button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  background: var(--color-primary);
  color: white;
  transition: opacity 0.2s;
}

.offline-indicator__button:hover {
  opacity: 0.9;
}

.offline-indicator__button:active {
  transform: scale(0.98);
}

/* Status variants */
.offline-indicator--offline {
  background: var(--color-secondary, #fef7e3);
  border-bottom-color: var(--color-warning, #f59e0b);
}

.offline-indicator--offline .offline-indicator__text {
  color: var(--color-warning-dark, #92400e);
}

.offline-indicator--offline .offline-indicator__icon {
  color: var(--color-warning, #f59e0b);
}

.offline-indicator--error {
  background: var(--color-error-soft, #fee2e2);
  border-bottom-color: var(--color-error, #ef4444);
}

.offline-indicator--error .offline-indicator__text {
  color: var(--color-error-dark, #991b1b);
}

.offline-indicator--error .offline-indicator__icon {
  color: var(--color-error, #ef4444);
}

.offline-indicator--syncing,
.offline-indicator--pending {
  background: var(--color-info-soft, #dbeafe);
  border-bottom-color: var(--color-info, #3b82f6);
}

.offline-indicator--syncing .offline-indicator__text,
.offline-indicator--pending .offline-indicator__text {
  color: var(--color-info-dark, #1e40af);
}

.offline-indicator--syncing .offline-indicator__icon,
.offline-indicator--pending .offline-indicator__icon {
  color: var(--color-info, #3b82f6);
}

/* Animations */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
