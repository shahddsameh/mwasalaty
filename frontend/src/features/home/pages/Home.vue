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
                  class="mt-2 text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5"
                  @click="start = 'Current Location'"
                >
                  <MapPinned class="w-4 h-4" /> Use current location
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
            <button
              v-for="search in recentSearches"
              :key="`${search.from}-${search.to}-${search.searchedAt}`"
              class="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary transition-all text-left"
              @click="useSearch(search)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-foreground text-sm">
                    {{ search.from }} -> {{ search.to }}
                  </div>
                  <div class="text-xs text-muted-foreground mt-0.5">
                    {{ formatRecentTime(search.searchedAt) }}
                  </div>
                </div>
                <TrendingUp class="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </Panel>
        </div>

        <div class="space-y-6">
          <Panel title="Saved Places" :icon="Star">
            <button
              v-for="place in savedPlaces"
              :key="place.name"
              class="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary transition-all text-left"
              @click="destination = place.address"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: place.softColor }"
                >
                  <component
                    :is="place.icon"
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
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Triangle,
  TrendingUp,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import PlaceAutocomplete from "@/features/home/components/PlaceAutocomplete.vue";
import { placeSuggestions } from "@/features/home/services/placeSuggestions";
import {
  getRecentRouteSearches,
  saveRecentRouteSearch,
  saveRouteSearch,
  type RecentRouteSearch,
} from "@/features/trip-planner/services/routeSearch";

const router = useRouter();
const start = ref("");
const destination = ref("");
const startError = ref("");
const destinationError = ref("");
const filter = ref<"fastest" | "cheapest" | "comfortable">("fastest");

const filters = [
  { value: "fastest" as const, label: "Fastest", icon: Clock },
  { value: "cheapest" as const, label: "Cheapest", icon: DollarSign },
  { value: "comfortable" as const, label: "Comfortable", icon: Star },
];

const recentSearches = ref<RecentRouteSearch[]>(getRecentRouteSearches());

const savedPlaces = [
  {
    name: "Home",
    address: "Nasr City, Cairo",
    icon: HomeIcon,
    color: "var(--place-home)",
    softColor: "var(--place-home-soft)",
  },
  {
    name: "Work",
    address: "Downtown Cairo",
    icon: Briefcase,
    color: "var(--place-work)",
    softColor: "var(--place-work-soft)",
  },
  {
    name: "Gym",
    address: "Maadi, Cairo",
    icon: Dumbbell,
    color: "var(--place-gym)",
    softColor: "var(--place-gym-soft)",
  },
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

function useSearch(search: RecentRouteSearch) {
  start.value = search.from;
  destination.value = search.to;
  filter.value = search.filter;
  startError.value = "";
  destinationError.value = "";
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
