<template>
  <main class="h-screen pb-20 bg-background flex flex-col overflow-hidden">
    <header
      class="bg-surface-dark text-surface-dark-foreground px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-surface-dark-border"
    >
      <div class="flex items-center gap-3 min-w-0">
        <Navigation class="w-6 h-6 text-primary flex-shrink-0" />
        <div class="min-w-0">
          <div class="font-display text-lg">Live Navigation</div>
          <div class="text-xs md:text-sm text-muted-foreground truncate">
            {{ start }} -> {{ destination }}
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

    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <aside
        class="w-full lg:w-[480px] bg-card border-b-2 lg:border-b-0 lg:border-r-2 border-border flex flex-col overflow-auto"
      >
        <div class="p-4 md:p-6 border-b border-border">
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

        <div class="flex-1 overflow-auto p-4 md:p-6">
          <div class="mb-6 text-center">
            <div
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-success text-success-foreground rounded-full text-sm mb-4"
            >
              <Navigation class="w-4 h-4" /> Current Step
            </div>
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center text-sm font-semibold mb-4 mx-auto"
              :style="{
                backgroundColor: currentStep.color,
                color: 'var(--card)',
              }"
            >
              {{ modeLabel(currentStep.type) }}
            </div>
            <h2 class="font-display text-xl lg:text-2xl text-foreground mb-2">
              {{ currentStep.instruction }}
            </h2>
            <div
              class="flex items-center justify-center gap-4 text-muted-foreground"
            >
              <span class="flex items-center gap-1"
                ><Clock class="w-4 h-4" /> {{ currentStep.duration }}</span
              >
              <span v-if="currentStep.distance" class="flex items-center gap-1"
                ><TrendingUp class="w-4 h-4" /> {{ currentStep.distance }}</span
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <MiniStat label="Remaining Time" value="32 min" />
            <MiniStat label="Distance Left" value="18.5 km" />
          </div>

          <div
            v-if="nextStep"
            class="p-4 bg-muted rounded-lg border border-border"
          >
            <div
              class="text-sm text-muted-foreground mb-2 flex items-center gap-2"
            >
              <ArrowRight class="w-4 h-4" /> Next Step
            </div>
            <div class="font-display text-foreground">
              {{ nextStep.instruction }}
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              {{ nextStep.duration }}
            </div>
          </div>

          <div class="mt-6 space-y-3">
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
                currentStepIndex < steps.length - 1
                  ? "Continue to Next Step"
                  : "Arrive at Destination"
              }}
            </AppButton>
            <AppButton
              variant="secondary"
              size="lg"
              class="w-full flex items-center justify-center gap-2"
            >
              <MapPin class="w-5 h-5" /> Reroute
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
        </div>
      </aside>

      <section class="flex-1 relative min-h-[300px] lg:min-h-0">
        <div
          class="absolute inset-0 bg-gradient-to-br from-primary-soft via-warning-soft to-primary flex items-center justify-center p-4"
        >
          <div class="text-center">
            <MapPin
              class="w-24 h-24 lg:w-32 lg:h-32 text-foreground mx-auto mb-4 animate-pulse"
            />
            <p class="text-xl lg:text-2xl font-display text-foreground mb-2">
              Live GPS Tracking
            </p>
            <p class="text-muted-foreground">
              Your position updates in real-time
            </p>
          </div>
        </div>
        <div
          class="absolute top-4 md:top-8 left-4 md:left-8 right-4 md:right-8 bg-card/95 backdrop-blur rounded-xl p-4 shadow-lg border-2 border-border"
        >
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 bg-success rounded-full animate-pulse" />
            <div>
              <div class="text-sm text-muted-foreground">Current Location</div>
              <div class="font-display text-foreground">
                Sadat Metro Station
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

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
                state: { route, start, destination },
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
            class="p-4 border-2 border-border rounded-lg hover:border-success"
          >
            Good Route
          </button>
          <button
            class="p-4 border-2 border-border rounded-lg hover:border-destructive"
          >
            Issues
          </button>
        </div>
        <AppButton class="w-full" @click="router.push('/')"
          >Return Home</AppButton
        >
      </div>
    </Modal>

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
import { computed, defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowRight,
  Check,
  Clock,
  MapPin,
  Navigation,
  QrCode,
  ThumbsUp,
  Ticket,
  TrendingUp,
  Wifi,
  WifiOff,
  X,
} from "@lucide/vue";
import AppButton from "../components/AppButton.vue";
import Modal from "../components/Modal.vue";
import { defaultSteps, routeOptions, ticketData } from "../data";

const router = useRouter();
const state = history.state ?? {};
const route = state.route ?? routeOptions[0];
const steps = state.steps ?? defaultSteps;
const start = state.start ?? "Tahrir Square";
const destination = state.destination ?? "Cairo Airport";
const isOnline = ref(true);
const currentStepIndex = ref(0);
const endModalOpen = ref(false);
const feedbackModalOpen = ref(false);
const ticketModalOpen = ref(false);
const currentStep = computed(() => steps[currentStepIndex.value] ?? steps[0]);
const nextStep = computed(() => steps[currentStepIndex.value + 1]);
const progress = computed(
  () => ((currentStepIndex.value + 1) / steps.length) * 100,
);

const MiniStat = defineComponent({
  props: { label: String, value: String },
  setup: (props) => () =>
    h("div", { class: "p-4 bg-secondary rounded-lg" }, [
      h("div", { class: "text-sm text-muted-foreground" }, props.label),
      h("div", { class: "font-display text-xl text-foreground" }, props.value),
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

function modeLabel(type: string) {
  return type === "walking" ? "Walk" : type === "metro" ? "Metro" : "Bus";
}

function next() {
  if (currentStepIndex.value < steps.length - 1) currentStepIndex.value += 1;
  else feedbackModalOpen.value = true;
}
</script>
