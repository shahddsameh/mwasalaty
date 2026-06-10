<template>
  <section
    class="bg-card rounded-xl p-4 md:p-6 lg:p-8 border-2 border-border shadow-sm"
  >
    <!-- From / swap / To -->
    <div class="relative space-y-3">
      <div>
        <PlaceSearchInput
          v-model="store.start"
          :placeholder="t('home.startingPoint')"
          :error="startError"
          @select="onSelectFrom"
        >
          <template #icon><MapPin class="w-5 h-5" /></template>
        </PlaceSearchInput>
        <button
          type="button"
          class="mt-2 text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5 disabled:opacity-60"
          :disabled="locating"
          @click="useCurrentLocation"
        >
          <MapPinned class="w-4 h-4" />
          {{ locating ? t("home.gettingLocation") : t("home.useCurrentLocation") }}
        </button>
      </div>

      <PlaceSearchInput
        v-model="store.destination"
        :placeholder="t('home.whereTo')"
        :error="destinationError"
        @select="onSelectTo"
      >
        <template #icon><Target class="w-5 h-5" /></template>
      </PlaceSearchInput>

      <button
        type="button"
        class="absolute top-[1.35rem] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-sm transition-all hover:border-primary hover:text-primary"
        style="inset-inline-end: 0.6rem"
        :title="t('tripSearch.swap')"
        :aria-label="t('tripSearch.swap')"
        @click="swap"
      >
        <ArrowUpDown class="h-4 w-4" />
      </button>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-3 gap-2 md:gap-3 mt-6 mb-6">
      <button
        v-for="option in filters"
        :key="option.value"
        type="button"
        :class="filterClass(option.value)"
        @click="store.filter = option.value"
      >
        <component :is="option.icon" class="w-4 h-4 md:w-5 md:h-5 mx-auto mb-1" />
        <div class="text-xs md:text-sm font-medium">{{ t(option.labelKey) }}</div>
      </button>
    </div>

    <!-- When -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-2 text-sm text-foreground">
        <Clock class="w-4 h-4 text-primary" /> {{ t("tripSearch.when") }}
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="mode in timeModes"
          :key="mode.value"
          type="button"
          :class="timeModeClass(mode.value)"
          @click="setTimeMode(mode.value)"
        >
          {{ t(mode.labelKey) }}
        </button>
      </div>
      <div v-if="store.timeMode !== 'now'" class="grid grid-cols-2 gap-3 mt-3">
        <label class="block">
          <span class="block text-xs text-muted-foreground mb-1">{{
            t("tripSearch.date")
          }}</span>
          <input
            v-model="store.date"
            type="date"
            :min="todayDate"
            class="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </label>
        <label class="block">
          <span class="block text-xs text-muted-foreground mb-1">{{
            t("tripSearch.time")
          }}</span>
          <input
            v-model="store.time"
            type="time"
            class="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      <AppButton size="lg" class="w-full" @click="searchRoutes">
        {{ t("home.searchRoutes") }}
      </AppButton>
      <AppButton
        variant="outline"
        size="lg"
        class="w-full flex items-center justify-center gap-2"
        @click="router.push('/ai-assistant')"
      >
        <Sparkles class="w-5 h-5" /> {{ t("home.askAi") }}
      </AppButton>
    </div>

    <!-- Recent searches -->
    <div v-if="recentSearches.length" class="mt-6 pt-6 border-t border-border">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-foreground flex items-center gap-2">
          <History class="w-4 h-4 text-primary" /> {{ t("home.recentSearches") }}
        </span>
        <button
          type="button"
          class="text-xs text-muted-foreground hover:text-destructive transition-colors"
          @click="clearRecentSearches()"
        >
          {{ t("tripSearch.clear") }}
        </button>
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="recent in recentSearches"
          :key="recent.id ?? `${recent.from}-${recent.to}-${recent.searchedAt}`"
          class="flex items-center gap-1 rounded-lg border border-border pe-1 hover:border-primary hover:bg-secondary transition-all"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 p-2.5 text-start"
            @click="applyRecent(recent)"
          >
            <History class="w-4 h-4 shrink-0 text-muted-foreground" />
            <span class="min-w-0 truncate text-sm text-foreground">
              {{ recent.from }} → {{ recent.to }}
            </span>
          </button>
          <button
            type="button"
            class="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            :aria-label="t('tripSearch.removeRecent')"
            @click="removeRecent(recent)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  ArrowUpDown,
  Clock,
  DollarSign,
  History,
  MapPin,
  MapPinned,
  Sparkles,
  Star,
  Target,
  X,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import PlaceSearchInput from "./PlaceSearchInput.vue";
import type { PlaceResult } from "@/services/api";
import { useTripSearchStore, type TripTimeMode } from "@/stores/tripSearch";
import { useRecentSearches } from "@/composables/useRecentSearches";
import {
  normalizeFilter,
  saveRouteSearch,
  setPlaceCoords,
} from "@/features/trip-planner/services/routeSearch";

const router = useRouter();
const { t } = useI18n();
const store = useTripSearchStore();
const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
  useRecentSearches();

function removeRecent(recent: { id?: number }) {
  if (typeof recent.id === "number") void removeRecentSearch(recent.id);
}

const startError = ref("");
const destinationError = ref("");
const locating = ref(false);

const todayDate = new Date().toISOString().slice(0, 10);

const filters = [
  { value: "fastest" as const, labelKey: "home.filters.fastest", icon: Clock },
  { value: "cheapest" as const, labelKey: "home.filters.cheapest", icon: DollarSign },
  { value: "comfortable" as const, labelKey: "home.filters.comfortable", icon: Star },
];

const timeModes = [
  { value: "now" as const, labelKey: "tripSearch.leaveNow" },
  { value: "depart" as const, labelKey: "tripSearch.departAt" },
  { value: "arrive" as const, labelKey: "tripSearch.arriveBy" },
];

function filterClass(value: string) {
  return [
    "py-2.5 md:py-3 rounded-lg border-2 transition-all",
    store.filter === value
      ? "border-primary bg-secondary text-primary"
      : "border-border text-muted-foreground hover:border-primary",
  ];
}

function timeModeClass(value: string) {
  return [
    "py-2 rounded-lg border-2 text-sm transition-all",
    store.timeMode === value
      ? "border-primary bg-secondary text-primary"
      : "border-border text-muted-foreground hover:border-primary",
  ];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function setTimeMode(mode: TripTimeMode) {
  store.timeMode = mode;
  if (mode !== "now" && (!store.date || !store.time)) {
    const now = new Date();
    store.date = now.toISOString().slice(0, 10);
    store.time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}

function onSelectFrom(place: PlaceResult) {
  store.fromCoords = { lat: place.lat, lng: place.lng };
  startError.value = "";
}

function onSelectTo(place: PlaceResult) {
  store.toCoords = { lat: place.lat, lng: place.lng };
  destinationError.value = "";
}

function swap() {
  const start = store.start;
  const fromCoords = store.fromCoords;
  store.start = store.destination;
  store.destination = start;
  store.fromCoords = store.toCoords;
  store.toCoords = fromCoords;
}

function useCurrentLocation() {
  if (!("geolocation" in navigator)) {
    startError.value = t("home.validation.locationUnavailable");
    return;
  }
  locating.value = true;
  startError.value = "";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const label = t("home.currentLocation");
      setPlaceCoords(label, { lat: latitude, lng: longitude });
      store.start = label;
      store.fromCoords = { lat: latitude, lng: longitude };
      locating.value = false;
    },
    (error) => {
      locating.value = false;
      startError.value =
        error.code === error.PERMISSION_DENIED
          ? t("home.validation.permissionDenied")
          : t("home.validation.locationFailed");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function applyRecent(recent: { from: string; to: string; filter: string }) {
  store.start = recent.from;
  store.destination = recent.to;
  store.filter = normalizeFilter(recent.filter);
  // Coordinates aren't stored with recents; let the backend resolve by label.
  store.fromCoords = null;
  store.toCoords = null;
  startError.value = "";
  destinationError.value = "";
}

function searchRoutes() {
  const start = store.start.trim();
  const destination = store.destination.trim();

  startError.value = start ? "" : t("home.validation.startRequired");
  destinationError.value = destination
    ? ""
    : t("home.validation.destinationRequired");
  if (!start || !destination) return;

  if (store.fromCoords) setPlaceCoords(start, store.fromCoords);
  if (store.toCoords) setPlaceCoords(destination, store.toCoords);

  saveRouteSearch({ start, destination, filter: store.filter });
  addRecentSearch({
    from: start,
    to: destination,
    filter: store.filter,
    searchedAt: Date.now(),
  });

  const scheduled = store.timeMode !== "now";
  router.push({
    path: "/route-results",
    query: {
      start,
      destination,
      filter: store.filter,
      timeMode: store.timeMode,
      ...(scheduled ? { date: store.date, time: store.time } : {}),
    },
    state: {
      start,
      destination,
      filter: store.filter,
      timeMode: store.timeMode,
      date: scheduled ? store.date : "",
      time: scheduled ? store.time : "",
    },
  });
}
</script>
