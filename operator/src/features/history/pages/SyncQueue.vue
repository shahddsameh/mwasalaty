<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-4">
      <header class="field-panel p-5">
        <p class="text-sm font-bold text-muted-foreground">{{ $t("syncQueue.title") }}</p>
        <h1 class="mt-2 text-3xl font-black">{{ scans.length }}</h1>
        <p v-if="!isOnline" class="mt-3 rounded-lg bg-muted p-3 text-sm font-semibold text-muted-foreground">
          {{ $t("syncQueue.offline") }}
        </p>
      </header>

      <p v-if="discrepancies.length" class="rounded-lg border border-warning bg-warning-soft p-4 font-bold text-warning">
        {{ $t("syncQueue.discrepancies", { count: discrepancies.length }) }}
      </p>

      <StateView :state="state" :title="stateTitle" :support="stateSupport">
        <template #action>
          <AppButton v-if="state === 'error'" class="mt-5" variant="danger" @click="retrySync">
            {{ $t("syncQueue.retry") }}
          </AppButton>
        </template>

        <div class="grid gap-3">
          <article
            v-for="scan in sortedScans"
            :key="scan.id"
            class="field-panel p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase text-muted-foreground">{{ formatDateTime(scan.scannedAt) }}</p>
                <h2 class="mt-1 break-all text-lg font-black">{{ scan.payload.ticketId }}</h2>
                <p class="mt-1 text-sm text-muted-foreground">{{ scan.scannerProfileId }}</p>
              </div>
              <span :class="statusTone(scan)" class="rounded-full px-3 py-1 text-sm font-bold">
                {{ statusLabel(scan) }}
              </span>
            </div>
          </article>
        </div>

        <AppButton class="mt-4 w-full" size="lg" :disabled="syncing || !isOnline" @click="retrySync">
          {{ $t("syncQueue.retry") }}
        </AppButton>
      </StateView>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppNav from "@/components/shared/AppNav.vue";
import AppButton from "@/components/ui/AppButton.vue";
import StateView from "@/components/shared/StateView.vue";
import { useOnline } from "@/composables/useOnline";
import { list, type QueuedScan } from "@/services/queue";
import { syncQueue } from "@/services/sync";
import { formatDateTime } from "@/services/format";

const { t } = useI18n();
const { isOnline } = useOnline();
const scans = ref<QueuedScan[]>([]);
const state = ref<"loading" | "empty" | "error" | "ready">("loading");
const syncing = ref(false);

const discrepancies = computed(() => scans.value.filter((scan) => scan.discrepancy));
const sortedScans = computed(() =>
  [...scans.value].sort((a, b) => Number(b.discrepancy) - Number(a.discrepancy) || b.scannedAt.localeCompare(a.scannedAt))
);

const stateTitle = computed(() => {
  if (state.value === "loading") return t("syncQueue.loading");
  if (state.value === "empty") return t("syncQueue.empty");
  if (state.value === "error") return t("syncQueue.error");
  return discrepancies.value.length ? t("syncQueue.discrepancies", { count: discrepancies.value.length }) : t("syncQueue.success");
});
const stateSupport = computed(() => (state.value === "ready" ? t("syncQueue.partial") : t("syncQueue.offline")));

async function refresh() {
  state.value = "loading";
  try {
    scans.value = await list();
    if (scans.value.some((scan) => scan.syncState === "failed")) {
      state.value = "error";
    } else {
      state.value = scans.value.length ? "ready" : "empty";
    }
  } catch {
    state.value = "error";
  }
}

async function retrySync() {
  syncing.value = true;
  await syncQueue().catch(() => undefined);
  syncing.value = false;
  await refresh();
}

function statusLabel(scan: QueuedScan) {
  if (scan.discrepancy && scan.reconciledOutcome === "already_used") return t("syncQueue.wasAlreadyUsed");
  if (scan.discrepancy && scan.reconciledOutcome === "invalid") return t("syncQueue.wasInvalid");
  return t(`common.${scan.syncState}`);
}

function statusTone(scan: QueuedScan) {
  if (scan.discrepancy && scan.reconciledOutcome === "invalid") return "bg-danger-soft text-destructive";
  if (scan.discrepancy) return "bg-warning-soft text-warning";
  if (scan.syncState === "synced") return "bg-success-soft text-success";
  if (scan.syncState === "failed") return "bg-danger-soft text-destructive";
  return "bg-muted text-muted-foreground";
}

onMounted(() => {
  void refresh();
  window.addEventListener("mwasalaty-op:queue-change", refresh);
});

onUnmounted(() => {
  window.removeEventListener("mwasalaty-op:queue-change", refresh);
});
</script>
