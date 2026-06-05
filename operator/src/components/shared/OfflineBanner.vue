<template>
  <div
    v-if="!isOnline"
    class="sticky top-0 z-40 mb-4 rounded-lg border border-slate-300 bg-slate-700 px-4 py-3 text-white shadow-lg"
    aria-live="polite"
  >
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
      <p class="text-sm font-semibold">{{ $t("offline.banner") }}</p>
      <span class="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
        {{ queuedLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useOnline } from "@/composables/useOnline";
import { count } from "@/services/queue";

const { t } = useI18n();
const { isOnline } = useOnline();
const queued = ref(0);

const queuedLabel = computed(() =>
  queued.value > 0 ? t("offline.queued", { count: queued.value }) : t("offline.none")
);

async function refresh() {
  queued.value = await count().catch(() => 0);
}

onMounted(() => {
  void refresh();
  window.addEventListener("mwasalaty-op:queue-change", refresh);
});

onUnmounted(() => {
  window.removeEventListener("mwasalaty-op:queue-change", refresh);
});
</script>
