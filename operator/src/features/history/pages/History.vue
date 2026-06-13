<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-5">
      <OperatorHeader
        :eyebrow="$t('history.title')"
        :title="String(history.length)"
        :subtitle="history.length ? $t('history.partial') : $t('history.empty')"
        :status="isOnline ? $t('common.synced') : $t('common.pending')"
        icon="history"
      />

      <p v-if="!isOnline" class="soft-alert border-border bg-muted text-muted-foreground"><AppIcon name="offline" class="h-5 w-5 shrink-0" />{{ $t("history.offline") }}</p>

      <StateView :state="history.length ? 'ready' : 'empty'" :title="$t('history.empty')" :support="$t('history.partial')">
        <div class="grid gap-3 sm:grid-cols-2">
          <RouterLink
            v-for="item in history"
            :key="`${item.at}-${item.ticketId}-${item.kind}`"
            :to="item.ticketId ? `/ticket/${item.ticketId}` : '/history'"
            :class="outcomeTone(item.kind)"
            class="tap-target rounded-2xl border border-border p-5 shadow-sm transition-colors hover:border-primary focus-ring"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase">{{ formatDateTime(item.at) }}</p>
                <h2 class="mt-2 text-xl font-semibold">{{ $t(`dashboard.counts.${item.kind}`) }}</h2>
                <p class="mt-2 truncate text-sm font-normal">{{ item.route ?? item.ticketLegId ?? $t("common.detailsUnavailable") }}</p>
              </div>
              <span v-if="item.kind === 'unverified'" class="rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-foreground">
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
import OperatorHeader from "@/components/shared/OperatorHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
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
