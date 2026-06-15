<template>
  <div class="space-y-5">
    <div
      class="flex items-center justify-between gap-3 rounded-lg bg-gradient-to-br from-primary-soft via-warning-soft to-primary text-gradient-foreground p-4"
    >
      <div>
        <div class="font-display text-lg">Mwasalaty</div>
        <div class="text-sm">Digital Transport Ticket</div>
      </div>
      <span
        class="flex items-center gap-1 rounded-full px-3 py-1 text-sm"
        :class="statusBadgeClass"
      >
        <component :is="statusIcon" class="h-4 w-4" />
        {{ statusLabel }}
      </span>
    </div>

    <div class="flex flex-col items-center py-2">
      <div
        class="mb-3 flex h-56 w-56 items-center justify-center rounded-2xl border-4 border-border bg-white p-2"
      >
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="Ticket QR code"
          class="h-full w-full object-contain"
        />
        <QrCode v-else class="h-48 w-48 text-foreground" />
      </div>
      <div class="break-all text-center font-mono text-sm">
        {{ ticket.ticketId }}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <PreviewField
        label="Passenger"
        :value="ticket.passenger?.name || 'Guest'"
      />
      <PreviewField
        label="Total Fare"
        :value="`${ticket.payment.amount} ${ticket.payment.currency}`"
      />
      <PreviewField label="Payment" :value="paymentLabel" />
      <PreviewField label="Valid Until" :value="validUntil" />
    </div>

    <div>
      <h4 class="mb-2 font-display text-foreground">Trip legs</h4>
      <div class="max-h-48 space-y-2 overflow-y-auto">
        <div
          v-for="leg in ticket.legs"
          :key="leg.ticketLegId"
          class="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3"
        >
          <div class="min-w-0">
            <div class="font-display text-sm text-foreground">
              {{ legLabel(leg) }}
            </div>
            <div class="truncate text-xs text-muted-foreground">
              {{ leg.from?.name || "Start" }} ->
              {{ leg.to?.name || "Destination" }}
            </div>
          </div>
          <span
            class="whitespace-nowrap rounded-full px-2.5 py-1 text-xs capitalize"
            :class="legStatusClass(leg.status)"
          >
            {{ leg.status }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex gap-3">
      <AppButton class="flex-1" @click="$emit('close')">Close</AppButton>
      <AppButton
        variant="outline"
        class="flex-1"
        @click="router.push(`/ticket/${encodeURIComponent(ticket.ticketId)}`)"
      >
        Full Details
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from "vue";
import { useRouter } from "vue-router";
import QRCode from "qrcode";
import { Check, QrCode, RotateCcw, XCircle } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import type { Ticket, TicketLeg, TicketLegStatus } from "@/services/api";

const props = defineProps<{ ticket: Ticket }>();
defineEmits<{ close: [] }>();

const router = useRouter();
const qrDataUrl = ref("");

watch(
  () => props.ticket.qrPayload,
  async (payload) => {
    qrDataUrl.value = "";
    if (!payload) return;
    try {
      qrDataUrl.value = await QRCode.toDataURL(JSON.stringify(payload), {
        width: 320,
        margin: 1,
      });
    } catch {
      // Fall back to the QR icon if generation fails.
    }
  },
  { immediate: true, deep: true },
);

const statusLabel = computed(() => {
  switch (computedTicketStatus.value) {
    case "expired":
      return "Expired";
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
  switch (computedTicketStatus.value) {
    case "expired":
      return "bg-secondary text-muted-foreground";
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
  if (computedTicketStatus.value === "expired") return XCircle;
  return computedTicketStatus.value === "refunded" ||
    computedTicketStatus.value === "partially_refunded"
    ? RotateCcw
    : Check;
});

const computedTicketStatus = computed((): Ticket["status"] | "expired" => {
  if (
    props.ticket.status === "refunded" ||
    (props.ticket.legs.length > 0 && props.ticket.legs.every(isLegRefunded))
  ) {
    return "refunded";
  }
  if (ticketHasUsedHistory(props.ticket)) return "used";
  if (isExpired(props.ticket)) return "expired";
  return props.ticket.status;
});

const paymentLabel = computed(() => {
  const method =
    props.ticket.payment.method === "PAYMOB_TEST"
      ? "PayMob (test)"
      : props.ticket.payment.method;
  return `${method} - ${props.ticket.payment.status}`;
});

const validUntil = computed(() => {
  if (!props.ticket.expiresAt) return "24h from booking";
  const date = new Date(props.ticket.expiresAt);
  return Number.isNaN(date.getTime())
    ? "24h from booking"
    : date.toLocaleString();
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
      return "bg-muted text-muted-foreground";
  }
}

function isExpired(ticket: Ticket) {
  if (!ticket.expiresAt) return false;
  const expiresAt = new Date(ticket.expiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt < new Date();
}

function isLegUsed(leg: TicketLeg) {
  return Boolean(
    leg.used || leg.usedAt || leg.validatedAt || leg.status === "used",
  );
}

function isLegRefunded(leg: TicketLeg) {
  return Boolean(
    leg.refunded || leg.refundedAt || leg.status === "refunded",
  );
}

function ticketHasUsedHistory(ticket: Ticket) {
  return Boolean(ticket.usedAt || ticket.legs.some(isLegUsed));
}

const PreviewField = defineComponent({
  props: { label: String, value: String },
  setup: (fieldProps) => () =>
    h("div", { class: "rounded-lg bg-secondary p-3" }, [
      h("div", { class: "text-xs text-muted-foreground" }, fieldProps.label),
      h(
        "div",
        { class: "break-words font-display text-sm text-foreground" },
        fieldProps.value,
      ),
    ]),
});
</script>
