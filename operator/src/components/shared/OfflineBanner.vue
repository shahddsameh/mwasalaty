<template>
  <div
    v-if="!isOnline"
    class="sticky top-0 z-[60] border-b border-amber-300/30 bg-slate-950 px-4 py-2.5 text-white shadow-lg"
    aria-live="polite"
  >
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
      <p class="flex items-center gap-2 text-sm font-semibold"><AppIcon name="offline" class="h-4 w-4 text-primary" />{{ $t("offline.banner") }}</p>
      <span class="rounded-full bg-primary px-3 py-1 text-xs font-black text-slate-950">
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
import AppIcon from "@/components/ui/AppIcon.vue";

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
