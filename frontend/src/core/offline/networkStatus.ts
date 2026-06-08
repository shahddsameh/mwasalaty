import { ref, readonly } from 'vue';

/**
 * Network status tracker
 * Monitors online/offline state and provides reactive state
 */

const isOnline = ref(navigator.onLine);
const lastOnlineAt = ref<number | null>(navigator.onLine ? Date.now() : null);
const lastOfflineAt = ref<number | null>(navigator.onLine ? null : Date.now());

function updateOnlineStatus() {
  const nowOnline = navigator.onLine;
  isOnline.value = nowOnline;
  
  if (nowOnline) {
    lastOnlineAt.value = Date.now();
  } else {
    lastOfflineAt.value = Date.now();
  }
}

// Listen to online/offline events
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

export function useNetworkStatus() {
  return {
    isOnline: readonly(isOnline),
    lastOnlineAt: readonly(lastOnlineAt),
    lastOfflineAt: readonly(lastOfflineAt),
  };
}

export function checkOnline(): boolean {
  return navigator.onLine;
}
