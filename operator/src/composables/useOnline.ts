import { onMounted, onUnmounted, ref } from "vue";

const onlineSubscribers = new Set<() => void | Promise<void>>();

function readOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    for (const subscriber of onlineSubscribers) {
      void subscriber();
    }
  });
}

export function subscribeOnOnline(callback: () => void | Promise<void>): () => void {
  onlineSubscribers.add(callback);
  return () => onlineSubscribers.delete(callback);
}

export function useOnline() {
  const isOnline = ref(readOnline());

  const update = () => {
    isOnline.value = readOnline();
  };

  onMounted(() => {
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
  });

  onUnmounted(() => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
  });

  return { isOnline };
}
