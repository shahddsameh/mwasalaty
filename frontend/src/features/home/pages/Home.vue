<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <section class="mb-8">
        <h1 class="font-display text-2xl md:text-3xl text-foreground mb-2">
          {{ t("home.title") }}
        </h1>
        <p class="text-sm md:text-base text-muted-foreground">
          {{ t("home.subtitle") }}
        </p>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <TripSearch />
        </div>

        <div class="space-y-6">
          <Panel :title="t('home.savedPlaces')" :icon="Star">
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary hover:bg-secondary transition-all"
                @click="openSavePlace('destination')"
              >
                {{ t("home.saveDestination") }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary transition-all"
                :aria-label="t('home.saveStartingPoint')"
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
                :placeholder="t('home.placeName')"
              />
              <PlaceAutocomplete
                v-model="newPlaceAddress"
                :placeholder="t('home.addressOrLocation')"
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
                  {{ t(type.labelKey) }}
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
                  {{ t("home.save") }}
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  @click="closeSavePlace"
                >
                  {{ t("home.cancel") }}
                </button>
              </div>
            </div>
            <div
              v-for="place in savedPlaces"
              :key="place.id"
              class="flex items-center gap-1 rounded-lg border border-border pe-1 hover:border-primary hover:bg-secondary transition-all"
            >
              <button
                class="flex min-w-0 flex-1 items-center gap-2.5 p-3 text-start"
                @click="store.destination = place.address"
              >
                <div
                  class="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: place.softColor }"
                >
                  <component
                    :is="savedPlaceIcon(place.iconKey)"
                    class="w-4 h-4"
                    :style="{ color: place.color }"
                  />
                </div>
                <div class="min-w-0">
                  <div class="text-foreground font-medium text-sm truncate">
                    {{ savedPlaceLabel(place) }}
                  </div>
                  <div class="text-xs text-muted-foreground truncate">
                    {{ place.address }}
                  </div>
                </div>
              </button>
              <button
                type="button"
                class="shrink-0 rounded-md p-2 text-muted-foreground hover:text-destructive transition-colors"
                :aria-label="t('home.removePlace')"
                @click="removeSavedPlace(place.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </Panel>

          <Panel :title="t('home.popularDestinations')">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              <button
                v-for="dest in popularDestinations"
                :key="dest.name"
                class="p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary transition-all"
                @click="store.destination = dest.name"
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
                  {{ t(dest.nameKey) }}
                </div>
                <div class="text-xs text-muted-foreground">{{ t(dest.areaKey) }}</div>
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  Briefcase,
  Building2,
  CastleIcon,
  Home as HomeIcon,
  Landmark,
  MapPin,
  Plane,
  Plus,
  ShoppingBag,
  Star,
  Train,
  Trash2,
  Triangle,
} from "@lucide/vue";
import TripSearch from "@/features/trip-planner/components/TripSearch.vue";
import PlaceAutocomplete from "@/features/home/components/PlaceAutocomplete.vue";
import { placeSuggestions } from "@/features/home/services/placeSuggestions";
import { useTripSearchStore } from "@/stores/tripSearch";
import {
  describeSavedPlace,
  makeSavedPlaceId,
  normalizeSavedPlaceType,
  type SavedPlace,
  type SavedPlaceIconKey,
  type SavedPlaceType,
} from "@/features/home/services/savedPlaces";
import { useFavoritePlaces } from "@/composables/useFavoritePlaces";

const { t } = useI18n();
const store = useTripSearchStore();
const { favoritePlaces, saveFavoritePlace, removeFavoritePlace } =
  useFavoritePlaces();

function removeSavedPlace(placeId: string) {
  void removeFavoritePlace(placeId);
}

const savingPlace = ref(false);
const newPlaceName = ref("");
const newPlaceAddress = ref("");
const newPlaceType = ref<SavedPlaceType>("other");
const savePlaceError = ref("");

// Dynamic, offline-first saved places from IndexedDB (reactive via liveQuery).
const savedPlaces = computed<SavedPlace[]>(() =>
  favoritePlaces.value.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    type: normalizeSavedPlaceType(place.type ?? "other"),
    ...describeSavedPlace(place.name, place.address, place.type ?? "other"),
  })),
);

const placeTypes = [
  { value: "home" as const, labelKey: "home.placeTypes.home" },
  { value: "work" as const, labelKey: "home.placeTypes.work" },
  { value: "school" as const, labelKey: "home.placeTypes.school" },
  { value: "other" as const, labelKey: "home.placeTypes.other" },
];

const popularDestinations = [
  {
    name: "Cairo Airport",
    nameKey: "home.popular.cairoAirport.name",
    areaKey: "home.popular.cairoAirport.area",
    icon: Plane,
    color: "var(--transport-walking)",
    softColor: "var(--transport-walking-soft)",
  },
  {
    name: "Egyptian Museum",
    nameKey: "home.popular.egyptianMuseum.name",
    areaKey: "home.popular.egyptianMuseum.area",
    icon: Landmark,
    color: "var(--transport-microbus)",
    softColor: "var(--transport-microbus-soft)",
  },
  {
    name: "City Stars Mall",
    nameKey: "home.popular.cityStars.name",
    areaKey: "home.popular.cityStars.area",
    icon: ShoppingBag,
    color: "var(--primary)",
    softColor: "var(--primary-soft)",
  },
  {
    name: "Cairo Tower",
    nameKey: "home.popular.cairoTower.name",
    areaKey: "home.popular.cairoTower.area",
    icon: Building2,
    color: "var(--success)",
    softColor: "var(--success-soft)",
  },
  {
    name: "Khan el-Khalili",
    nameKey: "home.popular.khanElKhalili.name",
    areaKey: "home.popular.khanElKhalili.area",
    icon: CastleIcon,
    color: "var(--foreground)",
    softColor: "var(--muted)",
  },
  {
    name: "Giza Pyramids",
    nameKey: "home.popular.gizaPyramids.name",
    areaKey: "home.popular.gizaPyramids.area",
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

function savedPlaceLabel(place: SavedPlace) {
  const normalized = place.name.trim().toLowerCase();
  if (normalized === "home") return t("home.placeTypes.home");
  if (normalized === "work") return t("home.placeTypes.work");
  if (normalized === "school") return t("home.placeTypes.school");
  if (normalized === "gym" || place.type === "other") return t("home.placeTypes.gym");
  return place.name;
}

function openSavePlace(source: "start" | "destination") {
  newPlaceAddress.value =
    source === "start" ? store.start.trim() : store.destination.trim();
  newPlaceName.value = "";
  newPlaceType.value = "other";
  savePlaceError.value = "";
  savingPlace.value = true;
}

function closeSavePlace() {
  savingPlace.value = false;
  savePlaceError.value = "";
}

async function addSavedPlace() {
  const address = newPlaceAddress.value.trim();
  const name = newPlaceName.value.trim() || address;

  if (!address) {
    savePlaceError.value = t("home.validation.placeAddressRequired");
    return;
  }

  await saveFavoritePlace({
    id: makeSavedPlaceId(name, address),
    name,
    address,
    type: newPlaceType.value,
    createdAt: Date.now(),
  });
  closeSavePlace();
}
</script>
