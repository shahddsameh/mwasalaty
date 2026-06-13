<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-4">
      <header class="field-panel p-5">
        <p class="text-sm font-medium text-muted-foreground">{{ $t("ticket.title") }}</p>
        <h1 class="mt-2 break-all text-3xl font-semibold">{{ ticket?.ticketId ?? ticketId ?? $t("common.dash") }}</h1>
        <p v-if="!isOnline" class="mt-3 rounded-lg bg-muted p-3 text-sm font-semibold text-muted-foreground">
          {{ $t("ticket.offline") }}
        </p>
      </header>

      <StateView :state="state" :title="stateTitle" :support="stateSupport">
        <template #action>
          <AppButton v-if="state === 'error'" class="mt-5" variant="danger" @click="loadTicket">{{ $t("common.retry") }}</AppButton>
          <RouterLink v-if="state === 'empty'" to="/scan" class="tap-target mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-primary-contrast focus-ring">
            {{ $t("common.scan") }}
          </RouterLink>
        </template>

        <div v-if="ticket" class="grid gap-4">
          <div class="field-panel p-5">
            <span class="rounded-full bg-muted px-3 py-1 text-sm font-medium">{{ lifecycle }}</span>
            <p v-if="ticket.legs.every((leg) => leg.status === 'used')" class="mt-4 rounded-lg bg-success-soft p-3 font-medium text-success">
              {{ $t("ticket.allUsed") }}
            </p>
          </div>

          <article v-for="leg in ticket.legs" :key="leg.ticketLegId" class="field-panel p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium uppercase text-muted-foreground">{{ leg.ticketLegId }}</p>
                <h2 class="mt-1 text-xl font-semibold">{{ displayLeg(leg) }}</h2>
                <p v-if="!leg.from?.name || !leg.to?.name" class="mt-2 text-sm font-semibold text-warning">
                  {{ $t("ticket.partial") }}
                </p>
              </div>
              <span :class="legTone(leg.status)" class="rounded-full px-3 py-1 text-sm font-medium">
                {{ $t(`ticket.legStatus.${leg.status}`) }}
              </span>
            </div>
            <p v-if="leg.validatedAt" class="mt-3 text-sm text-muted-foreground">
              {{ formatDateTime(leg.validatedAt) }}
            </p>
          </article>
        </div>
      </StateView>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import AppNav from "@/components/shared/AppNav.vue";
import AppButton from "@/components/ui/AppButton.vue";
import StateView from "@/components/shared/StateView.vue";
import { useOnline } from "@/composables/useOnline";
import { getTicket, subscribeToTicket, type Ticket, type TicketLegStatus } from "@/services/api";
import { displayLeg, formatDateTime } from "@/services/format";

const route = useRoute();
const { t } = useI18n();
const { isOnline } = useOnline();
const ticketId = computed(() => String(route.params.id || ""));
const ticket = ref<Ticket | null>(null);
const state = ref<"loading" | "empty" | "error" | "ready">("loading");
let stopTicketUpdates: (() => void) | undefined;

const stateTitle = computed(() => {
  if (state.value === "loading") return t("ticket.loading");
  if (state.value === "empty") return t("ticket.empty");
  if (state.value === "error") return t("ticket.error");
  return undefined;
});
const stateSupport = computed(() => (state.value === "ready" ? undefined : t("ticket.title")));

const lifecycle = computed(() => {
  if (!ticket.value) return t("common.dash");
  if (ticket.value.status === "refunded" || ticket.value.status === "partially_refunded") return t("ticket.lifecycle.refunded");
  if (ticket.value.legs.every((leg) => leg.status === "used")) return t("ticket.lifecycle.fullyUsed");
  if (ticket.value.legs.some((leg) => leg.status === "used")) return t("ticket.lifecycle.legUsed");
  return t("ticket.lifecycle.issued");
});

function legTone(status: TicketLegStatus) {
  const tones: Record<TicketLegStatus, string> = {
    unused: "bg-muted text-foreground",
    used: "bg-success-soft text-success",
    refunded: "bg-danger-soft text-destructive"
  };
  return tones[status];
}

async function loadTicket() {
  if (!ticketId.value) {
    state.value = "empty";
    return;
  }

  state.value = "loading";
  try {
    ticket.value = await getTicket(ticketId.value);
    state.value = ticket.value ? "ready" : "empty";
  } catch {
    state.value = "error";
  }
}

onMounted(async () => {
  await loadTicket();
  if (!ticketId.value) return;
  stopTicketUpdates = subscribeToTicket(ticketId.value, (fresh) => {
    ticket.value = fresh;
    state.value = "ready";
  });
});

onUnmounted(() => stopTicketUpdates?.());
</script>
