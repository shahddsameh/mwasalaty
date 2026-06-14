<template>
  <main class="h-[100dvh] w-screen bg-background flex flex-col overflow-hidden">
    <header
      class="bg-surface-dark text-surface-dark-foreground px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-surface-dark-border flex-shrink-0"
    >
      <div class="flex items-center gap-3 min-w-0">
        <Navigation class="w-6 h-6 text-primary flex-shrink-0" />
        <div class="min-w-0">
            <div class="font-display text-lg">{{ labels.liveNavigation }}</div>
          <div class="text-xs md:text-sm text-muted-foreground truncate">
            {{ start }} -&gt; {{ destination }}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-2" @click="isOnline = !isOnline">
          <Wifi v-if="isOnline" class="w-5 h-5 text-success" />
          <WifiOff v-else class="w-5 h-5 text-muted-foreground" />
          <span
            class="hidden sm:inline text-sm"
            :class="isOnline ? 'text-success' : 'text-muted-foreground'"
          >
            {{ isOnline ? labels.online : labels.offlineDemo }}
          </span>
        </button>
        <button
          class="p-2 hover:bg-surface-dark-muted rounded-lg transition-colors flex items-center gap-1"
          @click="endModalOpen = true"
        >
          <X class="w-5 h-5" /> {{ labels.exit }}
        </button>
      </div>
    </header>

    <!-- Mobile: Full-screen map with overlay cards (Google Maps style) -->
    <!-- Desktop: Side-by-side layout -->
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">
      
      <!-- ── Map area (full screen on mobile, right side on desktop) ──────────────────────────────────────────────── -->
      <section class="absolute inset-0 lg:relative lg:flex-1 bg-muted z-0">
        <!-- Leaflet map container -->
        <div ref="mapContainer" class="absolute inset-0" />

        <!-- No-geometry notice -->
        <div
          v-if="!hasGeometry"
          class="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 text-sm text-muted-foreground shadow-lg border border-border pointer-events-none text-center max-w-xs z-[600]"
        >
          {{ labels.noGeometry }}
        </div>
      </section>

      <!-- ── Mobile: Floating overlay cards ───────────────────────────── -->
      <div class="lg:hidden absolute inset-x-0 top-0 bottom-0 flex flex-col pointer-events-none z-20">
        <!-- Top card: Current step instruction (compact) -->
        <div class="pointer-events-auto bg-card/95 backdrop-blur-sm shadow-lg border-b border-border m-3 mb-0 rounded-xl">
          <div class="p-4">
            <!-- Progress bar -->
            <div class="flex items-center justify-between mb-2 text-xs text-muted-foreground">
              <span>{{ labels.step }} {{ currentStepIndex + 1 }} {{ labels.of }} {{ steps.length }}</span>
              <span>{{ Math.round(progress) }}%</span>
            </div>
            <div class="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
              <div
                class="h-full bg-success transition-all duration-500"
                :style="{ width: `${progress}%` }"
              />
            </div>

            <!-- Current instruction -->
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                :style="{
                  backgroundColor: currentStep.color,
                  color: 'var(--card)',
                }"
              >
                {{ modeLabel(currentStep.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="font-display text-base text-foreground mb-1 leading-tight">
                  {{ currentStep.instruction }}
                </h2>
                <div class="flex items-center gap-3 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1"
                    ><Clock class="w-3 h-3" /> {{ currentStep.duration }}</span
                  >
                  <span v-if="currentStep.distance" class="flex items-center gap-1"
                    ><TrendingUp class="w-3 h-3" /> {{ currentStep.distance }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Next step preview (collapsible) -->
            <div
              v-if="nextStep"
              class="mt-3 p-2.5 bg-muted/70 rounded-lg border border-border/50"
            >
              <div class="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <ArrowRight class="w-3 h-3" /> {{ labels.next }}: {{ nextStep.instruction }}
              </div>
            </div>
          </div>
        </div>

        <!-- Spacer to push controls to bottom -->
        <div class="flex-1 min-h-0" />

        <!-- Bottom controls (Google Maps style) -->
        <div class="pointer-events-auto bg-card/95 backdrop-blur-sm shadow-lg border-t border-border m-3 mt-0 rounded-xl pb-safe">
          <div class="p-3 space-y-2">
            <!-- Main navigation buttons -->
            <div class="grid grid-cols-2 gap-2">
              <AppButton
                variant="outline"
                size="md"
                class="w-full flex items-center justify-center gap-2"
                :disabled="currentStepIndex === 0"
                @click="prev"
              >
                <ArrowLeft class="w-4 h-4" /> {{ labels.prev }}
              </AppButton>
              <AppButton
                size="md"
                class="w-full flex items-center justify-center gap-2"
                @click="next"
              >
                {{
                  currentStepIndex < steps.length - 1 ? labels.nextStep : labels.arrive
                }}
                <ArrowRight
                  v-if="currentStepIndex < steps.length - 1"
                  class="w-4 h-4"
                />
                <ThumbsUp v-else class="w-4 h-4" />
              </AppButton>
            </div>

            <!-- Secondary actions -->
            <div class="flex gap-2">
              <AppButton
                variant="secondary"
                size="sm"
                class="flex-1 flex items-center justify-center gap-1.5 text-sm"
                @click="recenterMap"
              >
                <Crosshair class="w-4 h-4" /> {{ labels.recenter }}
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                class="flex-1 flex items-center justify-center gap-1.5 text-sm"
                @click="showStepsSheet = true"
              >
                <Navigation class="w-4 h-4" /> {{ labels.allSteps }}
              </AppButton>
              <AppButton
                v-if="currentTicket"
                variant="outline"
                size="sm"
                class="flex items-center justify-center px-3"
                @click="openTicketModal"
              >
                <Ticket class="w-4 h-4" />
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Desktop: Sidebar panel ───────────────────────────── -->
      <aside
        class="hidden lg:flex flex-none lg:w-[420px] xl:w-[480px] bg-card border-r border-border flex-col overflow-hidden z-10"
      >
        <!-- progress bar -->
        <div class="p-4 md:p-5 border-b border-border flex-shrink-0">
          <div
            class="flex items-center justify-between mb-2 text-sm text-muted-foreground"
          >
            <span>{{ labels.step }} {{ currentStepIndex + 1 }} {{ labels.of }} {{ steps.length }}</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <div class="h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-success transition-all duration-500"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <!-- scrollable content -->
        <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
          <!-- current step -->
          <div>
            <div
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-success/15 border border-success text-success rounded-full text-sm mb-3"
            >
              <Navigation class="w-4 h-4" /> {{ labels.currentStep }}
            </div>
            <div
              class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-sm font-semibold mb-3"
              :style="{
                backgroundColor: currentStep.color,
                color: 'var(--card)',
              }"
            >
              {{ modeLabel(currentStep.type) }}
            </div>
            <h2 class="font-display text-lg md:text-xl text-foreground mb-2 leading-tight">
              {{ currentStep.instruction }}
            </h2>
            <div
              class="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <span class="flex items-center gap-1"
                ><Clock class="w-4 h-4" /> {{ currentStep.duration }}</span
              >
              <span v-if="currentStep.distance" class="flex items-center gap-1"
                ><TrendingUp class="w-4 h-4" /> {{ currentStep.distance }}</span
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <MiniStat :label="labels.remainingTime" :value="remainingTimeLabel" />
            <MiniStat :label="labels.distanceLeft" :value="remainingDistanceLabel" />
          </div>

          <!-- next step preview -->
          <div
            v-if="nextStep"
            class="p-3 md:p-4 bg-muted/50 rounded-lg border border-border"
          >
            <div
              class="text-xs md:text-sm text-muted-foreground mb-2 flex items-center gap-2"
            >
              <ArrowRight class="w-4 h-4" /> {{ labels.nextStep }}
            </div>
            <div class="font-display text-sm md:text-base text-foreground">
              {{ nextStep.instruction }}
            </div>
            <div class="text-xs md:text-sm text-muted-foreground mt-1">
              {{ nextStep.duration }}
            </div>
          </div>

          <!-- step-list mini-timeline -->
          <div class="space-y-1.5">
            <button
              v-for="(step, i) in steps"
              :key="i"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left hover:scale-[1.01]"
              :class="
                i === currentStepIndex
                  ? 'bg-primary/10 border-2 border-primary shadow-sm'
                  : 'border border-transparent hover:bg-muted/50 opacity-70 hover:opacity-100'
              "
              @click="goToStep(i)"
            >
              <span
                class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold shadow-sm transition-transform"
                :class="i === currentStepIndex ? 'scale-110' : ''"
                :style="{ backgroundColor: step.color }"
                >{{ i + 1 }}</span
              >
              <span class="text-sm truncate text-foreground font-medium">{{
                step.instruction
              }}</span>
            </button>
          </div>
        </div>

        <!-- stable bottom controls -->
        <div class="p-4 md:p-5 border-t border-border bg-card flex-shrink-0 space-y-2.5">
          <!-- previous / next -->
          <div class="grid grid-cols-2 gap-2.5">
            <AppButton
              variant="outline"
              size="lg"
              class="w-full flex items-center justify-center gap-2"
              :disabled="currentStepIndex === 0"
              @click="prev"
            >
              <ArrowLeft class="w-5 h-5" /> {{ labels.prev }}
            </AppButton>
            <AppButton
              size="lg"
              class="w-full flex items-center justify-center gap-2"
              @click="next"
            >
              <ArrowRight
                v-if="currentStepIndex < steps.length - 1"
                class="w-5 h-5"
              />
              <ThumbsUp v-else class="w-5 h-5" />
              {{
                currentStepIndex < steps.length - 1 ? labels.nextStep : labels.arrive
              }}
            </AppButton>
          </div>

          <AppButton
            variant="secondary"
            size="lg"
            class="w-full flex items-center justify-center gap-2"
            @click="recenterMap"
          >
            <Crosshair class="w-5 h-5" /> {{ labels.recenterMap }}
          </AppButton>

          <AppButton
            v-if="currentTicket"
            variant="outline"
            size="lg"
            class="w-full flex items-center justify-center gap-2"
            @click="openTicketModal"
          >
            <Ticket class="w-5 h-5" /> {{ labels.viewTicket }}
          </AppButton>
        </div>
      </aside>
    </div>

    <!-- Mobile: Bottom sheet for all steps -->
    <Modal
      :open="showStepsSheet"
      :title="t('liveNav.allStepsTitle')"
      @close="showStepsSheet = false"
    >
      <div class="space-y-2 max-h-[60vh] overflow-y-auto">
        <button
          v-for="(step, i) in steps"
          :key="i"
          class="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left"
          :class="
            i === currentStepIndex
              ? 'bg-primary/10 border-2 border-primary shadow-sm'
              : 'border border-border hover:bg-muted/50'
          "
          @click="goToStep(i); showStepsSheet = false"
        >
          <span
            class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold shadow-sm"
            :class="i === currentStepIndex ? 'scale-110' : ''"
            :style="{ backgroundColor: step.color }"
            >{{ i + 1 }}</span
          >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-foreground">{{ step.instruction }}</div>
            <div class="text-xs text-muted-foreground mt-0.5">{{ step.duration }}</div>
          </div>
        </button>
      </div>
    </Modal>

    <!-- End navigation modal -->
    <Modal
      :open="endModalOpen"
      :title="t('liveNav.endTitle')"
      @close="endModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-muted-foreground">
          {{ t("liveNav.endConfirm") }}
        </p>
        <div class="flex gap-3">
          <AppButton variant="danger" class="flex-1" @click="endNavigation">
            {{ t("liveNav.endNavigation") }}
          </AppButton>
          <AppButton
            variant="outline"
            class="flex-1"
            @click="endModalOpen = false"
            >{{ t("liveNav.continue") }}</AppButton
          >
        </div>
      </div>
    </Modal>

    <!-- Arrived modal -->
    <Modal
      :open="feedbackModalOpen"
      :title="t('liveNav.arrivedTitle')"
      @close="feedbackModalOpen = false"
    >
      <div class="space-y-4 text-center">
        <div
          class="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto"
        >
          <ThumbsUp class="w-8 h-8 text-success-foreground" />
        </div>
        <h3 class="font-display text-2xl text-foreground">
          {{ t("liveNav.welcomeTo", { destination }) }}
        </h3>
        <p class="text-muted-foreground">{{ t("liveNav.howWasJourney") }}</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="p-4 border-2 rounded-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
            :class="selectedFeedback === 'good' ? 'border-success bg-success/15 text-success' : 'border-border hover:border-success text-foreground'"
            :disabled="isSubmittingFeedback || feedbackSubmitted"
            @click="submitGoodFeedback"
          >
            <Smile class="w-6 h-6" />
            <span class="font-medium text-sm">{{ t("liveNav.goodRoute") }}</span>
          </button>
          <button
            type="button"
            class="p-4 border-2 rounded-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
            :class="selectedFeedback === 'bad' ? 'border-destructive bg-destructive/15 text-destructive' : 'border-border hover:border-destructive text-foreground'"
            :disabled="isSubmittingFeedback || feedbackSubmitted"
            @click="selectBadFeedback"
          >
            <Frown class="w-6 h-6" />
            <span class="font-medium text-sm">{{ t("liveNav.issuesBad") }}</span>
          </button>
        </div>
        <div v-if="selectedFeedback === 'bad' && !feedbackSubmitted" class="space-y-2 text-left animate-fade-in">
          <textarea
            v-model="issueMessage"
            rows="4"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            :placeholder="t('liveNav.issuePlaceholder')"
            :disabled="isSubmittingFeedback"
          />
          <p v-if="feedbackError" class="text-sm text-destructive">
            {{ feedbackError }}
          </p>
          <AppButton
            class="w-full"
            :disabled="isSubmittingFeedback"
            @click="submitBadFeedback"
          >
            {{ isSubmittingFeedback ? t("liveNav.submittingFeedback") : t("liveNav.submitIssue") }}
          </AppButton>
        </div>
        <p v-else-if="feedbackError" class="text-sm text-destructive">
          {{ feedbackError }}
        </p>
        <p v-if="feedbackSubmitted" class="text-sm text-success animate-fade-in font-display font-medium">
          {{ t("liveNav.feedbackThanks") }}
        </p>
        <AppButton class="w-full" @click="router.push('/')"
          >{{ t("liveNav.returnHome") }}</AppButton
        >
      </div>
    </Modal>

    <!-- Ticket modal -->
    <Modal
      :open="ticketModalOpen"
      :title="t('liveNav.digitalTicketTitle')"
      @close="ticketModalOpen = false"
    >
      <TicketPreview
        v-if="currentTicket"
        :ticket="currentTicket"
        @close="ticketModalOpen = false"
      />
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Crosshair,
  MapPin,
  Navigation,
  ThumbsUp,
  Ticket,
  TrendingUp,
  Wifi,
  WifiOff,
  X,
  Smile,
  Frown,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import TicketPreview from "@/features/tickets/components/TicketPreview.vue";
import type { ApiRouteOption, RouteDetailStep, Ticket as TicketData } from "@/services/api";
import { getTicket, submitJourneyFeedback, subscribeToTicket } from "@/services/api";
import { readCurrentTicket, storeCurrentTicket } from "@/services/currentTicket";
import {
  getSavedRouteSearch,
  getSelectedRoute,
  normalizeFilter,
  saveRouteSearch,
} from "../services/routeSearch";
import { useNavMap } from "@/composables/useNavMap";
import { useLiveLocation } from "@/composables/useLiveLocation";

// ── Route state (exactly as original) ────────────────────────────────────────
const router = useRouter();
const { t } = useI18n();
const state = history.state ?? {};
const savedSearch = getSavedRouteSearch();
const selectedRoute = getSelectedRoute();
const route = (state.route ??
  selectedRoute.route ?? {
    itineraryId: "",
    id: "",
    durationMinutes: 0,
    totalDistanceMeters: 0,
    duration: "N/A",
    cost: "N/A",
    totalFare: { amount: 0, currency: "EGP" },
    transfers: 0,
    walkingDistance: "N/A",
    summary: "",
    legs: [],
    steps: [],
    detailSteps: [],
  }) as ApiRouteOption;

const fallbackStep: RouteDetailStep = {
  type: "walking",
  instruction: t("liveNav.noStepsAvailable"),
  duration: "N/A",
  color: "var(--transport-walking)",
  softColor: "var(--transport-walking-soft)",
};

const steps = (state.steps ??
  selectedRoute.steps ??
  route.detailSteps ?? [fallbackStep]) as RouteDetailStep[];

const start = state.start ?? savedSearch.start ?? "Unknown start";
const destination =
  state.destination ?? savedSearch.destination ?? "Unknown destination";
const filter = normalizeFilter(state.filter ?? savedSearch.filter);
const progressKey = `mwasalaty:live-nav-step:${route.id || start}:${destination}`;
// Resume an interrupted trip within this window; ignore (start fresh) past it.
const LIVE_NAV_PROGRESS_TTL_MS = 3 * 60 * 60 * 1000;

saveRouteSearch({ start, destination, filter });

// ── Navigation state ──────────────────────────────────────────────────────────
const isOnline = ref(true);
const currentStepIndex = ref(readSavedStepIndex());
const endModalOpen = ref(false);
const feedbackModalOpen = ref(false);
const ticketModalOpen = ref(false);
const currentTicket = ref<TicketData | null>(matchingNavigationTicket(readCurrentTicket()));
const showStepsSheet = ref(false);
const selectedFeedback = ref<"good" | "bad" | null>(null);
const issueMessage = ref("");
const isSubmittingFeedback = ref(false);
const feedbackSubmitted = ref(false);
const feedbackError = ref<string | null>(null);
const lastAutoAdvanceAt = ref(0);
let stopTicketUpdates: (() => void) | undefined;
const labels = computed(() => ({
  liveNavigation: t("liveNav.liveNavigation"),
  online: t("liveNav.online"),
  offlineDemo: t("liveNav.offlineDemo"),
  exit: t("liveNav.exit"),
  noGeometry: t("liveNav.noGeometry"),
  step: t("liveNav.step"),
  of: t("liveNav.of"),
  next: t("liveNav.next"),
  prev: t("liveNav.prev"),
  nextStep: t("liveNav.nextStep"),
  arrive: t("liveNav.arrive"),
  recenter: t("liveNav.recenter"),
  recenterMap: t("liveNav.recenterMap"),
  allSteps: t("liveNav.allSteps"),
  currentStep: t("liveNav.currentStep"),
  remainingTime: t("liveNav.remainingTime"),
  distanceLeft: t("liveNav.distanceLeft"),
  viewTicket: t("liveNav.viewTicket"),
}));

const currentStep = computed(
  () => steps[currentStepIndex.value] ?? fallbackStep,
);
const nextStep = computed(() => steps[currentStepIndex.value + 1]);
const progress = computed(
  () => ((currentStepIndex.value + 1) / Math.max(steps.length, 1)) * 100,
);
const remainingDistanceMeters = computed(() => {
  let total = 0;
  for (let i = currentStepIndex.value; i < steps.length; i += 1) {
    total += stepGeometryDistance(steps[i]);
  }
  return total;
});
const remainingDistanceLabel = computed(() => formatDistance(remainingDistanceMeters.value));
const remainingTimeLabel = computed(() => {
  const minutes = steps
    .slice(currentStepIndex.value)
    .reduce((sum, step) => sum + parseDurationMinutes(step.duration), 0);
  return minutes > 0 ? `${minutes} min` : "N/A";
});

// ── Map ───────────────────────────────────────────────────────────────────────
const mapContainer = ref<HTMLElement | null>(null);
const { initMap, fitStep, recenter, fitFullRoute, hasGeometry, updateUserLocationMarker } = useNavMap(
  mapContainer,
  steps,
);
const { location, startTracking, stopTracking } = useLiveLocation();

onMounted(async () => {
  if (currentTicket.value) {
    stopTicketUpdates = subscribeToTicket(currentTicket.value.ticketId, (fresh) => {
      const matching = matchingNavigationTicket(fresh);
      if (!matching) return;
      currentTicket.value = matching;
      storeCurrentTicket(matching);
    });
  }
  await initMap();
  // Fit full route first if geometry exists
  fitFullRoute();
  // Then smoothly focus step 1 after a short delay
  setTimeout(() => {
    fitStep(currentStepIndex.value);
  }, 1000);
  startTracking();
});

// Re-focus map whenever the active step changes
watch(currentStepIndex, (idx) => {
  fitStep(idx);
  try {
    localStorage.setItem(
      progressKey,
      JSON.stringify({ stepIndex: idx, savedAt: Date.now() }),
    );
  } catch {
    // Ignore storage failures.
  }
});

watch(location, (nextLocation) => {
  if (!nextLocation) return;
  updateUserLocationMarker(nextLocation.lat, nextLocation.lng, nextLocation.accuracy);
  maybeAutoAdvance(nextLocation);
});

onUnmounted(() => {
  stopTicketUpdates?.();
  stopTracking();
});

// ── Step navigation ────────────────────────────────────────────────────────────
function goToStep(index: number) {
  currentStepIndex.value = index;
}

function prev() {
  if (currentStepIndex.value > 0) currentStepIndex.value -= 1;
}

function next() {
  if (currentStepIndex.value < steps.length - 1) currentStepIndex.value += 1;
  else {
    // Trip complete — don't resume this route on the next visit.
    clearNavigationProgress();
    resetFeedbackState();
    feedbackModalOpen.value = true;
  }
}

function endNavigation() {
  clearNavigationProgress();
  router.push({
    path: "/route-details",
    query: { start, destination, filter },
    state: { route, steps, start, destination, filter },
  });
}

function recenterMap() {
  recenter(currentStepIndex.value);
}

// The backend itineraryId is positional (`itin_001`, …) and reused across
// searches, so it can't tell journeys apart. Match on journey content instead:
// the ordered, normalized sequence of ticketable (non-WALK) legs. The ticket's
// legs are built from the route's legs at checkout, so the same trip lines up.
function legSignature(
  legs?: Array<{
    mode?: string;
    route?: { shortName?: string; longName?: string } | null;
    from?: { name?: string };
    to?: { name?: string };
  }>,
): string {
  return (legs ?? [])
    .filter((l) => (l.mode ?? "").toUpperCase() !== "WALK")
    .map((l) =>
      [
        (l.mode ?? "").toUpperCase(),
        (l.route?.shortName ?? l.route?.longName ?? "").trim().toLowerCase(),
        (l.from?.name ?? "").trim().toLowerCase(),
        (l.to?.name ?? "").trim().toLowerCase(),
      ].join("|"),
    )
    .join(" >> ");
}

function matchingNavigationTicket(ticket: TicketData | null): TicketData | null {
  if (!ticket) return null;
  const routeSig = legSignature(route.legs);
  return routeSig && routeSig === legSignature(ticket.legs) ? ticket : null;
}

async function openTicketModal() {
  const cached = matchingNavigationTicket(readCurrentTicket());
  currentTicket.value = cached;
  if (!cached) return;

  ticketModalOpen.value = true;
  try {
    const refreshed = matchingNavigationTicket(await getTicket(cached.ticketId));
    if (!refreshed) {
      currentTicket.value = null;
      ticketModalOpen.value = false;
      return;
    }
    currentTicket.value = refreshed;
    storeCurrentTicket(refreshed);
  } catch {
    // Keep the matching cached ticket available when offline or the refresh fails.
  }
}

function resetFeedbackState() {
  selectedFeedback.value = null;
  issueMessage.value = "";
  isSubmittingFeedback.value = false;
  feedbackSubmitted.value = false;
  feedbackError.value = null;
}

function selectBadFeedback() {
  selectedFeedback.value = "bad";
  feedbackError.value = null;
}

function feedbackPayload(rating: "good" | "bad", message: string | null) {
  return {
    userId: currentTicket.value?.passenger?.userId ?? null,
    routeId: route.id || null,
    tripId: route.itineraryId || route.id || null,
    ticketId: currentTicket.value?.ticketId ?? null,
    origin: start,
    destination,
    rating,
    issueMessage: message,
    routeSummary: route.summary || null,
    transportModes: Array.from(
      new Set((route.legs ?? []).map((leg) => String(leg.mode || "")).filter(Boolean)),
    ),
  };
}

async function submitFeedback(rating: "good" | "bad", message: string | null) {
  if (isSubmittingFeedback.value || feedbackSubmitted.value) return;
  selectedFeedback.value = rating;
  feedbackError.value = null;
  isSubmittingFeedback.value = true;
  try {
    await submitJourneyFeedback(feedbackPayload(rating, message));
    feedbackSubmitted.value = true;
  } catch (err) {
    feedbackError.value =
      err instanceof Error ? err.message : t("liveNav.feedbackSubmitError");
  } finally {
    isSubmittingFeedback.value = false;
  }
}

function submitGoodFeedback() {
  void submitFeedback("good", null);
}

function submitBadFeedback() {
  const message = issueMessage.value.trim();
  if (!message) {
    feedbackError.value = t("liveNav.issueRequired");
    return;
  }
  void submitFeedback("bad", message);
}

function modeLabel(type: string) {
  return type === "walking"
    ? t("liveNav.modeWalk")
    : type === "metro"
      ? t("liveNav.modeMetro")
      : t("liveNav.modeBus");
}

type NavPoint = { lat: number; lng: number } | [number, number];

function normalizePoint(point: unknown): { lat: number; lng: number } | null {
  if (Array.isArray(point) && point.length >= 2) {
    const [lat, lng] = point;
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (point && typeof point === "object") {
    const candidate = point as Partial<{ lat: number; lng: number }>;
    return Number.isFinite(candidate.lat) && Number.isFinite(candidate.lng)
      ? { lat: candidate.lat as number, lng: candidate.lng as number }
      : null;
  }
  return null;
}

function distanceMeters(a: NavPoint, b: NavPoint) {
  const pointA = normalizePoint(a);
  const pointB = normalizePoint(b);
  if (!pointA || !pointB) return 0;

  const radius = 6371000;
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function stepGeometryDistance(step: RouteDetailStep | undefined) {
  const geometry = Array.isArray(step?.geometry) ? step.geometry : [];
  let total = 0;
  for (let i = 1; i < geometry.length; i += 1) {
    total += distanceMeters(geometry[i - 1] as NavPoint, geometry[i] as NavPoint);
  }
  return total;
}

function parseDurationMinutes(duration: string) {
  const value = Number.parseFloat(duration);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function formatDistance(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "N/A";
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
}

function maybeAutoAdvance(userLocation: { lat: number; lng: number; accuracy: number }) {
  if (userLocation.accuracy > 80 || currentStepIndex.value >= steps.length - 1) return;
  const geometry = currentStep.value?.geometry;
  const stepEnd = Array.isArray(geometry) ? normalizePoint(geometry[geometry.length - 1]) : null;
  if (!stepEnd) return;
  const now = Date.now();
  if (now - lastAutoAdvanceAt.value < 10000) return;
  if (distanceMeters(userLocation, stepEnd) <= 40) {
    lastAutoAdvanceAt.value = now;
    next();
  }
}

function readSavedStepIndex() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(progressKey);
  } catch {
    return 0;
  }
  if (!raw) return 0;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 0;
  }

  // Only accept the timestamped shape; ignore legacy bare-number values.
  if (!parsed || typeof parsed !== "object") return 0;
  const { stepIndex, savedAt } = parsed as {
    stepIndex?: unknown;
    savedAt?: unknown;
  };
  if (typeof stepIndex !== "number" || typeof savedAt !== "number") return 0;

  // Resume only an interrupted trip within the window; otherwise start fresh.
  if (Date.now() - savedAt > LIVE_NAV_PROGRESS_TTL_MS) return 0;

  if (!Number.isFinite(stepIndex)) return 0;
  return Math.min(Math.max(stepIndex, 0), Math.max(steps.length - 1, 0));
}

function clearNavigationProgress() {
  try {
    localStorage.removeItem(progressKey);
  } catch {
    // Ignore storage failures.
  }
}

// ── Inline sub-components (unchanged from original) ───────────────────────────
const MiniStat = defineComponent({
  props: { label: String, value: String },
  setup: (props) => () =>
    h("div", { class: "p-3 bg-secondary/50 rounded-lg border border-border" }, [
      h("div", { class: "text-xs text-muted-foreground mb-0.5" }, props.label),
      h("div", { class: "font-display text-lg text-foreground" }, props.value),
    ]),
});
</script>
