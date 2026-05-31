<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <button
        class="flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
        @click="router.push('/route-results')"
      >
        <ArrowLeft class="w-5 h-5" /> Back to Results
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div class="lg:col-span-2">
          <section class="mb-6">
            <h1 class="font-display text-2xl md:text-3xl text-foreground mb-2">
              Route Details
            </h1>
            <div
              class="flex items-center gap-2 text-sm md:text-base text-muted-foreground"
            >
              <MapPin class="w-4 h-4" /> {{ start }} -> {{ destination }}
            </div>
          </section>

          <div
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary rounded-xl p-4 md:p-6 mb-6 border-2 border-primary flex items-start gap-3"
          >
            <Sparkles class="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
            <div>
              <h3 class="font-display text-lg text-foreground mb-2">
                AI Route Explanation
              </h3>
              <p class="text-sm md:text-base text-foreground">
                Start by walking to Sadat Metro Station. Take Metro Line 1
                (Helwan – New El Marg) and transfer at Sadat to reach Nasser
                Station. From there, walk to the Airport Bus Stop and board Bus
                356 heading to Cairo International Airport. The route concludes
                at Terminal 3.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Summary :icon="Clock" label="Duration" :value="route.duration" />
            <Summary
              :icon="DollarSign"
              label="Total Cost"
              :value="route.cost"
            />
            <Summary
              :icon="MapPin"
              label="Transfers"
              :value="String(route.transfers)"
            />
            <Summary :icon="TrendingUp" label="Walking" value="600m" />
          </div>

          <section class="bg-card rounded-xl p-4 md:p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-6">
              Step-by-Step
            </h3>
            <div class="space-y-4">
              <div
                v-for="(step, index) in steps"
                :key="step.instruction"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    :class="getStepColor(step.type)"
                  >
                    <component :is="getStepIcon(step.type)" class="w-5 h-5" />
                  </div>
                  <div
                    v-if="index < steps.length - 1"
                    class="w-0.5 h-14 bg-border my-2"
                  />
                </div>
                <div class="flex-1 pb-4">
                  <div class="font-display text-foreground mb-1">
                    {{ step.instruction }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ step.duration
                    }}<span v-if="step.distance"> - {{ step.distance }}</span
                    ><span v-if="step.stops"> - {{ step.stops }} stops</span>
                  </div>
                  <div
                    v-if="step.from || step.to"
                    class="text-sm text-muted-foreground mt-2"
                  >
                    {{ step.from }} -> {{ step.to }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6">
            <AppButton
              size="lg"
              class="flex items-center justify-center gap-2"
              @click="
                router.push({
                  path: '/live-navigation',
                  state: { route, steps, start, destination },
                })
              "
            >
              <Navigation class="w-5 h-5" /> Start Navigation
            </AppButton>
            <AppButton
              variant="outline"
              size="lg"
              class="flex items-center justify-center gap-2"
              @click="saveModalOpen = true"
            >
              <BookmarkPlus class="w-5 h-5" /> Save Route
            </AppButton>
            <AppButton
              variant="outline"
              size="lg"
              class="flex items-center justify-center gap-2"
              @click="router.push('/booking')"
            >
              <DollarSign class="w-5 h-5" /> Book & Pay
            </AppButton>
          </div>
        </div>

        <aside class="lg:sticky lg:top-8 h-fit space-y-4 md:space-y-6">
          <div class="bg-card rounded-xl p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-4">Route Map</h3>
            <div
              class="aspect-square bg-gradient-to-br from-primary-soft via-warning-soft to-primary rounded-lg flex items-center justify-center border-2 border-border"
            >
              <div class="text-center">
                <MapPin class="w-16 h-16 text-foreground mx-auto mb-2" />
                <p class="text-sm text-foreground">Interactive route map</p>
                <p class="text-xs text-muted-foreground">with live tracking</p>
              </div>
            </div>
          </div>
          <AppButton
            variant="outline"
            class="w-full flex items-center justify-center gap-2"
            @click="savePlaceModalOpen = true"
          >
            <BookmarkPlus class="w-5 h-5" /> Save Destination
          </AppButton>
        </aside>
      </div>
    </div>

    <Modal
      :open="saveModalOpen"
      title="Save Route"
      @close="saveModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-muted-foreground">
          Save this route for quick access later.
        </p>
        <input
          class="w-full px-4 py-2.5 bg-card border border-border rounded-lg"
          placeholder="Route name (optional)"
        />
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="saveModalOpen = false"
            >Save Route</AppButton
          >
          <AppButton
            variant="outline"
            class="flex-1"
            @click="saveModalOpen = false"
            >Cancel</AppButton
          >
        </div>
      </div>
    </Modal>

    <Modal
      :open="savePlaceModalOpen"
      title="Save Place"
      @close="savePlaceModalOpen = false"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="type in ['Home', 'Work', 'School', 'Other']"
            :key="type"
            class="p-3 border-2 border-border rounded-lg hover:border-primary"
          >
            {{ type }}
          </button>
        </div>
        <input
          class="w-full px-4 py-2.5 bg-card border border-border rounded-lg"
          placeholder="Custom name (optional)"
        />
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="savePlaceModalOpen = false"
            >Save Place</AppButton
          >
          <AppButton
            variant="outline"
            class="flex-1"
            @click="savePlaceModalOpen = false"
            >Cancel</AppButton
          >
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  BookmarkPlus,
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  Sparkles,
  TrendingUp,
  Train,
  Bus,
  Car,
  PersonStanding,
} from "@lucide/vue";
import AppButton from "../components/AppButton.vue";
import Modal from "../components/Modal.vue";
import { defaultSteps, routeOptions } from "../data";

const router = useRouter();
const state = history.state ?? {};
const route = state.route ?? routeOptions[0];
const start = state.start ?? "Tahrir Square";
const destination = state.destination ?? "Cairo Airport";
const steps = state.steps ?? defaultSteps;
const saveModalOpen = ref(false);
const savePlaceModalOpen = ref(false);

const Summary = defineComponent({
  props: {
    icon: { type: [Object, Function], required: true },
    label: String,
    value: String,
  },
  setup(props) {
    return () =>
      h("div", { class: "bg-card rounded-lg p-4 border-2 border-border" }, [
        h(props.icon as any, { class: "w-5 h-5 text-muted-foreground mb-2" }),
        h("div", { class: "text-sm text-muted-foreground" }, props.label),
        h(
          "div",
          { class: "font-display text-xl text-foreground" },
          props.value,
        ),
      ]);
  },
});
function getStepIcon(type: string) {
  switch (type) {
    case "metro":
      return Train;
    case "bus":
      return Bus;
    case "microbus":
    case "ride-hailing":
      return Car;
    case "walking":
    case "walk":
      return PersonStanding;
    default:
      return Bus;
  }
}
function getStepColor(type: string) {
  switch (type) {
    case "metro":
      return "bg-transport-metro-soft , text-transport-metro";
    case "bus":
      return "bg-transport-bus-soft , text-transport-bus";
    case "microbus":
      return "bg-transport-microbus-soft, text-transport-microbus-soft";
    case "walking":
      return "bg-transport-walking-soft , text-transport-walking";
    case "ride-hailing":
      return "bg-transport-ride-soft, text-transport-ride";
    default:
      return "bg-primary-soft";
  }
}
</script>
