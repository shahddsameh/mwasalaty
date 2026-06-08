<template>
  <main class="min-h-screen pb-20 bg-background py-6 md:py-12">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
      <!-- Loading -->
      <div
        v-if="loading"
        class="bg-card rounded-2xl border-2 border-border p-12 text-center max-w-md mx-auto"
      >
        <Loader2 class="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Loading your ticket…</p>
      </div>

      <!-- Not found -->
      <div
        v-else-if="!ticket"
        class="bg-card rounded-2xl border-2 border-border p-12 text-center max-w-md mx-auto"
      >
        <AlertTriangle class="w-8 h-8 text-destructive mx-auto mb-4" />
        <h1 class="font-display text-xl text-foreground mb-2">Ticket not found</h1>
        <p class="text-muted-foreground mb-6">{{ errorMessage }}</p>
        <AppButton class="w-full" @click="router.replace('/all-tickets')">
          View all tickets
        </AppButton>
      </div>

      <!-- Ticket -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section class="lg:col-span-2">
          <button
            class="flex items-center gap-2 text-foreground hover:text-primary mb-6"
            @click="router.push('/all-tickets')"
          >
            <ArrowLeft class="w-5 h-5" /> All Tickets
          </button>

          <p class="text-success font-display mb-4">
            Payment completed. Your trip ticket is ready.
          </p>

          <div class="bg-card rounded-2xl overflow-hidden border-2 border-border">
            <div
              class="bg-secondary px-4 md:px-8 py-6 flex items-center justify-between"
            >
              <div>
                <h1 class="font-display text-2xl md:text-3xl text-foreground">
                  Mwasalaty
                </h1>
                <p class="text-foreground">Digital Transport Ticket</p>
              </div>
              <span
                class="px-4 py-2 rounded-full flex items-center gap-2"
                :class="statusBadgeClass"
              >
                <component :is="statusIcon" class="w-4 h-4" /> {{ statusLabel }}
              </span>
            </div>

            <div class="px-4 md:px-8 py-10 bg-card flex flex-col items-center">
              <button
                class="w-56 h-56 md:w-80 md:h-80 bg-white p-3 border-4 border-border rounded-2xl flex items-center justify-center mb-6 hover:border-primary"
                @click="qrModalOpen = true"
              >
                <img
                  v-if="qrDataUrl"
                  :src="qrDataUrl"
                  alt="Ticket QR code"
                  class="w-full h-full object-contain"
                />
                <QrCode v-else class="w-48 h-48 md:w-64 md:h-64 text-foreground" />
              </button>
              <p class="text-sm text-foreground text-center">
                Show this QR to the operator scanner.
              </p>
              <div
                class="font-mono text-base md:text-xl text-foreground text-center break-all mt-3"
              >
                {{ ticket.ticketId }}
              </div>
              <p class="text-sm text-muted-foreground mt-1">Ticket ID</p>
            </div>

            <div
              class="px-4 md:px-8 py-6 bg-surface-dark text-surface-dark-foreground"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Passenger" :value="ticket.passenger?.name || 'Guest'" />
                <Field label="Total Fare" :value="`${ticket.payment.amount} ${ticket.payment.currency}`" gold />
                <Field label="Payment" :value="paymentLabel" />
                <Field label="Valid Until" :value="validUntil" />
              </div>
            </div>

            <div
              class="px-4 md:px-8 py-6 bg-surface-dark text-surface-dark-foreground border-t border-surface-dark-border"
            >
              <h3 class="font-display text-lg mb-1">Trip legs</h3>
              <p class="text-sm text-surface-dark-foreground/70 mb-4">
                Each leg will be marked as used after scanning.
              </p>
              <div class="space-y-3">
                <div
                  v-for="leg in ticket.legs"
                  :key="leg.ticketLegId"
                  class="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-dark-muted"
                >
                  <div class="min-w-0">
                    <div class="font-display">{{ legLabel(leg) }}</div>
                    <div class="text-sm text-surface-dark-foreground/70 truncate">
                      {{ leg.from?.name }} -> {{ leg.to?.name }}
                    </div>
                  </div>
                  <span
                    class="px-3 py-1 rounded-full text-sm flex items-center gap-1.5 whitespace-nowrap"
                    :class="legStatusClass(leg.status)"
                  >
                    <component :is="legStatusIcon(leg.status)" class="w-3.5 h-3.5" />
                    {{ leg.status }}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="px-4 md:px-8 py-6 bg-surface-dark border-t border-surface-dark-border grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <AppButton
                class="flex items-center justify-center gap-2"
                @click="router.push('/live-navigation')"
              >
                <Navigation class="w-5 h-5" /> Start Navigation
              </AppButton>
              <AppButton
                variant="ghost"
                class="text-surface-dark-foreground border-surface-dark-border hover:bg-surface-dark-muted flex items-center justify-center gap-2"
                @click="router.push('/all-tickets')"
              >
                View All Tickets
              </AppButton>
            </div>
          </div>
        </section>

        <aside class="space-y-6">
          <InfoCard title="How to Use">
            <ol class="space-y-3 text-sm text-muted-foreground">
              <li>1. Show the QR code to the operator scanner.</li>
              <li>2. Each leg is marked as used after it is scanned.</li>
              <li>3. The ticket is valid for 24 hours from booking.</li>
              <li>4. Works offline — keep this screen handy during your trip.</li>
            </ol>
          </InfoCard>
          <InfoCard title="Quick Actions">
            <div class="space-y-2">
              <AppButton
                variant="outline"
                class="w-full justify-start"
                @click="router.push('/all-tickets')"
                >View All Tickets</AppButton
              >
              <AppButton
                variant="outline"
                class="w-full justify-start"
                @click="router.push('/support')"
                >Contact Support</AppButton
              >
            </div>
          </InfoCard>
        </aside>
      </div>
    </div>

    <Modal :open="qrModalOpen" size="sm" @close="qrModalOpen = false">
      <div class="flex flex-col items-center py-6">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="Ticket QR code"
          class="w-64 h-64 bg-white p-3 rounded-xl mb-4"
        />
        <div v-if="ticket" class="font-mono text-center break-all">
          {{ ticket.ticketId }}
        </div>
        <AppButton class="w-full mt-6" @click="qrModalOpen = false">Close</AppButton>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import QRCode from "qrcode";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Navigation,
  QrCode,
  RotateCcw,
  XCircle,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import type { Ticket, TicketLeg, TicketLegStatus } from "@/services/api";
import { getTicket } from "@/services/api";
import { readCurrentTicket, storeCurrentTicket } from "@/services/currentTicket";

const route = useRoute();
const router = useRouter();

const ticket = ref<Ticket | null>(null);
const loading = ref(true);
const errorMessage = ref("This ticket could not be found. It may have expired.");
const qrDataUrl = ref("");
const qrModalOpen = ref(false);

function routeParamId(): string | undefined {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : id || undefined;
}

onMounted(async () => {
  const id = routeParamId();
  const stored = readCurrentTicket();

  if (id) {
    try {
      ticket.value = await getTicket(id);
      if (ticket.value) storeCurrentTicket(ticket.value);
    } catch (err) {
      if (stored && stored.ticketId === id) {
        ticket.value = stored;
      } else {
        errorMessage.value =
          err instanceof Error ? err.message : "This ticket could not be found.";
      }
    }
  } else if (stored) {
    ticket.value = stored;
  }

  loading.value = false;

  if (ticket.value?.qrPayload) {
    try {
      qrDataUrl.value = await QRCode.toDataURL(
        JSON.stringify(ticket.value.qrPayload),
        { width: 320, margin: 1 },
      );
    } catch {
      // Fall back to the QrCode icon if generation fails.
    }
  }
});

const statusLabel = computed(() => {
  switch (ticket.value?.status) {
    case "used":
      return "Used";
    case "refunded":
      return "Refunded";
    case "partially_refunded":
      return "Partial refund";
    default:
      return "Valid";
  }
});

const statusBadgeClass = computed(() => {
  switch (ticket.value?.status) {
    case "used":
      return "bg-secondary text-muted-foreground";
    case "refunded":
    case "partially_refunded":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-success text-success-foreground";
  }
});

const statusIcon = computed(() => {
  switch (ticket.value?.status) {
    case "used":
      return Check;
    case "refunded":
    case "partially_refunded":
      return RotateCcw;
    default:
      return Check;
  }
});

const paymentLabel = computed(() => {
  const p = ticket.value?.payment;
  if (!p) return "";
  const method = p.method === "PAYMOB_TEST" ? "PayMob (test)" : p.method;
  return `${method} - ${p.status}`;
});

const validUntil = computed(() => {
  if (!ticket.value?.expiresAt) return "24h from booking";
  const d = new Date(ticket.value.expiresAt);
  return Number.isNaN(d.getTime()) ? "24h from booking" : d.toLocaleString();
});

function legLabel(leg: TicketLeg) {
  const name = leg.route?.shortName ?? leg.route?.longName;
  const mode = leg.mode.charAt(0) + leg.mode.slice(1).toLowerCase();
  return name ? `${mode} ${name}` : mode;
}

function legStatusClass(status: TicketLegStatus) {
  switch (status) {
    case "used":
      return "bg-success text-success-foreground";
    case "refunded":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-surface-dark-border text-surface-dark-foreground";
  }
}

function legStatusIcon(status: TicketLegStatus) {
  switch (status) {
    case "used":
      return Check;
    case "refunded":
      return XCircle;
    default:
      return Clock;
  }
}

const Field = defineComponent({
  props: { label: String, value: String, gold: Boolean },
  setup: (p) => () =>
    h("div", [
      h("div", { class: "text-sm text-surface-dark-foreground/70 mb-1" }, p.label),
      h(
        "div",
        { class: ["font-display", p.gold ? "text-2xl text-primary" : "text-lg"] },
        p.value,
      ),
    ]),
});

const InfoCard = defineComponent({
  props: { title: String },
  setup:
    (p, { slots }) =>
    () =>
      h("section", { class: "bg-card rounded-xl p-6 border-2 border-border" }, [
        h("h3", { class: "font-display text-xl text-foreground mb-4" }, p.title),
        slots.default?.(),
      ]),
});
</script>
