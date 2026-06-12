<template>
  <div
    v-if="needRefresh"
    class="fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-md rounded-lg border-2 border-border bg-card p-4 shadow-lg md:bottom-6"
    role="status"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="font-display text-base text-foreground">Update available</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          A newer version of Mwasalaty is ready.
        </p>
      </div>
      <button
        class="rounded-lg border border-border px-2 py-1 text-sm text-muted-foreground hover:border-primary"
        @click="close"
      >
        Later
      </button>
    </div>
    <button
      class="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      @click="updateServiceWorker(true)"
    >
      Update now
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRegisterSW } from "virtual:pwa-register/vue";

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
});

function close() {
  needRefresh.value = false;
}
</script>
