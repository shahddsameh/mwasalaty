<template>
  <main class="h-[100dvh] w-screen bg-background flex flex-col overflow-hidden">
    <header
      class="bg-surface-dark text-surface-dark-foreground px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-surface-dark-border flex-shrink-0"
    >
      <div class="flex items-center gap-3 min-w-0">
        <Navigation class="w-6 h-6 text-primary flex-shrink-0" />
        <div class="min-w-0">
          <div class="font-display text-lg">Live Navigation</div>
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
            {{ isOnline ? "Online" : "Offline (Cached)" }}
          </span>
        </button>
        <button
          class="p-2 hover:bg-surface-dark-muted rounded-lg transition-colors flex items-center gap-1"
          @click="endModalOpen = true"
        >
          <X class="w-5 h-5" /> Exit
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
          Map route shape is not available for this step yet.
        </div>
      </section>

      <!-- ── Mobile: Floating overlay cards ───────────────────────────── -->
      <div class="lg:hidden absolute inset-x-0 top-0 bottom-0 flex flex-col pointer-events-none z-20">
        <!-- Top card: Current step instruction (compact) -->
        <div class="pointer-events-auto bg-card/95 backdrop-blur-sm shadow-lg border-b border-border m-3 mb-0 rounded-xl">
          <div class="p-4">
            <!-- Progress bar -->
            <div class="flex items-center justify-between mb-2 text-xs text-muted-foreground">
              <span>Step {{ currentStepIndex + 1 }} of {{ steps.length }}</span>
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
                <ArrowRight class="w-3 h-3" /> Next: {{ nextStep.instruction }}
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
                <ArrowLeft class="w-4 h-4" /> Prev
              </AppButton>
              <AppButton
                size="md"
                class="w-full flex items-center justify-center gap-2"
                @click="next"
              >
                {{
                  currentStepIndex < steps.length - 1 ? "Next Step" : "Arrive"
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
                <Crosshair class="w-4 h-4" /> Recenter
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                class="flex-1 flex items-center justify-center gap-1.5 text-sm"
                @click="showStepsSheet = true"
              >
                <Navigation class="w-4 h-4" /> All Steps
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                class="flex items-center justify-center px-3"
                @click="ticketModalOpen = true"
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
            <span>Step {{ currentStepIndex + 1 }} of {{ steps.length }}</span>
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
              <Navigation class="w-4 h-4" /> Current Step
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
            <MiniStat label="Remaining Time" value="32 min" />
            <MiniStat label="Distance Left" value="18.5 km" />
          </div>

          <!-- next step preview -->
          <div
            v-if="nextStep"
            class="p-3 md:p-4 bg-muted/50 rounded-lg border border-border"
          >
            <div
              class="text-xs md:text-sm text-muted-foreground mb-2 flex items-center gap-2"
            >
              <ArrowRight class="w-4 h-4" /> Next Step
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
              <ArrowLeft class="w-5 h-5" /> Prev
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
                currentStepIndex < steps.length - 1 ? "Next Step" : "Arrive"
              }}
            </AppButton>
          </div>

          <AppButton
            variant="secondary"
            size="lg"
            class="w-full flex items-center justify-center gap-2"
            @click="recenterMap"
          >
            <Crosshair class="w-5 h-5" /> Recenter Map
          </AppButton>

          <AppButton
            variant="outline"
            size="lg"
            class="w-full flex items-center justify-center gap-2"
            @click="ticketModalOpen = true"
          >
            <Ticket class="w-5 h-5" /> View Digital Ticket
          </AppButton>
        </div>
      </aside>
    </div>

    <!-- Mobile: Bottom sheet for all steps -->
    <Modal
      :open="showStepsSheet"
      title="All Navigation Steps"
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
      title="End Navigation"
      @close="endModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-muted-foreground">
          Are you sure you want to end navigation? Your progress will be saved.
        </p>
        <div class="flex gap-3">
          <AppButton
            variant="danger"
            class="flex-1"
            @click="
              router.push({
                path: '/route-details',
                query: { start, destination, filter },
                state: { route, steps, start, destination, filter },
              })
            "
          >
            End Navigation
          </AppButton>
          <AppButton
            variant="outline"
            class="flex-1"
            @click="endModalOpen = false"
            >Continue</AppButton
          >
        </div>
      </div>
    </Modal>

    <!-- Arrived modal -->
    <Modal
      :open="feedbackModalOpen"
      title="You've Arrived!"
      @close="feedbackModalOpen = false"
    >
      <div class="space-y-4 text-center">
        <div
          class="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto"
        >
          <ThumbsUp class="w-8 h-8 text-success-foreground" />
        </div>
        <h3 class="font-display text-2xl text-foreground">
          Welcome to {{ destination }}!
        </h3>
        <p class="text-muted-foreground">How was your journey?</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="p-4 border-2 rounded-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
            :class="feedbackRating === 'good' ? 'border-success bg-success/15 text-success' : 'border-border hover:border-success text-foreground'"
            @click="feedbackRating = 'good'"
          >
            <Smile class="w-6 h-6" />
            <span class="font-medium text-sm">Good Route</span>
          </button>
          <button
            type="button"
            class="p-4 border-2 rounded-lg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
            :class="feedbackRating === 'bad' ? 'border-destructive bg-destructive/15 text-destructive' : 'border-border hover:border-destructive text-foreground'"
            @click="feedbackRating = 'bad'"
          >
            <Frown class="w-6 h-6" />
            <span class="font-medium text-sm">Issues / Bad</span>
          </button>
        </div>
        <p v-if="feedbackRating" class="text-sm text-success animate-fade-in font-display font-medium">
          Thank you! Your feedback helps improve Cairo's transit routes.
        </p>
        <AppButton class="w-full" @click="router.push('/')"
          >Return Home</AppButton
        >
      </div>
    </Modal>

    <!-- Ticket modal -->
    <Modal
      :open="ticketModalOpen"
      title="Digital Ticket"
      @close="ticketModalOpen = false"
    >
      <TicketPreview @close="ticketModalOpen = false" />
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Crosshair,
  MapPin,
  Navigation,
  QrCode,
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
import { ticketData } from "@/constants/data";
import type { ApiRouteOption, RouteDetailStep } from "@/services/api";
import {
  getSavedRouteSearch,
  getSelectedRoute,
  normalizeFilter,
  saveRouteSearch,
} from "../services/routeSearch";
import { useNavMap } from "@/composables/useNavMap";

// ── Route state (exactly as original) ────────────────────────────────────────
const router = useRouter();
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
  instruction: "No navigation steps available.",
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

saveRouteSearch({ start, destination, filter });

// ── Navigation state ──────────────────────────────────────────────────────────
const isOnline = ref(true);
const currentStepIndex = ref(0);
const endModalOpen = ref(false);
const feedbackModalOpen = ref(false);
const ticketModalOpen = ref(false);
const showStepsSheet = ref(false);
const feedbackRating = ref<"good" | "bad" | null>(null);

const currentStep = computed(
  () => steps[currentStepIndex.value] ?? fallbackStep,
);
const nextStep = computed(() => steps[currentStepIndex.value + 1]);
const progress = computed(
  () => ((currentStepIndex.value + 1) / Math.max(steps.length, 1)) * 100,
);

// ── Map ───────────────────────────────────────────────────────────────────────
const mapContainer = ref<HTMLElement | null>(null);
const { initMap, fitStep, recenter, fitFullRoute, hasGeometry } = useNavMap(
  mapContainer,
  steps,
);

onMounted(async () => {
  await initMap();
  // Fit full route first if geometry exists
  fitFullRoute();
  // Then smoothly focus step 1 after a short delay
  setTimeout(() => {
    fitStep(0);
  }, 1000);
});

// Re-focus map whenever the active step changes
watch(currentStepIndex, (idx) => {
  fitStep(idx);
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
  else feedbackModalOpen.value = true;
}

function recenterMap() {
  recenter(currentStepIndex.value);
}

function modeLabel(type: string) {
  return type === "walking" ? "Walk" : type === "metro" ? "Metro" : "Bus";
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

const TicketPreview = defineComponent({
  emits: ["close"],
  setup(_, { emit }) {
    return () =>
      h("div", { class: "space-y-5" }, [
        h(
          "div",
          {
            class:
              "flex items-center justify-between p-4 bg-gradient-to-br from-primary-soft via-warning-soft to-primary rounded-lg",
          },
          [
            h("div", [
              h(
                "div",
                { class: "font-display text-lg text-foreground" },
                "Mwasalaty",
              ),
              h(
                "div",
                { class: "text-sm text-foreground" },
                "Transport Ticket",
              ),
            ]),
            h(
              "div",
              {
                class:
                  "px-3 py-1 rounded-full bg-success text-success-foreground flex items-center gap-1 text-sm",
              },
              [h(Check, { class: "w-4 h-4" }), "Valid"],
            ),
          ],
        ),
        h("div", { class: "flex flex-col items-center py-4" }, [
          h(
            "div",
            {
              class:
                "w-56 h-56 bg-card border-4 border-border rounded-2xl flex items-center justify-center mb-4",
            },
            [h(QrCode, { class: "w-48 h-48 text-foreground" })],
          ),
          h(
            "div",
            { class: "font-mono text-sm text-center break-all" },
            ticketData.id,
          ),
        ]),
        h("div", { class: "grid grid-cols-2 gap-3" }, [
          h("div", { class: "p-3 bg-secondary rounded-lg" }, [
            h("div", { class: "text-xs text-muted-foreground" }, "Cost"),
            h("div", { class: "font-display" }, ticketData.cost),
          ]),
          h("div", { class: "p-3 bg-secondary rounded-lg" }, [
            h("div", { class: "text-xs text-muted-foreground" }, "Valid Until"),
            h("div", { class: "font-display" }, ticketData.validUntil),
          ]),
        ]),
        h("div", { class: "flex gap-3" }, [
          h(
            AppButton,
            { class: "flex-1", onClick: () => emit("close") },
            () => "Close",
          ),
          h(
            AppButton,
            {
              variant: "outline",
              class: "flex-1",
              onClick: () => router.push("/ticket"),
            },
            () => "Full Details",
          ),
        ]),
      ]);
  },
});
</script>
