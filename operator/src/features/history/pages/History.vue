<template>
  <main class="app-shell">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-4">
      <header class="field-panel p-5">
        <p class="text-sm font-bold text-muted-foreground">{{ $t("history.title") }}</p>
        <h1 class="mt-2 text-3xl font-black">{{ history.length }}</h1>
        <p v-if="!isOnline" class="mt-3 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
          {{ $t("history.offline") }}
        </p>
      </header>

      <StateView :state="history.length ? 'ready' : 'empty'" :title="$t('history.empty')" :support="$t('history.partial')">
        <div class="grid gap-3">
          <RouterLink
            v-for="item in history"
            :key="`${item.at}-${item.ticketId}-${item.kind}`"
            :to="item.ticketId ? `/ticket/${item.ticketId}` : '/history'"
            :class="outcomeTone(item.kind)"
            class="tap-target rounded-lg border border-border p-4 focus-ring"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase">{{ formatDateTime(item.at) }}</p>
                <h2 class="mt-1 text-xl font-black">{{ $t(`dashboard.counts.${item.kind}`) }}</h2>
                <p class="mt-1 text-sm font-semibold">{{ item.route ?? item.ticketLegId ?? $t("common.detailsUnavailable") }}</p>
              </div>
              <span v-if="item.kind === 'unverified'" class="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                {{ $t("history.scannedOffline") }}
              </span>
            </div>
          </RouterLink>
        </div>
      </StateView>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import AppNav from "@/components/shared/AppNav.vue";
import StateView from "@/components/shared/StateView.vue";
import { useOnline } from "@/composables/useOnline";
import { getHistory } from "@/features/results/resultStore";
import type { ScanOutcome } from "@/services/outcome";
import { formatDateTime, outcomeTone } from "@/services/format";

const { isOnline } = useOnline();
const history = ref<ScanOutcome[]>([]);

function refresh() {
  history.value = getHistory();
}

onMounted(() => {
  refresh();
  window.addEventListener("mwasalaty-op:history-change", refresh);
});

onUnmounted(() => {
  window.removeEventListener("mwasalaty-op:history-change", refresh);
});
</script>
