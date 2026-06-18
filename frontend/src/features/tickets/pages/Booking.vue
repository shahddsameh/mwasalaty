<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
      <div class="flex items-center justify-between gap-4 mb-6">
        <button
          class="flex items-center gap-2 text-foreground hover:text-primary mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          @click="returnToRouteDetails"
        >
          <ArrowLeft class="w-5 h-5" />
          {{ t("booking.backToRouteDetails") }}
        </button>
      </div>
      <h1 class="font-display text-2xl sm:text-3xl text-foreground mb-3">
        {{ t("booking.title") }}
      </h1>
      <p class="text-muted-foreground mb-8">
        {{ t("booking.subtitle") }}
      </p>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section class="lg:col-span-2 space-y-6">
          <Card :title="t('booking.routeSummary')">
            <InfoRow :label="t('booking.from')" :value="fromLabel" />
            <InfoRow :label="t('booking.to')" :value="toLabel" />
            <InfoRow
              :label="t('booking.trip')"
              :value="t('booking.legsCount', { count: ticketableLegs.length })"
            />
            <div class="flex flex-wrap gap-2 mt-3">
              <span
                v-for="(leg, i) in ticketableLegs"
                :key="leg.legId ?? i"
                class="px-3 py-1 bg-secondary rounded-full text-sm text-foreground"
              >
                {{ modeLabel(leg) }}
              </span>
            </div>
          </Card>

          <Card :title="t('booking.legs')">
            <div class="space-y-3">
              <template v-for="group in legGroups">
                <!-- Bus / non-metro leg: one row, its own fare. -->
                <div
                  v-if="group.kind === 'leg'"
                  :key="group.key"
                  class="flex items-center justify-between gap-3 p-3 bg-secondary rounded-lg"
                >
                  <div class="min-w-0">
                    <div class="font-display text-foreground">
                      {{ modeLabel(group.leg) }}
                    </div>
                    <div class="text-sm text-muted-foreground truncate">
                      {{ group.leg.from?.name }} -> {{ group.leg.to?.name }}
                    </div>
                  </div>
                  <div class="font-display text-foreground whitespace-nowrap">
                    {{ group.amount }} {{ currency }}
                  </div>
                </div>

                <!-- Metro journey: keep each line step + interchange, one fare. -->
                <div
                  v-else
                  :key="group.key"
                  class="p-3 bg-secondary rounded-lg"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="font-display text-foreground">
                      {{ t("booking.metroJourney") }}
                    </div>
                    <div class="font-display text-foreground whitespace-nowrap">
                      {{ group.amount }} {{ currency }}
                    </div>
                  </div>
                  <div class="mt-2 space-y-1">
                    <div v-for="(leg, i) in group.legs" :key="leg.legId ?? i">
                      <div class="text-sm text-muted-foreground truncate">
                        <span class="text-foreground">{{
                          group.lineNames[i]
                        }}</span>
                        &middot; {{ leg.from?.name }} -> {{ leg.to?.name }}
                      </div>
                      <div
                        v-if="i < group.legs.length - 1"
                        class="text-xs text-muted-foreground pl-3"
                      >
                        &#8627;
                        {{ t("booking.transferAt", { station: leg.to?.name }) }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </Card>

          <Card :title="t('booking.paymentMethod')">
            <div
              class="p-4 border-2 border-primary bg-secondary rounded-lg flex items-start gap-3"
            >
              <CreditCard class="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div class="font-display text-foreground">
                  {{ t("booking.paymobTitle") }}
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ t("booking.paymobDesc") }}
                </p>
                <span
                  class="inline-block mt-2 px-2.5 py-1 rounded-full bg-secondary text-xs text-foreground"
                >
                  {{ t("booking.testBadge") }}
                </span>
              </div>
            </div>
          </Card>

          <div
            v-if="!isOnline"
            class="flex items-start gap-3 p-4 rounded-lg border-2 border-warning bg-warning-soft text-sm text-foreground"
          >
            <CloudOff class="w-5 h-5 flex-shrink-0 text-warning mt-0.5" />
            <span>{{ t("booking.offlineWarning") }}</span>
          </div>

          <p
            v-if="errorMessage"
            class="p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
          >
            {{ errorMessage }}
          </p>

          <AppButton
            size="lg"
            class="w-full flex items-center justify-center gap-2"
            :disabled="processing || !isOnline"
            @click="proceed"
          >
            <Loader2 v-if="processing" class="w-5 h-5 animate-spin" />
            <ShieldCheck v-else class="w-5 h-5" />
            {{
              processing
                ? t("booking.preparingCheckout")
                : t("booking.paySecurely", { total, currency })
            }}
          </AppButton>
        </section>

        <aside class="space-y-6">
          <Card :title="t('booking.fareBreakdown')" sticky>
            <InfoRow
              v-for="line in fareLines"
              :key="line.key"
              :label="line.label"
              :value="`${line.amount} ${currency}`"
              small
            />
            <div
              class="pt-4 border-t-2 border-border mt-4 flex items-center justify-between"
            >
              <span class="font-display text-lg">{{ t("booking.total") }}</span>
              <span class="font-display text-3xl text-primary"
                >{{ total }} {{ currency }}</span
              >
            </div>
            <div
              class="mt-4 p-3 bg-secondary rounded-lg text-sm text-muted-foreground"
            >
              {{ t("booking.includesAll") }}<br />{{ t("booking.validFor24h")
              }}<br />{{ t("booking.digitalQrTicket") }}
            </div>
          </Card>
        </aside>
      </div>
    </div>

    <Modal
      :open="loginModalOpen"
      :title="t('booking.loginRequiredTitle')"
      @close="loginModalOpen = false"
    >
      <div class="space-y-4">
        <p class="p-4 bg-secondary rounded-lg text-sm text-foreground">
          {{ t("booking.loginRequiredCopy") }}
        </p>
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="redirectToAuth('/login')">{{
            t("booking.login")
          }}</AppButton>
          <AppButton
            variant="outline"
            class="flex-1"
            @click="redirectToAuth('/signup')"
            >{{ t("booking.signUp") }}</AppButton
          >
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  CloudOff,
  CreditCard,
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import type { ApiRouteOption, ApiLeg } from "@/services/api";
import { createCheckoutSession, planRoute } from "@/services/api";
import {
  localizeMode,
  localizeRouteName,
} from "@/services/placeLocalization";
import {
  getSelectedRoute,
  getPlaceCoords,
  normalizeFilter,
  saveSelectedRoute,
  type SelectedRoute,
} from "@/features/trip-planner/services/routeSearch";
import { useAuthState } from "@/services/authState";
import { useNetworkStatus } from "@/core/offline/networkStatus";

const router = useRouter();
const currentRoute = useRoute();
const { locale, t } = useI18n();
const { user, isAuthenticated, ensureAuthInitialized } = useAuthState();
const { isOnline } = useNetworkStatus();

const CHECKOUT_SESSION_KEY = "mwasalaty:checkout-session-id";
const PENDING_BOOKING_KEY = "mwasalaty:pending-booking";
const PENDING_BOOKING_TTL_MS = 30 * 60 * 1000;

// A demo itinerary so /booking always works even without a planned route.
const DEMO_ROUTE: ApiRouteOption = {
  itineraryId: "itin_demo_001",
  id: "itin_demo_001",
  durationMinutes: 45,
  totalDistanceMeters: 0,
  transfers: 1,
  totalFare: { amount: 30, currency: "EGP" },
  summary: "Demo trip",
  legs: [
    {
      legId: "leg_bus_14",
      mode: "BUS",
      from: { name: "Greek Hospital" },
      to: { name: "Khedr Al Touny - Al Tayaran" },
      distanceMeters: 0,
      durationMinutes: 20,
      startTime: "",
      endTime: "",
      route: { shortName: "14", longName: "First Settlement-Abou Al Reesh" },
      instruction: "Take Bus 14",
      fare: { amount: 15, currency: "EGP" },
    },
    {
      legId: "leg_metro_line_2",
      mode: "SUBWAY",
      from: { name: "Sadat" },
      to: { name: "Cairo University" },
      distanceMeters: 0,
      durationMinutes: 25,
      startTime: "",
      endTime: "",
      route: { shortName: "M2", longName: "Shubra El Kheima - El Mounib" },
      instruction: "Take Metro M2",
      fare: { amount: 15, currency: "EGP" },
    },
  ],
  duration: "45 min",
  cost: "30 EGP",
  walkingDistance: "0 m",
  steps: [],
  detailSteps: [],
};

type PendingBookingState = {
  savedAt: number;
  selection: SelectedRoute;
  trip: {
    fromLabel: string;
    toLabel: string;
    filter: "fastest" | "cheapest" | "comfortable";
    departureAt?: string;
    fromCache: boolean;
  };
  payment: {
    currency: string;
    total: number;
    fareLines: Array<{ key: string; label: string; amount: number }>;
  };
  checkout: {
    planId: string;
    itineraryId: string;
  };
};

function isRouteOption(value: unknown): value is ApiRouteOption {
  const route = value as Partial<ApiRouteOption>;
  return Boolean(route?.itineraryId && Array.isArray(route.legs));
}

function readPendingBookingState(): PendingBookingState | null {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingBookingState>;
    if (
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > PENDING_BOOKING_TTL_MS ||
      !parsed.selection ||
      !isRouteOption(parsed.selection.route)
    ) {
      return null;
    }
    return parsed as PendingBookingState;
  } catch {
    return null;
  }
}

function clearPendingBookingState() {
  try {
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
  } catch {
    // Ignore storage failures.
  }
}

const restoreRequested = currentRoute.query.restoreBooking === "1";
const pendingBooking = restoreRequested ? readPendingBookingState() : null;

if (restoreRequested) {
  if (pendingBooking) {
    saveSelectedRoute(pendingBooking.selection);
  } else {
    clearPendingBookingState();
    void router.replace({
      path: "/route-results",
      query: { notice: "booking-state-expired" },
    });
  }
}

const selection = getSelectedRoute();
const route = (selection.route as ApiRouteOption) ?? DEMO_ROUTE;
const fromLabel =
  (selection.start as string) ?? route.legs?.[0]?.from?.name ?? "Start";
const toLabel =
  (selection.destination as string) ??
  route.legs?.[route.legs.length - 1]?.to?.name ??
  "Destination";
const departureAt =
  typeof selection.departureAt === "string" ? selection.departureAt : undefined;
const filter = normalizeFilter(selection.filter);
// True when the selected route came from the offline cache (preview only). We
// re-plan a fresh itinerary before checkout so the ticket is never built from
// stale cached route data.
const fromCache = Boolean(selection.fromCache);

const ticketableLegs = computed<ApiLeg[]>(() =>
  (route.legs ?? []).filter((l) => l.mode !== "WALK"),
);
const currency = computed(() => route.totalFare?.currency ?? "EGP");
const total = computed(
  () =>
    route.totalFare?.amount ??
    ticketableLegs.value.reduce((sum, l) => sum + (l.fare?.amount ?? 0), 0),
);

// A metro journey is a single fare even when it spans several lines (line
// interchanges are free), so we collapse each run of consecutive SUBWAY legs
// into one group. The combined fare is the sum of the run's leg fares — the
// backend places the combined fare on the run's first leg and 0 on the rest,
// but summing also stays correct if that ever changes. Buses stay one per group.
type MetroGroup = {
  kind: "metro";
  key: string;
  legs: ApiLeg[];
  lineNames: string[];
  amount: number;
};
type SingleLegGroup = {
  kind: "leg";
  key: string;
  leg: ApiLeg;
  fareLabel: string;
  amount: number;
};
type LegGroup = MetroGroup | SingleLegGroup;

const legGroups = computed<LegGroup[]>(() => {
  const groups: LegGroup[] = [];
  const legs = ticketableLegs.value;
  for (let i = 0; i < legs.length; ) {
    if (legs[i].mode !== "SUBWAY") {
      const leg = legs[i];
      groups.push({
        kind: "leg",
        key: leg.legId ?? `leg_${i}`,
        leg,
        fareLabel: modeLabel(leg),
        amount: leg.fare?.amount ?? 0,
      });
      i += 1;
      continue;
    }
    let j = i;
    let amount = 0;
    const run: ApiLeg[] = [];
    const lineNames: string[] = [];
    while (j < legs.length && legs[j].mode === "SUBWAY") {
      amount += legs[j].fare?.amount ?? 0;
      lineNames.push(
        localizeRouteName(
          legs[j].route?.shortName ?? legs[j].route?.longName ?? "Metro",
          locale.value,
        ),
      );
      run.push(legs[j]);
      j += 1;
    }
    groups.push({
      kind: "metro",
      key: legs[i].legId ?? `metro_${i}`,
      legs: run,
      lineNames,
      amount,
    });
    i = j;
  }
  return groups;
});

// Fare breakdown rows derive from the same grouping (compact metro label).
const fareLines = computed(() =>
  legGroups.value.map((g) => ({
    key: g.key,
    label:
      g.kind === "metro"
        ? `${t("booking.metroLabel")} ${g.lineNames.join(" → ")}`
        : g.fareLabel,
    amount: g.amount,
  })),
);

const processing = ref(false);
const errorMessage = ref("");
const loginModalOpen = ref(false);

watch(isAuthenticated, (loggedIn) => {
  if (loggedIn) {
    loginModalOpen.value = false;
  }
});

function modeLabel(leg: ApiLeg) {
  const name = localizeRouteName(
    leg.route?.shortName ?? leg.route?.longName,
    locale.value,
  );
  const mode = localizeMode(leg.mode, locale.value);
  return name ? `${mode} ${name}` : mode;
}

// Pick the best itinerary from a fresh plan, matching the rider's chosen filter.
function pickByFilter(options: ApiRouteOption[]): ApiRouteOption {
  if (filter === "cheapest") {
    return options.reduce((best, r) =>
      r.totalFare.amount < best.totalFare.amount ? r : best,
    );
  }
  if (filter === "comfortable") {
    return options.reduce((best, r) =>
      r.transfers < best.transfers ? r : best,
    );
  }
  return options.reduce((best, r) =>
    r.durationMinutes < best.durationMinutes ? r : best,
  );
}

// Ticket passenger name: the signed-in user's profile name (or their email
// handle as a fallback). Guests have no profile, so the name is omitted and the
// ticket/billing fall back to "Guest" server-side. PayMob collects the actual
// cardholder name separately at checkout.
function resolvePassengerName(): string | undefined {
  const meta = user.value?.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  if (fullName) return fullName;
  const email = user.value?.email;
  return email ? email.split("@")[0] : undefined;
}

async function startCheckout() {
  errorMessage.value = "";
  // A ticket may never be purchased from a cached/offline route preview.
  if (!isOnline.value) {
    errorMessage.value = t("booking.errors.offline");
    return;
  }
  processing.value = true;
  try {
    // If the route came from the offline cache, revalidate it against the
    // backend now and build the ticket strictly from the fresh response.
    let effectiveRoute = route;
    if (fromCache) {
      const fresh = await planRoute(
        fromLabel,
        toLabel,
        filter,
        {
          fromCoords: getPlaceCoords(fromLabel),
          toCoords: getPlaceCoords(toLabel),
        },
        departureAt
          ? {
              mode: "depart",
              date: departureAt.slice(0, 10),
              time: departureAt.slice(11, 16),
            }
          : { mode: "now" },
      );
      if (!fresh.length) {
        throw new Error(t("booking.errors.routeUnavailable"));
      }
      effectiveRoute = pickByFilter(fresh);
    }

    const freshLegs = (effectiveRoute.legs ?? []).filter(
      (l) => l.mode !== "WALK",
    );
    const freshCurrency = effectiveRoute.totalFare?.currency ?? "EGP";
    const freshTotal =
      effectiveRoute.totalFare?.amount ??
      freshLegs.reduce((sum, l) => sum + (l.fare?.amount ?? 0), 0);

    const res = await createCheckoutSession({
      planId: `plan_${effectiveRoute.itineraryId}`,
      itineraryId: effectiveRoute.itineraryId,
      ...(departureAt ? { departureAt } : {}),
      passenger: {
        userId: user.value?.id ?? "guest",
        ...(resolvePassengerName() ? { name: resolvePassengerName() } : {}),
        email: user.value?.email ?? undefined,
        phone:
          typeof user.value?.user_metadata?.phone === "string"
            ? user.value.user_metadata.phone
            : undefined,
      },
      paymentBreakdown: {
        fareAmount: freshTotal,
        serviceFee: 0,
        totalAmount: freshTotal,
        operatorReceivable: freshTotal,
        platformCommission: 0,
        monetizationMode: "ADOPTION_FREE",
        currency: freshCurrency,
      },
      itinerary: {
        itineraryId: effectiveRoute.itineraryId,
        legs: freshLegs.map((l) => ({
          legId: l.legId,
          mode: l.mode,
          route: l.route ?? { shortName: l.mode, longName: l.mode },
          from: { name: l.from?.name ?? "" },
          to: { name: l.to?.name ?? "" },
          fareAmount: l.fare?.amount ?? 0,
          currency: l.fare?.currency ?? freshCurrency,
          ...(typeof l.stationCount === "number"
            ? { stationCount: l.stationCount }
            : {}),
        })),
      },
    });
    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, res.sessionId);
    } catch {
      // sessionStorage may be unavailable; success page falls back to the URL param.
    }
    clearPendingBookingState();
    window.location.href = res.checkoutUrl;
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : t("booking.errors.checkoutFailed");
    processing.value = false;
  }
}

function proceed() {
  void handleProceed();
}

function savePendingBookingState() {
  const selectionToSave: SelectedRoute = {
    route,
    start: fromLabel,
    destination: toLabel,
    filter,
    steps: route.detailSteps,
    departureAt,
    fromCache,
  };

  const pending: PendingBookingState = {
    savedAt: Date.now(),
    selection: selectionToSave,
    trip: {
      fromLabel,
      toLabel,
      filter,
      departureAt,
      fromCache,
    },
    payment: {
      currency: currency.value,
      total: total.value,
      fareLines: fareLines.value,
    },
    checkout: {
      planId: `plan_${route.itineraryId}`,
      itineraryId: route.itineraryId,
    },
  };

  saveSelectedRoute(selectionToSave);
  try {
    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(pending));
  } catch {
    // Existing routeSearch session state still preserves the selected trip.
  }
}

function returnToRouteDetails() {
  router.push({
    path: "/route-details",
    query: {
      start: fromLabel,
      destination: toLabel,
      filter,
    },
    state: {
      route,
      start: fromLabel,
      destination: toLabel,
      filter,
      steps: route.detailSteps,
    },
  });
}

function redirectToAuth(path: "/login" | "/signup") {
  loginModalOpen.value = false;
  router.push({
    path,
    query: { redirect: "/booking?restoreBooking=1" },
  });
}

async function handleProceed() {
  await ensureAuthInitialized();

  if (isAuthenticated.value) {
    await startCheckout();
    return;
  }

  savePendingBookingState();
  loginModalOpen.value = true;
}

const Card = defineComponent({
  props: { title: String, sticky: Boolean },
  setup:
    (p, { slots }) =>
    () =>
      h(
        "section",
        {
          class: [
            "bg-card rounded-xl p-4 sm:p-6 border-2 border-border",
            p.sticky ? "lg:sticky lg:top-8" : "",
          ],
        },
        [
          h(
            "h2",
            { class: "font-display text-xl sm:text-2xl text-foreground mb-4" },
            p.title,
          ),
          slots.default?.(),
        ],
      ),
});

const InfoRow = defineComponent({
  props: { label: String, value: String, small: Boolean },
  setup: (p) => () =>
    h("div", { class: "flex items-center justify-between mb-3 gap-3" }, [
      h(
        "span",
        {
          class: p.small
            ? "text-sm text-muted-foreground"
            : "text-muted-foreground",
        },
        p.label,
      ),
      h("span", { class: "font-display text-foreground text-right" }, p.value),
    ]),
});
</script>
