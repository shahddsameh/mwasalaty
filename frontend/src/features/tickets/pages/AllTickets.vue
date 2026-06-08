<template>
  <main class="min-h-screen bg-background pb-20">
    <div class="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-12 lg:px-8">
      <PageTitle title="All Tickets" subtitle="View your tickets and request refunds for unused journeys.">
        <template #icon><TicketIcon class="h-10 w-10 text-primary" /></template>
      </PageTitle>

      <div
        v-if="notice"
        class="mb-6 flex items-start justify-between gap-4 rounded-xl border p-4"
        :class="notice.type === 'success' ? 'border-success bg-success-soft text-success' : 'border-destructive bg-destructive/10 text-destructive'"
      >
        <div>
          <div class="font-display">{{ notice.title }}</div>
          <p class="mt-1 text-sm">{{ notice.message }}</p>
        </div>
        <button type="button" class="shrink-0 rounded p-1 hover:bg-black/5" @click="notice = null">
          <X class="h-4 w-4" />
        </button>
      </div>

      <section
        v-if="loading"
        class="rounded-2xl border-2 border-border bg-card p-12 text-center"
      >
        <Loader2 class="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <p class="text-muted-foreground">Loading your tickets...</p>
      </section>

      <section
        v-else-if="errorMessage"
        class="rounded-2xl border-2 border-border bg-card p-12 text-center"
      >
        <AlertTriangle class="mx-auto mb-4 h-8 w-8 text-destructive" />
        <h2 class="font-display text-xl text-foreground">Could not load tickets</h2>
        <p class="mx-auto mb-6 mt-2 max-w-lg text-muted-foreground">{{ errorMessage }}</p>
        <AppButton @click="loadTickets">Try again</AppButton>
      </section>

      <section
        v-else-if="tickets.length === 0"
        class="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center"
      >
        <TicketIcon class="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h2 class="font-display text-xl text-foreground">No tickets yet</h2>
        <p class="mb-6 mt-2 text-muted-foreground">Book a route and your ticket will appear here.</p>
        <AppButton @click="router.push('/plan')">Plan a trip</AppButton>
      </section>

      <section v-else class="space-y-10">
        <TicketSection title="Active tickets" :tickets="activeTickets">
          <template #empty>No active tickets.</template>
        </TicketSection>
        <TicketSection title="Ticket history" :tickets="historyTickets">
          <template #empty>No ticket history yet.</template>
        </TicketSection>
      </section>
    </div>

    <Modal
      :open="Boolean(refundTicketTarget)"
      title="Request refund"
      size="lg"
      @close="closeRefundModal"
    >
      <div v-if="refundTicketTarget" class="space-y-5">
        <div class="rounded-lg bg-secondary p-4">
          <div class="font-mono text-sm text-muted-foreground">{{ refundTicketTarget.ticketId }}</div>
          <div class="mt-1 font-display text-lg text-foreground">{{ ticketRoute(refundTicketTarget) }}</div>
        </div>

        <div
          v-if="refundError"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ refundError }}
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            :class="refundMode === 'total' ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary'"
            :disabled="!canFullyRefund(refundTicketTarget)"
            @click="selectTotalRefund"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-display text-foreground">Total refund</span>
              <CheckCircle2 v-if="refundMode === 'total'" class="h-5 w-5 text-primary" />
            </div>
            <p class="mt-2 text-sm text-muted-foreground">
              Refund every leg. Available only before any leg is used or refunded.
            </p>
          </button>

          <button
            type="button"
            class="rounded-xl border-2 p-4 text-left transition-colors"
            :class="refundMode === 'partial' ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary'"
            @click="refundMode = 'partial'"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-display text-foreground">Partial refund</span>
              <CheckCircle2 v-if="refundMode === 'partial'" class="h-5 w-5 text-primary" />
            </div>
            <p class="mt-2 text-sm text-muted-foreground">
              Choose unused legs. Used or already refunded legs cannot be selected.
            </p>
          </button>
        </div>

        <div class="space-y-3">
          <button
            v-for="leg in refundTicketTarget.legs"
            :key="leg.ticketLegId"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border p-3 text-left"
            :class="legSelectionClass(leg)"
            :disabled="refundMode === 'total' || leg.status !== 'unused'"
            @click="toggleLeg(leg)"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
              :class="selectedLegIds.includes(leg.ticketLegId) ? 'border-primary bg-primary text-button-primary-text' : 'border-border bg-card'"
            >
              <Check v-if="selectedLegIds.includes(leg.ticketLegId)" class="h-3.5 w-3.5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-display text-foreground">{{ legLabel(leg) }}</span>
              <span class="block truncate text-sm text-muted-foreground">
                {{ leg.from?.name || "Start" }} -> {{ leg.to?.name || "Destination" }}
              </span>
            </span>
            <span class="text-right">
              <span class="block font-display text-foreground">{{ money(leg.fareAmount, refundTicketTarget.payment.currency) }}</span>
              <span class="block text-xs capitalize" :class="legStatusTextClass(leg.status)">{{ leg.status }}</span>
            </span>
          </button>
        </div>

        <div class="rounded-lg border border-primary/30 bg-primary-soft p-4">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-foreground">Refund amount</span>
            <strong class="font-display text-xl text-foreground">{{ money(refundAmount, refundTicketTarget.payment.currency) }}</strong>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            Refunds are sent back through the original payment method.
          </p>
        </div>

        <div class="flex flex-col-reverse gap-3 sm:flex-row">
          <AppButton variant="secondary" class="flex-1" :disabled="refunding" @click="closeRefundModal">
            Cancel
          </AppButton>
          <AppButton
            variant="danger"
            class="flex flex-1 items-center justify-center gap-2"
            :disabled="refunding || selectedLegIds.length === 0"
            @click="confirmRefund"
          >
            <Loader2 v-if="refunding" class="h-4 w-4 animate-spin" />
            {{ refunding ? "Processing refund..." : "Confirm refund" }}
          </AppButton>
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Loader2,
  Ticket as TicketIcon,
  X,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import PageTitle from "@/components/shared/PageTitle.vue";
import type { Ticket, TicketLeg, TicketLegStatus } from "@/services/api";
import { getTicket, getTickets, refundTicket } from "@/services/api";
import { readCurrentTicket, storeCurrentTicket } from "@/services/currentTicket";
import { useAuthState } from "@/services/authState";

const router = useRouter();
const { user, ensureAuthInitialized } = useAuthState();
const tickets = ref<Ticket[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const refundTicketTarget = ref<Ticket | null>(null);
const refundMode = ref<"total" | "partial">("partial");
const selectedLegIds = ref<string[]>([]);
const refunding = ref(false);
const refundError = ref("");
const notice = ref<{ type: "success" | "error"; title: string; message: string } | null>(null);

const activeTickets = computed(() =>
  tickets.value.filter((ticket) => canRefund(ticket)),
);
const historyTickets = computed(() =>
  tickets.value.filter((ticket) => !canRefund(ticket)),
);
const refundAmount = computed(() => {
  if (!refundTicketTarget.value) return 0;
  return refundTicketTarget.value.legs
    .filter((leg) => selectedLegIds.value.includes(leg.ticketLegId))
    .reduce((sum, leg) => sum + leg.fareAmount, 0);
});

async function loadTickets() {
  loading.value = true;
  errorMessage.value = "";
  try {
    await ensureAuthInitialized();
    tickets.value = await getTickets(user.value?.id ?? "guest");
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Could not load your tickets.";
  } finally {
    loading.value = false;
  }
}

function openRefundModal(ticket: Ticket) {
  refundTicketTarget.value = ticket;
  refundError.value = "";
  if (canFullyRefund(ticket)) {
    refundMode.value = "total";
    selectedLegIds.value = ticket.legs.map((leg) => leg.ticketLegId);
  } else {
    refundMode.value = "partial";
    selectedLegIds.value = ticket.legs.filter((leg) => leg.status === "unused").map((leg) => leg.ticketLegId);
  }
}

function closeRefundModal() {
  if (refunding.value) return;
  refundTicketTarget.value = null;
  selectedLegIds.value = [];
  refundError.value = "";
}

function selectTotalRefund() {
  if (!refundTicketTarget.value || !canFullyRefund(refundTicketTarget.value)) return;
  refundMode.value = "total";
  selectedLegIds.value = refundTicketTarget.value.legs.map((leg) => leg.ticketLegId);
}

function toggleLeg(leg: TicketLeg) {
  if (refundMode.value !== "partial" || leg.status !== "unused") return;
  selectedLegIds.value = selectedLegIds.value.includes(leg.ticketLegId)
    ? selectedLegIds.value.filter((id) => id !== leg.ticketLegId)
    : [...selectedLegIds.value, leg.ticketLegId];
}

async function confirmRefund() {
  const target = refundTicketTarget.value;
  if (!target || selectedLegIds.value.length === 0) return;
  refunding.value = true;
  refundError.value = "";

  try {
    const result = await refundTicket(
      target.ticketId,
      refundMode.value === "total" ? undefined : selectedLegIds.value,
    );
    const updated = await getTicket(target.ticketId);
    tickets.value = tickets.value.map((ticket) => ticket.ticketId === updated.ticketId ? updated : ticket);
    if (readCurrentTicket()?.ticketId === updated.ticketId) storeCurrentTicket(updated);
    notice.value = {
      type: "success",
      title: "Refund completed",
      message: `${money(result.refundAmount, result.currency)} refunded for ${result.refundedLegs.length} leg${result.refundedLegs.length === 1 ? "" : "s"}.`,
    };
    refundTicketTarget.value = null;
    selectedLegIds.value = [];
  } catch (error) {
    refundError.value = error instanceof Error ? error.message : "The refund could not be completed.";
  } finally {
    refunding.value = false;
  }
}

function refundableLegs(ticket: Ticket) {
  return ticket.legs.filter((leg) => leg.status === "unused");
}

function canFullyRefund(ticket: Ticket) {
  return ticket.legs.length > 0 && ticket.legs.every((leg) => leg.status === "unused");
}

function canRefund(ticket: Ticket) {
  return refundableLegs(ticket).length > 0;
}

function ticketRoute(ticket: Ticket) {
  const first = ticket.legs[0];
  const last = ticket.legs[ticket.legs.length - 1];
  return `${first?.from?.name || "Start"} -> ${last?.to?.name || "Destination"}`;
}

function ticketModes(ticket: Ticket) {
  return [...new Set(ticket.legs.map((leg) => legLabel(leg)))];
}

function legLabel(leg: TicketLeg) {
  const route = leg.route?.shortName ?? leg.route?.longName;
  const mode = leg.mode.charAt(0) + leg.mode.slice(1).toLowerCase();
  return route ? `${mode} ${route}` : mode;
}

function money(amount: number, currency: string) {
  return `${Number(amount || 0).toFixed(2)} ${currency}`;
}

function dateLabel(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function statusLabel(ticket: Ticket) {
  switch (ticket.status) {
    case "used": return "Used";
    case "refunded": return "Refunded";
    case "partially_refunded": return "Partially refunded";
    default: return "Active";
  }
}

function statusClass(ticket: Ticket) {
  switch (ticket.status) {
    case "used": return "bg-secondary text-muted-foreground";
    case "refunded": return "bg-destructive/10 text-destructive";
    case "partially_refunded": return "bg-warning-soft text-warning";
    default: return "bg-success text-success-foreground";
  }
}

function legSelectionClass(leg: TicketLeg) {
  if (leg.status !== "unused") return "cursor-not-allowed border-border bg-muted opacity-70";
  if (selectedLegIds.value.includes(leg.ticketLegId)) return "border-primary bg-primary-soft";
  return "border-border bg-card hover:border-primary";
}

function legStatusTextClass(status: TicketLegStatus) {
  if (status === "used") return "text-success";
  if (status === "refunded") return "text-destructive";
  return "text-muted-foreground";
}

const TicketSection = defineComponent({
  props: {
    title: { type: String, required: true },
    tickets: { type: Array as () => Ticket[], required: true },
  },
  setup(props, { slots }) {
    return () =>
      h("div", [
        h("h2", { class: "mb-6 font-display text-2xl text-foreground" }, `${props.title} (${props.tickets.length})`),
        props.tickets.length === 0
          ? h("div", { class: "rounded-xl border-2 border-dashed border-border bg-card p-8 text-center text-muted-foreground" }, slots.empty?.())
          : h("div", { class: "grid grid-cols-1 gap-6 lg:grid-cols-2" },
              props.tickets.map((ticket) =>
                h("article", { class: "overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm" }, [
                  h("div", { class: "flex items-start justify-between gap-3 bg-secondary px-5 py-4" }, [
                    h("div", { class: "min-w-0" }, [
                      h("div", { class: "font-display text-lg text-foreground" }, "Digital Ticket"),
                      h("div", { class: "truncate font-mono text-sm text-muted-foreground" }, ticket.ticketId),
                    ]),
                    h("span", { class: ["shrink-0 rounded-full px-3 py-1 text-sm", statusClass(ticket)] }, statusLabel(ticket)),
                  ]),
                  h("div", { class: "space-y-4 p-5" }, [
                    h("div", [
                      h("div", { class: "text-sm text-muted-foreground" }, "Route"),
                      h("div", { class: "font-display text-lg text-foreground" }, ticketRoute(ticket)),
                    ]),
                    h("div", { class: "flex flex-wrap gap-2" },
                      ticketModes(ticket).map((mode) => h("span", { class: "rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground" }, mode)),
                    ),
                    h("div", { class: "grid grid-cols-2 gap-3" }, [
                      h("div", { class: "rounded-lg bg-secondary p-3" }, [
                        h("div", { class: "text-xs text-muted-foreground" }, "Total fare"),
                        h("div", { class: "font-display text-foreground" }, money(ticket.payment.amount, ticket.payment.currency)),
                      ]),
                      h("div", { class: "rounded-lg bg-secondary p-3" }, [
                        h("div", { class: "text-xs text-muted-foreground" }, "Valid until"),
                        h("div", { class: "font-display text-sm text-foreground" }, dateLabel(ticket.expiresAt)),
                      ]),
                    ]),
                    h("div", { class: "text-sm text-muted-foreground" },
                      `${refundableLegs(ticket).length} of ${ticket.legs.length} legs available for refund`,
                    ),
                    h("div", { class: "grid grid-cols-1 gap-2 sm:grid-cols-2" }, [
                      h(AppButton, {
                        variant: "outline",
                        class: "w-full",
                        onClick: () => router.push(`/ticket/${encodeURIComponent(ticket.ticketId)}`),
                      }, () => "View details"),
                      h(AppButton, {
                        variant: "danger",
                        class: "w-full",
                        disabled: !canRefund(ticket),
                        onClick: () => openRefundModal(ticket),
                      }, () => canRefund(ticket) ? "Request refund" : "Nothing to refund"),
                    ]),
                  ]),
                ]),
              ),
            ),
      ]);
  },
});

onMounted(loadTickets);
</script>
