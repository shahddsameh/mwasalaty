<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <section class="mb-8">
        <h1 class="font-display text-2xl md:text-3xl text-foreground mb-2">
          Where are you going?
        </h1>
        <p class="text-sm md:text-base text-muted-foreground">
          Plan your journey across Greater Cairo with multiple transport options
        </p>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div
            class="bg-card rounded-xl p-4 md:p-6 lg:p-8 border-2 border-border shadow-sm"
          >
            <div class="space-y-5 mb-6">
              <div>
                <PlaceAutocomplete
                  v-model="start"
                  placeholder="Starting point"
                  :error="startError"
                  :suggestions="placeSuggestions"
                >
                  <template #icon><MapPin class="w-5 h-5" /></template>
                </PlaceAutocomplete>
                <button
                  class="mt-2 text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  :disabled="locating"
                  @click="useCurrentLocation"
                >
                  <MapPinned class="w-4 h-4" />
                  {{ locating ? "Getting your location…" : "Use current location" }}
                </button>
              </div>

              <PlaceAutocomplete
                v-model="destination"
                placeholder="Where to?"
                :error="destinationError"
                :suggestions="placeSuggestions"
              >
                <template #icon><Target class="w-5 h-5" /></template>
              </PlaceAutocomplete>
            </div>

            <div class="grid grid-cols-3 gap-2 md:gap-3 mb-6">
              <button
                v-for="option in filters"
                :key="option.value"
                :class="filterClass(option.value)"
                @click="filter = option.value"
              >
                <component
                  :is="option.icon"
                  class="w-4 h-4 md:w-5 md:h-5 mx-auto mb-1"
                />
                <div class="text-xs md:text-sm font-medium">
                  {{ option.label }}
                </div>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <AppButton size="lg" class="w-full" @click="searchRoutes">
                Search Routes
              </AppButton>
              <AppButton
                variant="outline"
                size="lg"
                class="w-full flex items-center justify-center gap-2"
                @click="router.push('/ai-assistant')"
              >
                <Sparkles class="w-5 h-5" /> Ask AI
              </AppButton>
            </div>
          </div>

          <Panel title="Recent Searches" :icon="Clock">
            <p
              v-if="recentSearches.length === 0"
              class="text-sm text-muted-foreground"
            >
              Your recent routes will appear here.
            </p>
            <div
              v-for="search in recentSearches"
              :key="`${search.from}-${search.to}-${search.searchedAt}`"
              class="flex items-center rounded-lg border border-border hover:border-primary hover:bg-secondary transition-all"
            >
              <button
                type="button"
                class="min-w-0 flex-1 p-3 text-left"
                @click="useSearch(search)"
              >
                <div class="text-foreground text-sm truncate">
                  {{ search.from }} -> {{ search.to }}
                </div>
                <div class="text-xs text-muted-foreground mt-0.5">
                  {{ formatRecentTime(search.searchedAt) }}
                </div>
              </button>
              <button
                type="button"
                class="mr-2 shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete recent search"
                @click="deleteSearch(search)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </Panel>
        </div>

        <div class="space-y-6">
          <Panel title="Saved Places" :icon="Star">
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary hover:bg-secondary transition-all"
                @click="openSavePlace('destination')"
              >
                Save destination
              </button>
              <button
                type="button"
                class="rounded-lg border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary transition-all"
                aria-label="Save starting point"
                @click="openSavePlace('start')"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <div
              v-if="savingPlace"
              class="rounded-lg border border-border bg-muted p-3 space-y-3"
            >
              <input
                v-model="newPlaceName"
                class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Place name"
              />
              <PlaceAutocomplete
                v-model="newPlaceAddress"
                placeholder="Address or location"
                :suggestions="placeSuggestions"
              />
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="type in placeTypes"
                  :key="type.value"
                  type="button"
                  :class="placeTypeClass(type.value)"
                  @click="newPlaceType = type.value"
                >
                  {{ type.label }}
                </button>
              </div>
              <p v-if="savePlaceError" class="text-sm text-destructive">
                {{ savePlaceError }}
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary-hover transition-colors"
                  @click="addSavedPlace"
                >
                  Save
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  @click="closeSavePlace"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button
              v-for="place in savedPlaces"
              :key="place.id"
              class="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary transition-all text-left"
              @click="destination = place.address"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: place.softColor }"
                >
                  <component
                    :is="savedPlaceIcon(place.iconKey)"
                    class="w-4 h-4"
                    :style="{ color: place.color }"
                  />
                </div>
                <div>
                  <div class="text-foreground font-medium text-sm">
                    {{ place.name }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ place.address }}
                  </div>
                </div>
              </div>
            </button>
          </Panel>

          <Panel title="Popular Destinations">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              <button
                v-for="dest in popularDestinations"
                :key="dest.name"
                class="p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary transition-all"
                @click="destination = dest.name"
              >
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto"
                  :style="{ backgroundColor: dest.softColor }"
                >
                  <component
                    :is="dest.icon"
                    class="w-5 h-5"
                    :style="{ color: dest.color }"
                  />
                </div>
                <div class="text-xs text-foreground font-medium leading-tight">
                  {{ dest.name }}
                </div>
                <div class="text-xs text-muted-foreground">{{ dest.area }}</div>
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Briefcase,
  Building2,
  CastleIcon,
  Clock,
  DollarSign,
  Dumbbell,
  Home as HomeIcon,
  Landmark,
  MapPin,
  MapPinned,
  Plane,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trash2,
  Train,
  Triangle,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import PlaceAutocomplete from "@/features/home/components/PlaceAutocomplete.vue";
import { placeSuggestions } from "@/features/home/services/placeSuggestions";
import {
  getSavedPlaces,
  savePlace,
  type SavedPlaceIconKey,
  type SavedPlaceType,
} from "@/features/home/services/savedPlaces";
import {
  deleteRecentRouteSearch,
  getRecentRouteSearches,
  saveRecentRouteSearch,
  saveRouteSearch,
  setPlaceCoords,
  type RecentRouteSearch,
} from "@/features/trip-planner/services/routeSearch";

const router = useRouter();
const start = ref("");
const destination = ref("");
const startError = ref("");
const destinationError = ref("");
const locating = ref(false);
const filter = ref<"fastest" | "cheapest" | "comfortable">("fastest");
const savingPlace = ref(false);
const newPlaceName = ref("");
const newPlaceAddress = ref("");
const newPlaceType = ref<SavedPlaceType>("other");
const savePlaceError = ref("");

function useCurrentLocation() {
  if (!("geolocation" in navigator)) {
    startError.value = "Location isn't available on this device.";
    return;
  }
  locating.value = true;
  startError.value = "";
  // The browser shows its own permission prompt here.
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setPlaceCoords("Current Location", { lat: latitude, lng: longitude });
      start.value = "Current Location";
      locating.value = false;
    },
    (error) => {
      locating.value = false;
      startError.value =
        error.code === error.PERMISSION_DENIED
          ? "Location permission denied. Enter a starting point instead."
          : "Couldn't get your location. Enter a starting point instead.";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

const filters = [
  { value: "fastest" as const, label: "Fastest", icon: Clock },
  { value: "cheapest" as const, label: "Cheapest", icon: DollarSign },
  { value: "comfortable" as const, label: "Comfortable", icon: Star },
];

const recentSearches = ref<RecentRouteSearch[]>(getRecentRouteSearches());
const savedPlaces = ref(getSavedPlaces());

const placeTypes = [
  { value: "home" as const, label: "Home" },
  { value: "work" as const, label: "Work" },
  { value: "school" as const, label: "School" },
  { value: "other" as const, label: "Other" },
];

const popularDestinations = [
  {
    name: "Cairo Airport",
    area: "Heliopolis",
    icon: Plane,
    color: "var(--transport-walking)",
    softColor: "var(--transport-walking-soft)",
  },
  {
    name: "Egyptian Museum",
    area: "Downtown",
    icon: Landmark,
    color: "var(--transport-microbus)",
    softColor: "var(--transport-microbus-soft)",
  },
  {
    name: "City Stars Mall",
    area: "Nasr City",
    icon: ShoppingBag,
    color: "var(--primary)",
    softColor: "var(--primary-soft)",
  },
  {
    name: "Cairo Tower",
    area: "Zamalek",
    icon: Building2,
    color: "var(--success)",
    softColor: "var(--success-soft)",
  },
  {
    name: "Khan el-Khalili",
    area: "Islamic Cairo",
    icon: CastleIcon,
    color: "var(--foreground)",
    softColor: "var(--muted)",
  },
  {
    name: "Giza Pyramids",
    area: "Giza",
    icon: Triangle,
    color: "var(--transport-microbus)",
    softColor: "var(--transport-microbus-soft)",
  },
];

const Panel = defineComponent({
  props: {
    title: { type: String, required: true },
    icon: { type: [Object, Function], default: null },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "section",
        { class: "bg-card rounded-xl p-4 md:p-6 border-2 border-border" },
        [
          h(
            "h3",
            {
              class:
                "font-display text-lg text-foreground mb-4 flex items-center gap-2",
            },
            [
              props.icon
                ? h(props.icon as any, { class: "w-5 h-5 text-primary" })
                : null,
              props.title,
            ],
          ),
          h("div", { class: "space-y-3" }, slots.default?.()),
        ],
      );
  },
});

function filterClass(value: string) {
  return [
    "py-2.5 md:py-3 rounded-lg border-2 transition-all",
    filter.value === value
      ? "border-primary bg-secondary text-primary"
      : "border-border text-muted-foreground hover:border-primary",
  ];
}

function placeTypeClass(value: SavedPlaceType) {
  return [
    "flex min-h-9 items-center justify-center rounded-lg border px-1 py-2 text-center text-xs transition-all",
    newPlaceType.value === value
      ? "border-primary bg-secondary text-primary"
      : "border-border text-muted-foreground hover:border-primary",
  ];
}

function savedPlaceIcon(iconKey: SavedPlaceIconKey) {
  if (iconKey === "home") return HomeIcon;
  if (iconKey === "work") return Briefcase;
  if (iconKey === "school") return Building2;
  if (iconKey === "airport") return Plane;
  if (iconKey === "shopping") return ShoppingBag;
  if (iconKey === "landmark") return Landmark;
  if (iconKey === "transit") return Train;
  if (iconKey === "district") return Building2;
  return MapPin;
}

function openSavePlace(source: "start" | "destination") {
  newPlaceAddress.value =
    source === "start" ? start.value.trim() : destination.value.trim();
  newPlaceName.value = "";
  newPlaceType.value = "other";
  savePlaceError.value = "";
  savingPlace.value = true;
}

function closeSavePlace() {
  savingPlace.value = false;
  savePlaceError.value = "";
}

function addSavedPlace() {
  const address = newPlaceAddress.value.trim();
  const name = newPlaceName.value.trim() || address;

  if (!address) {
    savePlaceError.value = "Enter a place address first.";
    return;
  }

  savedPlaces.value = savePlace({
    name,
    address,
    type: newPlaceType.value,
  });
  closeSavePlace();
}

function useSearch(search: RecentRouteSearch) {
  start.value = search.from;
  destination.value = search.to;
  filter.value = search.filter;
  startError.value = "";
  destinationError.value = "";
}

function deleteSearch(search: RecentRouteSearch) {
  deleteRecentRouteSearch(search);
  recentSearches.value = getRecentRouteSearches();
}

function formatRecentTime(searchedAt: number) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - searchedAt) / 60000));

  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min${elapsedMinutes === 1 ? "" : "s"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}

function searchRoutes() {
  const trimmedStart = start.value.trim();
  const trimmedDestination = destination.value.trim();

  startError.value = trimmedStart ? "" : "Please enter a starting point.";
  destinationError.value = trimmedDestination
    ? ""
    : "Please enter a destination.";

  if (!trimmedStart || !trimmedDestination) {
    alert("Please enter both the starting point and destination.");
    return;
  }

  saveRouteSearch({
    start: trimmedStart,
    destination: trimmedDestination,
    filter: filter.value,
  });
  saveRecentRouteSearch({
    start: trimmedStart,
    destination: trimmedDestination,
    filter: filter.value,
  });
  recentSearches.value = getRecentRouteSearches();
  router.push({
    path: "/route-results",
    query: {
      start: trimmedStart,
      destination: trimmedDestination,
      filter: filter.value,
    },
    state: {
      start: trimmedStart,
      destination: trimmedDestination,
      filter: filter.value,
    },
  });
}
</script>
