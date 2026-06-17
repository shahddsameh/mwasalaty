<template>
  <main class="min-h-screen bg-background pb-20">
    <div class="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-12 lg:px-8">
      <PageTitle
        :title="t('tickets.allTitle')"
        :subtitle="t('tickets.allSubtitle')"
      >
        <template #icon><TicketIcon class="h-8 w-8 text-primary" /></template>
      </PageTitle>

      <div
        v-if="offlineNotice"
        class="mb-6 flex items-center gap-3 rounded-xl border-2 border-warning bg-secondary p-4 text-sm text-foreground"
        role="status"
      >
        <CloudOff class="h-5 w-5 flex-shrink-0 text-warning" />
        <span>{{ t("tickets.offlineNotice") }}</span>
      </div>

      <div
        v-if="notice"
        class="mb-6 flex items-start justify-between gap-3 sm:gap-4 rounded-xl border p-3.5 sm:p-4"
        :class="
          notice.type === 'success'
            ? 'border-success bg-success-soft text-success'
            : 'border-destructive bg-destructive/10 text-destructive'
        "
      >
        <div class="min-w-0">
          <div
            class="font-display text-sm sm:text-base truncate"
            :title="notice.title"
          >
            {{ notice.title }}
          </div>
          <p class="mt-1 text-xs sm:text-sm">{{ notice.message }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded p-1 hover:bg-black/5"
          @click="notice = null"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <section
        v-if="loading"
        class="rounded-2xl border-2 border-border bg-card p-6 sm:p-12 text-center"
      >
        <Loader2 class="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <p class="text-sm sm:text-base text-muted-foreground">
          {{ t("tickets.loading") }}
        </p>
      </section>

      <section
        v-else-if="errorMessage"
        class="rounded-2xl border-2 border-border bg-card p-6 sm:p-12 text-center"
      >
        <AlertTriangle class="mx-auto mb-4 h-8 w-8 text-destructive" />
        <h2 class="font-display text-lg sm:text-xl text-foreground">
          {{ t("tickets.loadErrorTitle") }}
        </h2>
        <p
          class="mx-auto mb-6 mt-2 max-w-lg text-xs sm:text-sm text-muted-foreground"
        >
          {{ errorMessage }}
        </p>
        <AppButton @click="loadTickets">{{ t("tickets.tryAgain") }}</AppButton>
      </section>

      <section
        v-else-if="tickets.length === 0"
        class="rounded-2xl border-2 border-dashed border-border bg-card p-6 sm:p-12 text-center"
      >
        <TicketIcon class="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h2 class="font-display text-lg sm:text-xl text-foreground">
          {{ t("tickets.emptyTitle") }}
        </h2>
        <p class="mb-6 mt-2 text-xs sm:text-sm text-muted-foreground">
          {{ t("tickets.emptyCopy") }}
        </p>
        <AppButton @click="router.push('/plan')">{{
          t("tickets.planTrip")
        }}</AppButton>
      </section>

      <section v-else class="space-y-10">
        <TicketSection
          :title="t('tickets.activeSection')"
          :tickets="activeTickets"
        >
          <template #empty>{{ t("tickets.noActive") }}</template>
        </TicketSection>
        <TicketSection
          :title="t('tickets.historySection')"
          :tickets="historyTickets"
        >
          <template #empty>{{ t("tickets.noHistory") }}</template>
        </TicketSection>
      </section>
    </div>

    <Modal
      :open="Boolean(refundTicketTarget)"
      :title="t('tickets.refund.title')"
      size="lg"
      @close="closeRefundModal"
    >
      <div v-if="refundTicketTarget" class="space-y-4 sm:space-y-5">
        <div class="rounded-lg bg-secondary p-3 sm:p-4">
          <div
            class="font-mono text-xs sm:text-sm text-muted-foreground truncate"
            :title="refundTicketTarget.ticketId"
          >
            {{ refundTicketTarget.ticketId }}
          </div>
          <div
            class="mt-1 font-display text-base sm:text-lg text-foreground truncate"
            :title="ticketRoute(refundTicketTarget)"
          >
            {{ ticketRoute(refundTicketTarget) }}
          </div>
        </div>

        <div
          v-if="refundError"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-xs sm:text-sm text-destructive"
        >
          {{ refundError }}
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-xl border-2 p-3 sm:p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              refundMode === 'total'
                ? 'border-primary bg-secondary'
                : 'border-border hover:border-primary'
            "
            :disabled="!canFullyRefund(refundTicketTarget)"
            @click="selectTotalRefund"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-display text-sm sm:text-base text-foreground">{{
                t("tickets.refund.total")
              }}</span>
              <CheckCircle2
                v-if="refundMode === 'total'"
                class="h-5 w-5 text-primary shrink-0"
              />
            </div>
            <p class="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              {{ t("tickets.refund.totalDesc") }}
            </p>
          </button>

          <button
            type="button"
            class="rounded-xl border-2 p-3 sm:p-4 text-left transition-colors"
            :class="
              refundMode === 'partial'
                ? 'border-primary bg-secondary'
                : 'border-border hover:border-primary'
            "
            @click="refundMode = 'partial'"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-display text-sm sm:text-base text-foreground">{{
                t("tickets.refund.partial")
              }}</span>
              <CheckCircle2
                v-if="refundMode === 'partial'"
                class="h-5 w-5 text-primary shrink-0"
              />
            </div>
            <p class="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              {{ t("tickets.refund.partialDesc") }}
            </p>
          </button>
        </div>

        <div class="space-y-2.5 sm:space-y-3">
          <button
            v-for="leg in refundTicketTarget.legs"
            :key="leg.ticketLegId"
            type="button"
            class="flex w-full items-center gap-2 sm:gap-3 rounded-lg border p-2.5 sm:p-3 text-left"
            :class="legSelectionClass(leg)"
            :disabled="refundMode === 'total' || !isRefundableLeg(leg)"
            @click="toggleLeg(leg)"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
              :class="
                selectedLegIds.includes(leg.ticketLegId)
                  ? 'border-primary bg-primary text-button-primary-text'
                  : 'border-border bg-card'
              "
            >
              <Check
                v-if="selectedLegIds.includes(leg.ticketLegId)"
                class="h-3.5 w-3.5"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span
                class="block font-display text-sm sm:text-base text-foreground truncate"
                :title="legLabel(leg)"
                >{{ legLabel(leg) }}</span
              >
              <span
                class="block truncate text-xs sm:text-sm text-muted-foreground"
                :title="`${leg.from?.name || t('tickets.start')} -> ${leg.to?.name || t('tickets.destination')}`"
              >
                {{ leg.from?.name || t("tickets.start") }} ->
                {{ leg.to?.name || t("tickets.destination") }}
              </span>
            </span>
            <span class="text-right shrink-0">
              <span
                class="block font-display text-sm sm:text-base text-foreground"
                >{{
                  money(leg.fareAmount, refundTicketTarget.payment.currency)
                }}</span
              >
              <span
                class="block text-[10px] sm:text-xs"
                :class="legStatusTextClass(leg.status)"
                >{{ t(`tickets.legStatus.${leg.status}`) }}</span
              >
            </span>
          </button>
        </div>

        <div
          class="rounded-lg border border-primary/30 bg-secondary p-3.5 sm:p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs sm:text-sm text-foreground">{{
              t("tickets.refund.amount")
            }}</span>
            <strong class="font-display text-lg sm:text-xl text-foreground">{{
              money(refundAmount, refundTicketTarget.payment.currency)
            }}</strong>
          </div>
          <p class="mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
            {{ t("tickets.refund.note") }}
          </p>
        </div>

        <div class="flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
          <AppButton
            variant="secondary"
            class="flex-1"
            :disabled="refunding"
            @click="closeRefundModal"
          >
            {{ t("tickets.refund.cancel") }}
          </AppButton>
          <AppButton
            variant="danger"
            class="flex flex-1 items-center justify-center gap-2"
            :disabled="refunding || selectedLegIds.length === 0"
            @click="confirmRefund"
          >
            <Loader2 v-if="refunding" class="h-4 w-4 animate-spin" />
            {{
              refunding
                ? t("tickets.refund.processing")
                : t("tickets.refund.confirm")
            }}
          </AppButton>
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudOff,
  Loader2,
  Ticket as TicketIcon,
  X,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import PageTitle from "@/components/shared/PageTitle.vue";
import type { Ticket, TicketLeg, TicketLegStatus } from "@/services/api";
import { getTicket, getTickets, refundTicket } from "@/services/api";
import {
  readCurrentTicket,
  storeCurrentTicket,
} from "@/services/currentTicket";
import { useAuthState } from "@/services/authState";
import { db } from "@/db/appDb";

const router = useRouter();
const { t } = useI18n();
const { user, ensureAuthInitialized } = useAuthState();
const tickets = ref<Ticket[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const refundTicketTarget = ref<Ticket | null>(null);
const refundMode = ref<"total" | "partial">("partial");
const selectedLegIds = ref<string[]>([]);
const refunding = ref(false);
const refundError = ref("");
const offlineNotice = ref(false);
const notice = ref<{
  type: "success" | "error";
  title: string;
  message: string;
} | null>(null);

const activeTickets = computed(() =>
  tickets.value.filter((ticket) => computedTicketStatus(ticket) === "active"),
);
const historyTickets = computed(() =>
  tickets.value.filter((ticket) => computedTicketStatus(ticket) !== "active"),
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
  offlineNotice.value = false;

  try {
    await ensureAuthInitialized();
    const fresh = await getTickets();
    fresh.forEach((ticket) => {
      console.log("reactivated ticket response", ticket);
      console.log("expiresAt", ticket.expiresAt || ticket.expires_at);
    });
    tickets.value = fresh;
    // Keep the offline store in sync for the next offline visit.
    try {
      await db.tickets.bulkPut(
        fresh.map((t) => ({ ...t, savedAt: Date.now() })),
      );
    } catch {
      // Best-effort persistence.
    }
  } catch (error) {
    // Offline (or the request failed): show saved tickets with a note instead
    // of an error, as long as we have something cached.
    let offlineTickets: Ticket[] = [];
    try {
      offlineTickets = await db.tickets.orderBy("savedAt").reverse().toArray();
    } catch {
      // IndexedDB unavailable; show the network error below.
    }
    if (offlineTickets.length) {
      tickets.value = offlineTickets;
      offlineNotice.value = true;
    } else {
      errorMessage.value =
        error instanceof Error ? error.message : t("tickets.loadError");
    }
  } finally {
    loading.value = false;
  }
}

function openRefundModal(ticket: Ticket) {
  refundTicketTarget.value = ticket;
  refundError.value = "";
  if (canFullyRefund(ticket)) {
    refundMode.value = "total";
    selectedLegIds.value = refundableLegs(ticket).map((leg) => leg.ticketLegId);
  } else {
    refundMode.value = "partial";
    selectedLegIds.value = refundableLegs(ticket).map((leg) => leg.ticketLegId);
  }
}

function closeRefundModal() {
  if (refunding.value) return;
  refundTicketTarget.value = null;
  selectedLegIds.value = [];
  refundError.value = "";
}

function selectTotalRefund() {
  if (!refundTicketTarget.value || !canFullyRefund(refundTicketTarget.value))
    return;
  refundMode.value = "total";
  selectedLegIds.value = refundableLegs(refundTicketTarget.value).map(
    (leg) => leg.ticketLegId,
  );
}

function toggleLeg(leg: TicketLeg) {
  if (refundMode.value !== "partial" || !isRefundableLeg(leg)) return;
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
    tickets.value = tickets.value.map((ticket) =>
      ticket.ticketId === updated.ticketId ? updated : ticket,
    );
    if (readCurrentTicket()?.ticketId === updated.ticketId)
      storeCurrentTicket(updated);
    notice.value = {
      type: "success",
      title: t("tickets.refund.successTitle"),
      message: t("tickets.refund.successMessage", {
        amount: money(result.refundAmount, result.currency),
        count: result.refundedLegs.length,
      }),
    };
    refundTicketTarget.value = null;
    selectedLegIds.value = [];
  } catch (error) {
    refundError.value =
      error instanceof Error ? error.message : t("tickets.refund.failed");
  } finally {
    refunding.value = false;
  }
}

function refundableLegs(ticket: Ticket) {
  const paymentStatus = ticket.paymentStatus ?? ticket.payment?.status;
  // A partial refund flips the payment status to "partially_refunded"; the ticket
  // was still paid, so its remaining unused legs stay refundable.
  const isPaid =
    paymentStatus === "paid" || paymentStatus === "partially_refunded";
  const isNotExpired = !isExpired(ticket);
  const isFullyRefunded = ticket.status === "refunded";

  // An unused, unrefunded leg stays refundable even after a sibling leg is used or
  // refunded, as long as the ticket is paid, not expired, and not fully refunded.
  if (!isPaid || !isNotExpired || isFullyRefunded) return [];

  return ticket.legs.filter((leg) => !isLegUsed(leg) && !isLegRefunded(leg));
}

function canFullyRefund(ticket: Ticket) {
  const refundable = refundableLegs(ticket);
  return ticket.legs.length > 0 && refundable.length === ticket.legs.length;
}

function canRefund(ticket: Ticket) {
  return refundableLegs(ticket).length > 0;
}

function ticketRoute(ticket: Ticket) {
  const first = ticket.legs[0];
  const last = ticket.legs[ticket.legs.length - 1];
  return `${first?.from?.name || t("tickets.start")} -> ${last?.to?.name || t("tickets.destination")}`;
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
  if (!value) return t("tickets.notAvailable");
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? t("tickets.notAvailable")
    : date.toLocaleString();
}

function isExpired(ticket: Ticket) {
  const value = ticket.expiresAt || ticket.expires_at;
  if (!value) return false;
  const expiresAt = new Date(value);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt < new Date();
}

function computedTicketStatus(ticket: Ticket): Ticket["status"] | "expired" {
  const legs = ticket.legs;
  const allRefunded =
    ticket.status === "refunded" ||
    (legs.length > 0 && legs.every(isLegRefunded));
  if (allRefunded) return "refunded";
  if (isExpired(ticket)) return "expired";

  // Any leg that is neither used nor refunded can still be ridden, so the ticket
  // is active even if a sibling leg was already used or refunded.
  const hasRideableLeg = legs.some(
    (leg) => !isLegUsed(leg) && !isLegRefunded(leg),
  );
  if (hasRideableLeg) return "active";

  // No rideable legs remain (all used, or a used+refunded mix) but it isn't fully
  // refunded or expired.
  if (ticketHasUsedHistory(ticket)) return "used";
  return ticket.status;
}

function statusLabel(ticket: Ticket) {
  switch (computedTicketStatus(ticket)) {
    case "expired":
      return t("ticket.status.expired");
    case "used":
      return t("ticket.status.used");
    case "refunded":
      return t("ticket.status.refunded");
    case "partially_refunded":
      return t("ticket.status.partially_refunded");
    default:
      return t("ticket.status.active");
  }
}

function statusClass(ticket: Ticket) {
  switch (computedTicketStatus(ticket)) {
    case "expired":
      return "bg-secondary text-muted-foreground";
    case "used":
      return "bg-secondary text-muted-foreground";
    case "refunded":
      return "bg-destructive/10 text-destructive";
    case "partially_refunded":
      return "bg-warning-soft text-warning";
    default:
      return "bg-success text-success-foreground";
  }
}

function legSelectionClass(leg: TicketLeg) {
  if (!isRefundableLeg(leg))
    return "cursor-not-allowed border-border bg-muted opacity-70";
  if (selectedLegIds.value.includes(leg.ticketLegId))
    return "border-primary bg-secondary";
  return "border-border bg-card hover:border-primary";
}

function isRefundableLeg(leg: TicketLeg) {
  return !isLegUsed(leg) && !isLegRefunded(leg);
}

function isLegUsed(leg: TicketLeg) {
  return Boolean(
    leg.used || leg.usedAt || leg.validatedAt || leg.status === "used",
  );
}

function isLegRefunded(leg: TicketLeg) {
  return Boolean(leg.refunded || leg.refundedAt || leg.status === "refunded");
}

function ticketHasUsedHistory(ticket: Ticket) {
  return Boolean(ticket.usedAt || ticket.legs.some(isLegUsed));
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
        h(
          "h2",
          { class: "mb-6 font-display text-xl sm:text-2xl text-foreground" },
          `${props.title} (${props.tickets.length})`,
        ),
        props.tickets.length === 0
          ? h(
              "div",
              {
                class:
                  "rounded-xl border-2 border-dashed border-border bg-card p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground",
              },
              slots.empty?.(),
            )
          : h(
              "div",
              { class: "grid grid-cols-1 gap-6 lg:grid-cols-2" },
              props.tickets.map((ticket) =>
                h(
                  "article",
                  {
                    class:
                      "overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm",
                  },
                  [
                    h(
                      "div",
                      {
                        class:
                          "flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 bg-secondary px-4 py-3.5 sm:px-5 sm:py-4",
                      },
                      [
                        h("div", { class: "min-w-0" }, [
                          h(
                            "div",
                            {
                              class:
                                "font-display text-base sm:text-lg text-foreground",
                            },
                            t("tickets.digitalTicket"),
                          ),
                          h(
                            "div",
                            {
                              class:
                                "truncate font-mono text-xs sm:text-sm text-muted-foreground",
                            },
                            ticket.ticketId,
                          ),
                        ]),
                        h(
                          "span",
                          {
                            class: [
                              "shrink-0 self-start sm:self-center rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm",
                              statusClass(ticket),
                            ],
                          },
                          statusLabel(ticket),
                        ),
                      ],
                    ),
                    h("div", { class: "space-y-4 p-4 sm:p-5" }, [
                      h("div", [
                        h(
                          "div",
                          { class: "text-xs sm:text-sm text-muted-foreground" },
                          t("tickets.route"),
                        ),
                        h(
                          "div",
                          {
                            class:
                              "font-display text-sm sm:text-lg text-foreground",
                            title: ticketRoute(ticket),
                          },
                          ticketRoute(ticket),
                        ),
                      ]),
                      h(
                        "div",
                        { class: "flex flex-wrap gap-2 items-center" },
                        ticketModes(ticket).map((mode) =>
                          h(
                            "span",
                            {
                              class:
                                "rounded-full border border-border bg-muted px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs text-foreground",
                            },
                            mode,
                          ),
                        ),
                      ),
                      h(
                        "div",
                        { class: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
                        [
                          h(
                            "div",
                            {
                              class:
                                "rounded-lg bg-secondary p-2.5 sm:p-3 min-w-0",
                            },
                            [
                              h(
                                "div",
                                { class: "text-xs text-muted-foreground" },
                                t("tickets.totalFare"),
                              ),
                              h(
                                "div",
                                {
                                  class:
                                    "font-display text-sm sm:text-base text-foreground",
                                },
                                money(
                                  ticket.payment.amount,
                                  ticket.payment.currency,
                                ),
                              ),
                            ],
                          ),
                          h(
                            "div",
                            {
                              class:
                                "rounded-lg bg-secondary p-2.5 sm:p-3 min-w-0",
                            },
                            [
                              h(
                                "div",
                                { class: "text-xs text-muted-foreground" },
                                t("tickets.validUntil"),
                              ),
                              h(
                                "div",
                                {
                                  class:
                                    "font-display text-xs sm:text-sm text-foreground truncate",
                                  title: dateLabel(
                                    ticket.expiresAt || ticket.expires_at,
                                  ),
                                },
                                dateLabel(
                                  ticket.expiresAt || ticket.expires_at,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      h(
                        "div",
                        { class: "text-xs sm:text-sm text-muted-foreground" },
                        t("tickets.legsAvailable", {
                          count: refundableLegs(ticket).length,
                          total: ticket.legs.length,
                        }),
                      ),
                      h(
                        "div",
                        { class: "grid grid-cols-1 gap-2 sm:grid-cols-2" },
                        [
                          h(
                            AppButton,
                            {
                              variant: "outline",
                              class: "w-full",
                              onClick: () =>
                                router.push(
                                  `/ticket/${encodeURIComponent(ticket.ticketId)}`,
                                ),
                            },
                            () => t("tickets.viewDetails"),
                          ),
                          h(
                            AppButton,
                            {
                              variant: "danger",
                              class: "w-full",
                              disabled: !canRefund(ticket),
                              onClick: () => openRefundModal(ticket),
                            },
                            () =>
                              canRefund(ticket)
                                ? t("tickets.requestRefund")
                                : t("tickets.nothingToRefund"),
                          ),
                        ],
                      ),
                    ]),
                  ],
                ),
              ),
            ),
      ]);
  },
});

onMounted(loadTickets);
</script>
