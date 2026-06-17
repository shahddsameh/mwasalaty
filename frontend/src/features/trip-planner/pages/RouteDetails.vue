<template>
  <main class="min-h-screen pb-20 bg-background">
    <div
      class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-5 sm:py-6 md:py-8"
    >
      <button
        class="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary mb-4 sm:mb-6 transition-colors"
        @click="backToResults"
      >
        <ArrowLeft class="w-4 h-4 rtl:rotate-180" />
        {{ t("routeDetails.backToResults") }}
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div class="lg:col-span-2 order-last lg:order-first">
          <section class="mb-4 sm:mb-6">
            <h1
              class="font-display text-xl sm:text-2xl md:text-3xl text-foreground mb-1.5"
            >
              {{ t("routeDetails.title") }}
            </h1>
            <div
              class="flex items-start gap-1.5 text-xs sm:text-sm text-muted-foreground min-w-0"
            >
              <MapPin class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span class="leading-tight whitespace-normal"
                >{{ displayStart }} → {{ displayDestination }}</span
              >
            </div>
          </section>

          <div
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary text-gradient-foreground rounded-xl p-3.5 sm:p-5 mb-5 border-2 border-primary flex items-start gap-2.5"
          >
            <Sparkles class="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div class="min-w-0">
              <h3
                class="font-display text-sm sm:text-base md:text-lg mb-1 font-semibold"
              >
                {{ t("routeDetails.aiExplanation") }}
              </h3>
              <p class="text-xs sm:text-sm leading-relaxed opacity-95">
                {{ routeExplanation }}
              </p>
            </div>
          </div>

          <div
            class="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-5 sm:mb-6"
          >
            <Summary
              :icon="Clock"
              :label="t('routeDetails.duration')"
              :value="formatUnit(route.duration)"
            />
            <Summary
              :icon="DollarSign"
              :label="t('routeDetails.totalCost')"
              :value="formatUnit(route.cost)"
            />
            <Summary
              :icon="MapPin"
              :label="t('routeDetails.transfers')"
              :value="String(route.transfers)"
            />
            <Summary
              :icon="TrendingUp"
              :label="t('routeDetails.walking')"
              :value="formatUnit(route.walkingDistance)"
            />
          </div>

          <section
            class="bg-card rounded-xl p-3.5 sm:p-5 md:p-6 border-2 border-border"
          >
            <h3
              class="font-display text-lg sm:text-xl text-foreground mb-5 sm:mb-6 font-semibold"
            >
              {{ t("routeDetails.stepByStep") }}
            </h3>
            <div class="relative pl-0.5">
              <div
                v-for="(step, index) in displaySteps"
                :key="step.instruction"
                class="relative flex items-start gap-3 sm:gap-4 pb-5 sm:pb-6 last:pb-0"
              >
                <!-- Vertical timeline line -->
                <div
                  v-if="index < displaySteps.length - 1"
                  :class="[
                    'absolute top-8 bottom-0 w-0.5 bg-border',
                    locale === 'ar'
                      ? 'right-4 sm:right-5 translate-x-1/2'
                      : 'left-4 sm:left-5 -translate-x-1/2',
                  ]"
                />

                <!-- Timeline Icon Circle -->
                <div
                  class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 shrink-0"
                  :class="getStepColor(step.type)"
                >
                  <component
                    :is="getStepIcon(step.type)"
                    class="w-4 h-4 sm:w-5 sm:h-5"
                  />
                </div>

                <!-- Timeline Content -->
                <div class="min-w-0 flex-1 overflow-hidden">
                  <h4
                    class="font-display text-sm sm:text-base text-foreground font-medium leading-snug break-words whitespace-normal"
                  >
                    {{ step.instruction }}
                  </h4>
                  <div
                    class="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"
                  >
                    <span>{{ step.duration }}</span>
                    <span v-if="step.distance" class="text-border">•</span>
                    <span v-if="step.distance">{{ step.distance }}</span>
                    <span v-if="step.stops" class="text-border">•</span>
                    <span v-if="step.stops">{{
                      t("routeDetails.stops", { count: step.stops })
                    }}</span>
                  </div>
                  <div
                    v-if="step.from || step.to"
                    class="text-xs sm:text-sm text-muted-foreground mt-2 bg-secondary/60 rounded-lg p-2"
                  >
                    <span
                      class="font-medium break-words whitespace-normal"
                      :title="step.from"
                    >
                      {{ step.from || t("routeDetails.start") }}
                    </span>

                    <span class="shrink-0 mx-2">
                      {{ locale === "ar" ? "←" : "→" }}
                    </span>

                    <span
                      class="font-medium break-words whitespace-normal"
                      :title="step.to"
                    >
                      {{ step.to || t("routeDetails.destination") }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div
            class="grid gap-2.5 sm:gap-4 mt-5 sm:mt-6"
            :class="isWalkOnly ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'"
          >
            <AppButton
              size="md"
              :class="[
                isWalkOnly ? 'col-span-1' : 'col-span-2 sm:col-span-1',
                'flex items-center justify-center gap-2',
              ]"
              @click="
                router.push({
                  path: '/live-navigation',
                  query: { start, destination, filter },
                  state: { route, steps, start, destination, filter },
                })
              "
            >
              <Navigation class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span class="truncate">{{
                t("routeDetails.startNavigation")
              }}</span>
            </AppButton>
            <AppButton
              variant="outline"
              size="md"
              :class="[
                isWalkOnly ? 'col-span-1' : 'col-span-1',
                'flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm',
              ]"
              @click="saveModalOpen = true"
            >
              <BookmarkPlus class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span class="truncate">{{ t("routeDetails.saveRoute") }}</span>
            </AppButton>
            <AppButton
              v-if="!isWalkOnly"
              variant="outline"
              size="md"
              class="col-span-1 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              :disabled="!isOnline"
              @click="router.push('/booking')"
            >
              <DollarSign class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span class="truncate">{{ t("routeDetails.bookPay") }}</span>
            </AppButton>
          </div>

          <p
            v-if="!isOnline || fromCache"
            class="mt-3 flex items-center gap-1.5 text-xs sm:text-sm text-warning"
          >
            <CloudOff class="h-4 w-4 flex-shrink-0" />
            {{ t("routeDetails.reconnectToBuy") }}
          </p>
        </div>

        <aside
          class="lg:sticky lg:top-8 h-fit space-y-4 md:space-y-6 order-last"
        >
          <div class="bg-card rounded-xl p-4 sm:p-6 border-2 border-border">
            <h3
              class="font-display text-lg sm:text-xl text-foreground mb-3 sm:mb-4 font-semibold"
            >
              {{ t("routeDetails.routeMap") }}
            </h3>
            <div
              class="h-56 sm:h-64 md:h-80 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <RoutePreviewMap :steps="steps" />
            </div>
          </div>
          <AppButton
            variant="outline"
            size="md"
            class="w-full flex items-center justify-center gap-2"
            @click="savePlaceModalOpen = true"
          >
            <BookmarkPlus class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            {{ t("routeDetails.saveDestination") }}
          </AppButton>
        </aside>
      </div>
    </div>

    <Modal
      :open="saveModalOpen"
      :title="t('routeDetails.saveRoute')"
      @close="saveModalOpen = false"
    >
      <div class="space-y-3.5">
        <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {{ t("routeDetails.saveRouteCopy") }}
        </p>
        <input
          v-model="routeName"
          class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus-ring"
          :placeholder="t('routeDetails.routeNamePlaceholder')"
        />
        <div class="flex gap-3 mt-1">
          <AppButton class="flex-1" size="md" @click="saveCurrentRoute">{{
            t("routeDetails.saveRoute")
          }}</AppButton>
          <AppButton
            variant="outline"
            class="flex-1"
            size="md"
            @click="saveModalOpen = false"
            >{{ t("home.cancel") }}</AppButton
          >
        </div>
      </div>
    </Modal>

    <Modal
      :open="savePlaceModalOpen"
      :title="t('routeDetails.saveDestination')"
      @close="closeSavePlace"
    >
      <div class="space-y-3.5">
        <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {{ t("saved.places.modalCopy") }}
        </p>
        <div
          class="flex items-center gap-2 rounded-lg bg-secondary p-2.5 text-xs sm:text-sm text-foreground min-w-0"
        >
          <MapPin class="w-4 h-4 flex-shrink-0 text-primary" />
          <span class="truncate">{{ displayDestination }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="type in placeTypes"
            :key="type.value"
            type="button"
            :class="placeTypeClass(type.value)"
            @click="newPlaceType = type.value"
          >
            {{ t(type.labelKey) }}
          </button>
        </div>
        <input
          v-model="newPlaceName"
          class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus-ring"
          :placeholder="t('saved.places.namePlaceholder')"
        />
        <div class="flex gap-3 mt-1">
          <AppButton class="flex-1" size="md" @click="saveCurrentDestination">{{
            t("saved.places.savePlace")
          }}</AppButton>
          <AppButton
            variant="outline"
            class="flex-1"
            size="md"
            @click="closeSavePlace"
            >{{ t("home.cancel") }}</AppButton
          >
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  BookmarkPlus,
  Clock,
  CloudOff,
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
import { useNetworkStatus } from "@/core/offline/networkStatus";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import RoutePreviewMap from "../components/RoutePreviewMap.vue";
import { useSavedTrips } from "@/composables/useSavedTrips";
import { useFavoritePlaces } from "@/composables/useFavoritePlaces";
import {
  makeSavedPlaceId,
  type SavedPlaceType,
} from "@/features/home/services/savedPlaces";
import type { ApiRouteOption, RouteDetailStep } from "@/services/api";
import {
  localizePlaceName,
  localizeRouteInstruction,
} from "@/services/placeLocalization";
import {
  getSavedRouteSearch,
  getSelectedRoute,
  normalizeFilter,
  saveRouteSearch,
} from "../services/routeSearch";

const router = useRouter();
const currentRoute = useRoute();
const { locale, t } = useI18n();
const state = history.state ?? {};
const queryString = (value: unknown) =>
  Array.isArray(value)
    ? value[0]
    : typeof value === "string"
      ? value
      : undefined;
const { isOnline } = useNetworkStatus();
const savedSearch = getSavedRouteSearch();
const selectedRoute = getSelectedRoute();
// True when the selected route was served from the offline cache (preview only).
const fromCache = Boolean(selectedRoute.fromCache);
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
const start =
  queryString(currentRoute.query.start) ??
  state.start ??
  selectedRoute.start ??
  savedSearch.start ??
  "Unknown start";
const destination =
  queryString(currentRoute.query.destination) ??
  state.destination ??
  selectedRoute.destination ??
  savedSearch.destination ??
  "Unknown destination";
const displayStart = computed(() => localizePlaceName(start, locale.value));
const displayDestination = computed(() =>
  localizePlaceName(destination, locale.value),
);
// A walk-only itinerary has no ticketable transit leg, so there is nothing to
// book or pay for — hide the Book & Pay action in that case.
const isWalkOnly = computed(
  () =>
    Array.isArray(route.legs) &&
    route.legs.length > 0 &&
    route.legs.every((leg: { mode: string }) => leg.mode === "WALK"),
);
const filter = normalizeFilter(
  queryString(currentRoute.query.filter) ??
    state.filter ??
    selectedRoute.filter ??
    savedSearch.filter,
);
const steps = (state.steps ??
  route.detailSteps ??
  selectedRoute.steps) as RouteDetailStep[];
const saveModalOpen = ref(false);
const savePlaceModalOpen = ref(false);
const routeName = ref("");
const newPlaceName = ref("");
const newPlaceType = ref<SavedPlaceType>("other");
const { saveTrip } = useSavedTrips();
const { saveFavoritePlace } = useFavoritePlaces();

const placeTypes = [
  { value: "home" as const, labelKey: "home.placeTypes.home" },
  { value: "work" as const, labelKey: "home.placeTypes.work" },
  { value: "school" as const, labelKey: "home.placeTypes.school" },
  { value: "other" as const, labelKey: "home.placeTypes.other" },
];

function placeTypeClass(value: SavedPlaceType) {
  return [
    "flex min-h-[36px] sm:min-h-10 items-center justify-center rounded-lg border-2 px-2.5 py-1.5 text-xs sm:text-sm transition-all cursor-pointer",
    newPlaceType.value === value
      ? "border-primary bg-secondary text-primary font-medium"
      : "border-border text-foreground hover:border-primary hover:bg-muted",
  ];
}

async function saveCurrentRoute() {
  const name = routeName.value.trim() || `${start} -> ${destination}`;
  await saveTrip({
    id: `${start}-${destination}-${filter}`.toLowerCase().replace(/\s+/g, "-"),
    name,
    start,
    destination,
    filter,
    duration: String(route.duration),
    cost: String(route.cost),
    createdAt: Date.now(),
  });
  routeName.value = "";
  saveModalOpen.value = false;
}

function closeSavePlace() {
  savePlaceModalOpen.value = false;
  newPlaceName.value = "";
  newPlaceType.value = "other";
}

// Persist the route's destination as a saved place (shows in Saved > Places
// and the Home planner, via the same offline-first IndexedDB store).
async function saveCurrentDestination() {
  const address = destination.trim();
  if (!address) return;
  const name = newPlaceName.value.trim() || address;
  await saveFavoritePlace({
    id: makeSavedPlaceId(name, address),
    name,
    address,
    type: newPlaceType.value,
    createdAt: Date.now(),
  });
  closeSavePlace();
}

saveRouteSearch({ start, destination, filter });

const routeExplanation = computed(() => {
  const instructions = displaySteps.value
    .map((step: { instruction?: string }) => step.instruction)
    .filter(Boolean);

  if (!instructions.length) {
    return t("routeDetails.explanationBasic", {
      start: displayStart.value,
      destination: displayDestination.value,
    });
  }

  return t("routeDetails.explanationWithSteps", {
    start: displayStart.value,
    destination: displayDestination.value,
    steps: instructions.join(locale.value === "ar" ? "، " : ", "),
  });
});

const displaySteps = computed(() =>
  steps.map((step) => ({
    ...step,
    instruction: localizeRouteInstruction(step.instruction, locale.value),
    duration: formatUnit(step.duration),
    distance: step.distance ? formatUnit(step.distance) : undefined,
    from: step.from ? localizePlaceName(step.from, locale.value) : undefined,
    to: step.to ? localizePlaceName(step.to, locale.value) : undefined,
  })),
);

function formatUnit(value: unknown) {
  const text = String(value);
  if (locale.value !== "ar") return text;
  return text
    .replace(/(\d+(?:\.\d+)?)\s*min\b/gi, "$1 دقيقة")
    .replace(/(\d+(?:\.\d+)?)\s*km\b/gi, "$1 كم")
    .replace(/(\d+(?:\.\d+)?)\s*m\b/gi, "$1 م")
    .replace(/(\d+(?:\.\d+)?)\s*EGP\b/gi, "$1 جنيه");
}

function backToResults() {
  router.push({
    path: "/route-results",
    query: { start, destination, filter },
    state: { start, destination, filter },
  });
}

const Summary = defineComponent({
  props: {
    icon: { type: [Object, Function], required: true },
    label: String,
    value: String,
  },
  setup(props) {
    return () =>
      h(
        "div",
        {
          class:
            "bg-card rounded-xl p-3 sm:p-4 border-2 border-border min-w-0 flex flex-col justify-between",
        },
        [
          h("div", [
            h(props.icon as any, {
              class: "w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mb-1.5",
            }),
            h(
              "div",
              {
                class:
                  "text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate",
                title: props.label,
              },
              props.label,
            ),
          ]),
          h(
            "div",
            {
              class:
                "font-display text-base sm:text-lg md:text-xl text-foreground mt-1 truncate",
              title: props.value,
            },
            props.value,
          ),
        ],
      );
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
