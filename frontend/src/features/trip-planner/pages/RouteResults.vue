<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
      <button
        class="flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
        @click="router.push('/')"
      >
        <ArrowLeft class="w-5 h-5 rtl:rotate-180" /> {{ t("routeResults.backToSearch") }}
      </button>

      <section class="mb-6">
        <h1 class="font-display text-2xl md:text-3xl text-foreground mb-2">
          {{ t("routeResults.title") }}
        </h1>
        <div
          class="flex items-center gap-2 text-sm md:text-base text-muted-foreground"
        >
          <MapPin class="w-4 h-4 flex-shrink-0" />
          <span class="truncate">{{ displayStart }} -> {{ displayDestination }}</span>
        </div>
      </section>

      <div class="lg:hidden grid grid-cols-2 gap-3 mb-4">
        <Stat :label="t('routeResults.distance')" value="~28 km" />
        <Stat :label="t('routeResults.routesFound')" :value="t('routeResults.optionsCount', { count: routes.length })" />
      </div>

      <div class="mb-6 -mx-4 md:mx-0 px-4 md:px-0">
        <div class="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="tabClass(tab.value)"
            @click="sortBy = tab.value"
          >
            {{ t(tab.labelKey) }}
          </button>
          <button
            class="px-3 py-2.5 rounded-lg bg-card border-2 border-border text-muted-foreground hover:border-primary transition-all flex-shrink-0"
          >
            <SlidersHorizontal class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div class="lg:col-span-2 space-y-4">
          <div
            v-if="loading"
            class="flex items-center justify-center gap-3 py-12 text-muted-foreground"
          >
            <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            {{ t("routeResults.planning") }}
          </div>
          <div
            v-else-if="errorMessage"
            class="bg-card border-2 border-border rounded-xl p-6 text-muted-foreground"
          >
            <h2 class="font-display text-xl text-foreground mb-2">
              {{ t("routeResults.noRoutesTitle") }}
            </h2>
            <p>{{ errorMessage }}</p>
            <p class="mt-2 text-sm">
              {{ t("routeResults.backendHelp") }}
            </p>
          </div>
          <div
            v-else-if="!routes.length"
            class="bg-card border-2 border-border rounded-xl p-6 text-muted-foreground"
          >
            {{ t("routeResults.noRoutesForSearch") }}
          </div>
          <template v-else>
            <RouteCard
              v-for="route in sortedRoutes"
              :key="route.id"
              :route="route"
              :is-fastest="route.id === fastestRouteId"
              :is-cheapest="route.id === cheapestRouteId"
              :is-comfortable="route.id === comfortableRouteId"
              @select="selectRoute(route)"
            />
          </template>
        </div>

        <aside class="hidden lg:block lg:sticky lg:top-8 h-fit">
          <div class="bg-card rounded-xl p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-4">
              {{ t("routeResults.mapOverview") }}
            </h3>
            <div
              class="aspect-square bg-gradient-to-br from-primary-soft to-warning-soft rounded-lg flex items-center justify-center border-2 border-border"
            >
              <div class="text-center">
                <MapPin class="w-16 h-16 text-primary mx-auto mb-2" />
                <p class="text-sm text-muted-foreground">{{ t("routeResults.interactiveMap") }}</p>
                <p class="text-xs text-muted-foreground">{{ t("routeResults.showingAllRoutes") }}</p>
              </div>
            </div>
            <div class="mt-6 space-y-3">
              <Stat :label="t('routeResults.distance')" value="~28 km" />
              <Stat :label="t('routeResults.routesFound')" :value="t('routeResults.optionsCount', { count: routes.length })" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, MapPin, SlidersHorizontal } from "@lucide/vue";
import RouteCard from "@/components/route/RouteCard.vue";
import { planRoute, type ApiRouteOption } from "@/services/api";
import { localizePlaceName } from "@/services/placeLocalization";
import {
  computeDepartureAt,
  getPlaceCoords,
  getSavedRouteSearch,
  normalizeFilter,
  saveRouteSearch,
  saveSelectedRoute,
} from "../services/routeSearch";

type TimeMode = "now" | "depart" | "arrive";

const router = useRouter();
const currentRoute = useRoute();
const { t } = useI18n();

const state = history.state ?? {};
const queryString = (value: unknown) =>
  Array.isArray(value)
    ? value[0]
    : typeof value === "string"
      ? value
      : undefined;
const savedSearch = getSavedRouteSearch();
const queryFilter = queryString(currentRoute.query.filter);
const start =
  queryString(currentRoute.query.start) ??
  state.start ??
  savedSearch.start ??
  "Tahrir Square";
const destination =
  queryString(currentRoute.query.destination) ??
  state.destination ??
  savedSearch.destination ??
  "Cairo Airport";
const displayStart = computed(() => localizePlaceName(start));
const displayDestination = computed(() => localizePlaceName(destination));

const timeMode = ((queryString(currentRoute.query.timeMode) ??
  state.timeMode ??
  "now") as TimeMode);
const tripDate = queryString(currentRoute.query.date) ?? state.date ?? "";
const tripTime = queryString(currentRoute.query.time) ?? state.time ?? "";
const departureAt = computeDepartureAt(timeMode, tripDate, tripTime);

const sortBy = ref<"fastest" | "cheapest" | "comfortable">(
  normalizeFilter(queryFilter ?? state.filter ?? savedSearch.filter),
);

const tabs = [
  { value: "fastest" as const, labelKey: "routeResults.fastest" },
  { value: "cheapest" as const, labelKey: "routeResults.cheapest" },
  { value: "comfortable" as const, labelKey: "routeResults.comfortable" },
];

const loading = ref(false);
const errorMessage = ref("");
const apiRoutes = ref<ApiRouteOption[]>([]);

onMounted(async () => {
  saveRouteSearch({ start, destination, filter: sortBy.value });
  loading.value = true;
  errorMessage.value = "";

  try {
    apiRoutes.value = await planRoute(
      start,
      destination,
      sortBy.value,
      {
        fromCoords: getPlaceCoords(start),
        toCoords: getPlaceCoords(destination),
      },
      { mode: timeMode, date: tripDate, time: tripTime },
    );
  } catch (error) {
    apiRoutes.value = [];
    errorMessage.value = routeErrorMessage(error);
  } finally {
    loading.value = false;
  }
});

const routes = computed<ApiRouteOption[]>(() => apiRoutes.value);

const getDuration = (duration: string | number) => parseInt(String(duration));

const getCost = (cost: string | number) => parseInt(String(cost));

const fastestRouteId = computed(() => {
  if (!routes.value.length) return null;

  return routes.value.reduce((min, route) =>
    getDuration(route.duration) < getDuration(min.duration) ? route : min,
  ).id;
});

const cheapestRouteId = computed(() => {
  if (!routes.value.length) return null;

  return routes.value.reduce((min, route) =>
    getCost(route.cost) < getCost(min.cost) ? route : min,
  ).id;
});

const comfortableRouteId = computed(() => {
  if (!routes.value.length) return null;

  return routes.value.reduce((min, route) =>
    route.transfers < min.transfers ? route : min,
  ).id;
});

const sortedRoutes = computed(() => {
  const routesCopy = [...routes.value];

  if (sortBy.value === "fastest") {
    return routesCopy.sort(
      (a, b) => parseInt(String(a.duration)) - parseInt(String(b.duration)),
    );
  }

  if (sortBy.value === "cheapest") {
    return routesCopy.sort(
      (a, b) => parseInt(String(a.cost)) - parseInt(String(b.cost)),
    );
  }

  if (sortBy.value === "comfortable") {
    return routesCopy.sort((a, b) => a.transfers - b.transfers);
  }

  return routesCopy;
});

const Stat = defineComponent({
  props: { label: String, value: String },
  setup(props) {
    return () =>
      h("div", { class: "p-3 bg-card rounded-lg border-2 border-border" }, [
        h("div", { class: "text-xs text-muted-foreground" }, props.label),
        h(
          "div",
          { class: "font-display text-base text-foreground" },
          props.value,
        ),
      ]);
  },
});

function tabClass(value: string) {
  return [
    "px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-all text-sm whitespace-nowrap flex-shrink-0",
    sortBy.value === value
      ? "bg-primary text-primary-foreground"
      : "bg-card border-2 border-border text-muted-foreground hover:border-primary",
  ];
}

function selectRoute(route: ApiRouteOption) {
  saveSelectedRoute({
    route,
    start,
    destination,
    filter: sortBy.value,
    steps: route.detailSteps,
    departureAt,
  });
  router.push({
    path: "/route-details",
    query: { start, destination, filter: sortBy.value },
    state: {
      route,
      start,
      destination,
      filter: sortBy.value,
      steps: route.detailSteps,
    },
  });
}

function routeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return t("routeResults.errors.planFailed");
  if (error.message === "place_not_found_from") {
    return t("routeResults.errors.placeNotFound", { place: start });
  }
  if (error.message === "place_not_found_to") {
    return t("routeResults.errors.placeNotFound", { place: destination });
  }
  return error.message || t("routeResults.errors.planFailed");
}
</script>
