<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
      <h1 class="font-display text-2xl sm:text-3xl text-foreground mb-3">
        Booking & Payment
      </h1>
      <p class="text-muted-foreground mb-8">
        Complete your booking to get your digital ticket
      </p>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section class="lg:col-span-2 space-y-6">
          <Card title="Route Summary">
            <InfoRow label="From" :value="fromLabel" />
            <InfoRow label="To" :value="toLabel" />
            <InfoRow label="Trip" :value="`${ticketableLegs.length} leg(s)`" />
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

          <Card title="Legs">
            <div class="space-y-3">
              <div
                v-for="(leg, i) in ticketableLegs"
                :key="leg.legId ?? i"
                class="flex items-center justify-between gap-3 p-3 bg-secondary rounded-lg"
              >
                <div class="min-w-0">
                  <div class="font-display text-foreground">{{ modeLabel(leg) }}</div>
                  <div class="text-sm text-muted-foreground truncate">
                    {{ leg.from?.name }} -> {{ leg.to?.name }}
                  </div>
                </div>
                <div class="font-display text-foreground whitespace-nowrap">
                  {{ leg.fare?.amount ?? 0 }} {{ currency }}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Passenger Information">
            <AppInput
              v-model="passengerName"
              label="Full Name"
              placeholder="Enter your full name"
            />
          </Card>

          <Card title="Payment Method">
            <div class="p-4 border-2 border-primary bg-secondary rounded-lg flex items-start gap-3">
              <CreditCard class="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div class="font-display text-foreground">PayMob Secure Checkout</div>
                <p class="text-sm text-muted-foreground mt-1">
                  You'll be redirected to PayMob to complete your payment securely.
                </p>
                <span
                  class="inline-block mt-2 px-2.5 py-1 rounded-full bg-warning-soft text-xs text-foreground"
                >
                  Test / Sandbox payment — MVP
                </span>
              </div>
            </div>
          </Card>

          <p
            v-if="errorMessage"
            class="p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
          >
            {{ errorMessage }}
          </p>

          <AppButton
            size="lg"
            class="w-full flex items-center justify-center gap-2"
            :disabled="processing"
            @click="proceed"
          >
            <Loader2 v-if="processing" class="w-5 h-5 animate-spin" />
            <ShieldCheck v-else class="w-5 h-5" />
            {{ processing ? "Preparing secure checkout…" : `Pay securely - ${total} ${currency}` }}
          </AppButton>
        </section>

        <aside class="space-y-6">
          <Card title="Fare Breakdown" sticky>
            <InfoRow
              v-for="leg in ticketableLegs"
              :key="leg.legId"
              :label="modeLabel(leg)"
              :value="`${leg.fare?.amount ?? 0} ${currency}`"
              small
            />
            <div
              class="pt-4 border-t-2 border-border mt-4 flex items-center justify-between"
            >
              <span class="font-display text-lg">Total</span>
              <span class="font-display text-3xl text-primary">{{ total }} {{ currency }}</span>
            </div>
            <div
              class="mt-4 p-3 bg-secondary rounded-lg text-sm text-muted-foreground"
            >
              Includes all transport fees<br />Valid for 24 hours<br />Digital QR ticket
            </div>
          </Card>
        </aside>
      </div>
    </div>

    <Modal
      :open="loginModalOpen"
      title="Login Required"
      @close="loginModalOpen = false"
    >
      <div class="space-y-4">
        <p class="p-4 bg-secondary rounded-lg text-sm text-foreground">
          You need to log in or create an account to book and save your tickets.
        </p>
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="router.push('/login')">Login</AppButton>
          <AppButton
            variant="outline"
            class="flex-1"
            @click="router.push('/signup')"
            >Sign Up</AppButton
          >
        </div>
        <AppButton variant="ghost" class="w-full" @click="payAsGuest"
          >Continue as Guest</AppButton
        >
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import { CreditCard, Loader2, ShieldCheck } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import Modal from "@/components/ui/Modal.vue";
import type { ApiRouteOption, ApiLeg } from "@/services/api";
import { createCheckoutSession } from "@/services/api";
import { getSelectedRoute } from "@/features/trip-planner/services/routeSearch";

const router = useRouter();
const isLoggedIn = false;

const CHECKOUT_SESSION_KEY = "mwasalaty:checkout-session-id";

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

const selection = getSelectedRoute();
const route = (selection.route as ApiRouteOption) ?? DEMO_ROUTE;
const fromLabel =
  (selection.start as string) ?? route.legs?.[0]?.from?.name ?? "Start";
const toLabel =
  (selection.destination as string) ??
  route.legs?.[route.legs.length - 1]?.to?.name ??
  "Destination";

const ticketableLegs = computed<ApiLeg[]>(() =>
  (route.legs ?? []).filter((l) => l.mode !== "WALK"),
);
const currency = computed(() => route.totalFare?.currency ?? "EGP");
const total = computed(
  () =>
    route.totalFare?.amount ??
    ticketableLegs.value.reduce((sum, l) => sum + (l.fare?.amount ?? 0), 0),
);

const passengerName = ref("");
const processing = ref(false);
const errorMessage = ref("");
const loginModalOpen = ref(false);

function modeLabel(leg: ApiLeg) {
  const name = leg.route?.shortName ?? leg.route?.longName;
  const mode = leg.mode.charAt(0) + leg.mode.slice(1).toLowerCase();
  return name ? `${mode} ${name}` : mode;
}

async function startCheckout() {
  errorMessage.value = "";
  if (!passengerName.value.trim()) {
    errorMessage.value = "Please enter the passenger's full name.";
    return;
  }
  processing.value = true;
  try {
    const res = await createCheckoutSession({
      planId: `plan_${route.itineraryId}`,
      itineraryId: route.itineraryId,
      passenger: { userId: "guest", name: passengerName.value.trim() },
      paymentBreakdown: {
        fareAmount: total.value,
        serviceFee: 0,
        totalAmount: total.value,
        operatorReceivable: total.value,
        platformCommission: 0,
        monetizationMode: "ADOPTION_FREE",
        currency: currency.value,
      },
      itinerary: {
        itineraryId: route.itineraryId,
        legs: ticketableLegs.value.map((l) => ({
          legId: l.legId,
          mode: l.mode,
          route: l.route ?? { shortName: l.mode, longName: l.mode },
          from: { name: l.from?.name ?? "" },
          to: { name: l.to?.name ?? "" },
          fareAmount: l.fare?.amount ?? 0,
          currency: l.fare?.currency ?? currency.value,
        })),
      },
    });
    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, res.sessionId);
    } catch {
      // sessionStorage may be unavailable; success page falls back to the URL param.
    }
    window.location.href = res.checkoutUrl;
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : "Could not start checkout. Please try again.";
    processing.value = false;
  }
}

function proceed() {
  if (isLoggedIn) {
    startCheckout();
  } else {
    loginModalOpen.value = true;
  }
}

function payAsGuest() {
  loginModalOpen.value = false;
  startCheckout();
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
