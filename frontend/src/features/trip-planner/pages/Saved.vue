<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <PageTitle
        :title="t('saved.title')"
        :subtitle="t('saved.subtitle')"
      >
        <template #icon>
          <BookmarkCheck class="w-10 h-10 text-primary" />
        </template>
      </PageTitle>

      <div
        class="mb-6 md:mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="tabClass(tab.value)"
          @click="activeTab = tab.value"
        >
          <span>{{ t(tab.labelKey) }}</span>
          <span :class="tabCountClass(tab.value)">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <section v-if="activeTab === 'places'">
        <div class="flex flex-col gap-3 mb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 class="font-display text-xl md:text-2xl text-foreground">
              {{ t("saved.places.title") }}
            </h2>
            <p class="text-sm text-muted-foreground">
              {{ t("saved.places.subtitle") }}
            </p>
          </div>
          <AppButton
            class="w-full md:w-auto flex items-center justify-center gap-2"
            @click="addPlaceModalOpen = true"
          >
            <MapPin class="w-5 h-5" /> {{ t("saved.places.addNewPlace") }}
          </AppButton>
        </div>

        <div
          v-if="savedPlaces.length === 0"
          class="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center"
        >
          <MapPin class="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 class="font-display text-lg text-foreground mb-1">
            {{ t("saved.places.emptyTitle") }}
          </h3>
          <p class="text-sm text-muted-foreground mb-4">
            {{ t("saved.places.emptyCopy") }}
          </p>
          <AppButton @click="addPlaceModalOpen = true">{{ t("saved.places.addPlace") }}</AppButton>
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-3 md:gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(280px,360px))] md:justify-start"
        >
          <SavedCard
            v-for="place in savedPlaces"
            :key="place.id"
            :title="savedPlaceLabel(place)"
            :subtitle="place.address"
            :icon-key="place.iconKey"
            :color="place.color"
            :soft-color="place.softColor"
            removable
            :menu-open="activePlaceMenuId === place.id"
            @click="planRouteToPlace(place.address)"
            @toggle-menu="togglePlaceMenu(place.id)"
            @delete="removeSavedPlace(place.id)"
          />
        </div>
      </section>

      <section v-else-if="activeTab === 'routes'" class="space-y-4">
        <SectionHeader
          :title="t('saved.routes.title')"
          :subtitle="t('saved.routes.subtitle')"
        />
        <div
          v-if="savedRoutes.length === 0"
          class="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center"
        >
          <BookmarkCheck class="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 class="font-display text-lg text-foreground mb-1">
            {{ t("saved.routes.emptyTitle") }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ t("saved.routes.emptyCopy") }}
          </p>
        </div>
        <ListRow
          v-for="route in savedRoutes"
          v-else
          :key="route.id"
          :title="route.name"
          :subtitle="`${route.from} -> ${route.to}`"
          :meta="t('saved.routes.meta', { duration: route.duration, cost: route.cost, lastUsed: route.lastUsed })"
          :action="t('saved.routes.useRoute')"
          @action="useSavedRoute(route)"
        />
      </section>

      <section v-else-if="activeTab === 'history'" class="space-y-4">
        <SectionHeader
          :title="t('saved.history.title')"
          :subtitle="t('saved.history.subtitle')"
        />
        <div
          v-if="recentTrips.length === 0"
          class="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center"
        >
          <BookmarkCheck class="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 class="font-display text-lg text-foreground mb-1">
            {{ t("saved.history.emptyTitle") }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ t("saved.history.emptyCopy") }}
          </p>
        </div>
        <ListRow
          v-for="trip in recentTrips"
          v-else
          :key="trip.id"
          :title="`${trip.from} -> ${trip.to}`"
          :subtitle="trip.date"
          :meta="t('saved.history.completed')"
          :action="t('saved.history.repeatTrip')"
          @action="repeatTrip(trip)"
        />
      </section>

      <!-- <section
        v-else-if="activeTab === 'ai'"
        class="space-y-4"
      >
        <SectionHeader :title="t('saved.ai.title')" :subtitle="t('saved.ai.subtitle')" />
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SavedCard
            v-for="plan in aiPlans"
            :key="plan.name"
            :title="plan.name"
            :subtitle="t('saved.ai.created', { date: plan.created })"
            :meta="t('saved.ai.meta', { budget: plan.budget, count: plan.destinations })"
            :action-label="t('saved.ai.openPlan')"
            @click="router.push('/ai-plan')"
          />
        </div>
      </section> -->

      <section v-else class="space-y-4">
        <SectionHeader
          :title="t('saved.offline.title')"
          :subtitle="t('saved.offline.subtitle')"
        />
        <div
          v-if="offlineRoutes.length === 0"
          class="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center"
        >
          <BookmarkCheck class="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 class="font-display text-lg text-foreground mb-1">
            {{ t("saved.offline.emptyTitle") }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ t("saved.offline.emptyCopy") }}
          </p>
        </div>
        <ListRow
          v-for="route in offlineRoutes"
          v-else
          :key="route.cacheKey"
          :title="route.name"
          :subtitle="t('saved.offline.downloaded', { size: route.size, date: route.downloaded })"
          :action="t('saved.offline.remove')"
          @action="removeOfflineRoute(route.cacheKey)"
        />
      </section>
    </div>

    <Modal
      :open="addPlaceModalOpen"
      :title="t('saved.places.addNewPlace')"
      size="lg"
      @close="addPlaceModalOpen = false"
    >
      <div class="space-y-5">
        <p class="text-sm text-muted-foreground">
          {{ t("saved.places.modalCopy") }}
        </p>

        <div class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{ t("home.addressOrLocation") }}</span>
          <PlaceAutocomplete
            v-model="newPlaceAddress"
            :placeholder="t('saved.places.searchPlaceholder')"
            :suggestions="placeSuggestions"
          />
          <p class="text-xs text-muted-foreground">
            {{ t("saved.places.searchHelp") }}
          </p>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{ t("home.placeName") }}</span>
          <input
            v-model="newPlaceName"
            class="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            :placeholder="t('saved.places.namePlaceholder')"
          />
        </label>

        <div class="space-y-2">
          <div class="text-sm text-foreground">{{ t("saved.places.placeType") }}</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="type in placeTypes"
              :key="type.value"
              type="button"
              :class="placeTypeClass(type.value)"
              :aria-pressed="newPlaceType === type.value"
              @click="selectPlaceType(type.value)"
            >
              {{ t(type.labelKey) }}
            </button>
          </div>
        </div>

        <p v-if="placeError" class="text-sm text-destructive">
          {{ placeError }}
        </p>

        <div
          class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
        >
          <AppButton
            variant="outline"
            class="w-full sm:w-auto"
            @click="closeAddPlaceModal"
          >
            {{ t("home.cancel") }}
          </AppButton>
          <AppButton
            class="w-full sm:w-auto"
            :disabled="!canSavePlace"
            @click="addNewPlace"
          >
            {{ t("saved.places.savePlace") }}
          </AppButton>
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  BookmarkCheck,
  Briefcase,
  Building2,
  ChevronRight,
  EllipsisVertical,
  Home as HomeIcon,
  Landmark,
  MapPin,
  Plane,
  ShoppingBag,
  Train,
  Trash2,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import PageTitle from "@/components/shared/PageTitle.vue";
import PlaceAutocomplete from "@/features/home/components/PlaceAutocomplete.vue";
import { placeSuggestions } from "@/features/home/services/placeSuggestions";
import {
  describeSavedPlace,
  makeSavedPlaceId,
  normalizeSavedPlaceType,
  type SavedPlaceIconKey,
  type SavedPlaceType,
} from "@/features/home/services/savedPlaces";
import { useFavoritePlaces } from "@/composables/useFavoritePlaces";
import { useSavedTrips } from "@/composables/useSavedTrips";
import { useRecentSearches } from "@/composables/useRecentSearches";
import { useCachedRoutes } from "@/composables/useCachedRoutes";
import type { CachedRoute, RecentSearchRecord } from "@/db/appDb";

const router = useRouter();
const { t } = useI18n();
const { favoritePlaces, saveFavoritePlace, removeFavoritePlace } =
  useFavoritePlaces();
const { savedTrips } = useSavedTrips();
const { recentSearches } = useRecentSearches(20);
const { cachedRoutes, removeCachedRoute } = useCachedRoutes();
const activeTab = ref<"places" | "routes" | "history" | "offline">(
  "places",
);
const addPlaceModalOpen = ref(false);
// Dynamic, offline-first saved places from IndexedDB (reactive via liveQuery).
const savedPlaces = computed(() =>
  favoritePlaces.value.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    type: normalizeSavedPlaceType(place.type ?? "other"),
    ...describeSavedPlace(place.name, place.address, place.type ?? "other"),
  })),
);
const newPlaceName = ref("");
const newPlaceAddress = ref("");
const newPlaceType = ref<SavedPlaceType>("other");
const placeError = ref("");
const activePlaceMenuId = ref<string | null>(null);
const canSavePlace = computed(() => newPlaceAddress.value.trim().length > 0);

const tabs = computed(() => [
  { value: "places" as const, labelKey: "saved.tabs.places", count: savedPlaces.value.length },
  { value: "routes" as const, labelKey: "saved.tabs.routes", count: savedRoutes.value.length },
  { value: "history" as const, labelKey: "saved.tabs.trips", count: recentTrips.value.length },
  // { value: "ai" as const, labelKey: "saved.tabs.aiPlans", count: aiPlans.length },
  { value: "offline" as const, labelKey: "saved.tabs.offline", count: offlineRoutes.value.length },
]);

const placeTypes = [
  { value: "home" as const, labelKey: "home.placeTypes.home" },
  { value: "work" as const, labelKey: "home.placeTypes.work" },
  { value: "school" as const, labelKey: "home.placeTypes.school" },
  { value: "other" as const, labelKey: "home.placeTypes.gym" },
];

// Dynamic, offline-first saved routes from IndexedDB.
const savedRoutes = computed(() =>
  savedTrips.value.map((trip) => ({
    id: trip.id,
    name: trip.name || `${trip.start} -> ${trip.destination}`,
    from: trip.start,
    to: trip.destination,
    filter: trip.filter,
    duration: trip.duration || "—",
    cost: trip.cost || "—",
    lastUsed: relativeTime(trip.createdAt),
  })),
);

function relativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return t("saved.routes.justNow");
  if (minutes < 60) return t("saved.routes.minutesAgo", { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("saved.routes.hoursAgo", { count: hours });
  const days = Math.round(hours / 24);
  if (days < 7) return t("saved.routes.daysAgo", { count: days });
  return new Date(timestamp).toLocaleDateString();
}

// Dynamic trip history from the offline-first recent-searches store.
const recentTrips = computed(() =>
  recentSearches.value.map((search: RecentSearchRecord) => ({
    id: search.id ?? `${search.from}-${search.to}-${search.searchedAt}`,
    from: search.from,
    to: search.to,
    filter: search.filter,
    date: relativeTime(search.searchedAt),
  })),
);

const aiPlans = [
  {
    name: "3-Day Cairo Cultural Tour",
    budget: "1500 EGP",
    created: "Dec 20, 2024",
    destinations: 5,
  },
  {
    name: "Weekend Food Tour",
    budget: "800 EGP",
    created: "Dec 18, 2024",
    destinations: 8,
  },
];

// Dynamic offline routes from the IndexedDB cachedRoutes store.
const offlineRoutes = computed(() =>
  cachedRoutes.value.map((route: CachedRoute) => ({
    cacheKey: route.cacheKey,
    name: `${route.from} -> ${route.to}`,
    size: `${(JSON.stringify(route.routes).length / 1024).toFixed(1)} KB`,
    downloaded: relativeTime(route.cachedAt),
  })),
);

const SectionHeader = defineComponent({
  props: { title: String, subtitle: String },
  setup: (p) => () =>
    h("div", { class: "mb-5" }, [
      h(
        "h2",
        { class: "font-display text-xl md:text-2xl text-foreground" },
        p.title,
      ),
      p.subtitle
        ? h("p", { class: "text-sm text-muted-foreground" }, p.subtitle)
        : null,
    ]),
});

const SavedCard = defineComponent({
  props: {
    title: String,
    subtitle: String,
    meta: String,
    iconKey: { type: String, default: "place" },
    color: String,
    softColor: String,
    removable: Boolean,
    menuOpen: Boolean,
    actionLabel: { type: String, default: "" },
  },
  emits: ["click", "delete", "toggle-menu"],
  setup(p, { emit }) {
    const { t } = useI18n();

    function activate(event?: Event) {
      event?.stopPropagation();
      emit("click");
    }

    function onCardKeydown(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activate();
    }

    function toggleMenu(event: Event) {
      event.stopPropagation();
      emit("toggle-menu");
    }

    function deletePlace(event: Event) {
      event.stopPropagation();
      emit("delete");
    }

    return () =>
      h(
        "article",
        {
          class:
            "relative bg-card rounded-xl border border-border transition-all cursor-pointer group hover:border-primary hover:bg-secondary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-within:border-primary focus-within:shadow-md",
          role: "button",
          tabindex: 0,
          onClick: () => activate(),
          onKeydown: onCardKeydown,
        },
        [
          h("div", { class: "flex min-h-[92px] items-center gap-3 p-3 md:min-h-[160px] md:flex-col md:items-stretch md:gap-4 md:p-5" }, [
            h(
              "div",
              { class: "flex min-w-0 flex-1 items-center gap-3 md:block" },
              [
                h(
                  "div",
                  {
                    class:
                      "w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-lg flex items-center justify-center",
                    style: { backgroundColor: p.softColor || "var(--primary-soft)" },
                  },
                  [
                    h(savedPlaceIcon(p.iconKey as SavedPlaceIconKey), {
                      class: "w-6 h-6",
                      style: { color: p.color || "var(--primary)" },
                    }),
                  ],
                ),
                h("div", { class: "min-w-0 flex-1 md:mt-1" }, [
                  h(
                    "h3",
                    {
                      class:
                        "font-display text-base md:text-lg text-foreground leading-tight truncate",
                    },
                    p.title,
                  ),
                  h(
                    "p",
                    {
                      class:
                        "mt-0.5 text-sm text-muted-foreground line-clamp-2 md:line-clamp-1",
                    },
                  p.subtitle,
                  ),
                ]),
              ],
            ),
            h("div", { class: "flex shrink-0 items-center gap-1 self-center md:absolute md:end-3 md:top-3" }, [
              p.removable
                ? h(
                    "button",
                    {
                      class:
                        "rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "aria-label": t("saved.places.actions"),
                      "aria-expanded": p.menuOpen,
                      onClick: toggleMenu,
                    },
                    [h(EllipsisVertical, { class: "w-5 h-5" })],
                  )
                : null,
              h(ChevronRight, {
                class:
                  "w-5 h-5 text-muted-foreground md:hidden",
              }),
            ]),
            h("div", { class: "hidden md:mt-auto md:flex md:items-center md:justify-between md:gap-3" }, [
              p.meta
                ? h(
                    "span",
                    {
                      class:
                        "min-w-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground truncate",
                    },
                    p.meta,
                  )
                : h("span", { class: "text-xs text-muted-foreground" }, t("saved.places.quickRoute")),
              h(
                AppButton,
                {
                  variant: "outline",
                  size: "sm",
                  class: "shrink-0",
                  onClick: activate,
                },
                () => p.actionLabel || t("saved.places.planRoute"),
              ),
            ]),
          ]),
          p.removable && p.menuOpen
            ? h(
                "div",
                {
                  class:
                    "absolute end-3 top-12 z-20 w-44 rounded-lg border border-border bg-card p-1 shadow-lg",
                  role: "menu",
                  onClick: (event: MouseEvent) => event.stopPropagation(),
                },
                [
                  h(
                    "button",
                    {
                      class:
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-destructive hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      role: "menuitem",
                      onClick: deletePlace,
                    },
                    [
                      h(Trash2, { class: "w-4 h-4" }),
                      t("saved.places.deletePlace"),
                    ],
                  ),
                ],
              )
            : null,
        ],
      );
  },
});

const ListRow = defineComponent({
  props: { title: String, subtitle: String, meta: String, action: String },
  emits: ["action"],
  setup: (p, { emit }) => () =>
    h("article", { class: "bg-card rounded-xl border-2 border-border overflow-hidden" }, [
      h("div", { class: "grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-5" }, [
        h("div", { class: "min-w-0" }, [
          h(
            "h3",
            { class: "font-display text-lg md:text-xl text-foreground mb-1 truncate" },
            p.title,
          ),
          h("p", { class: "text-sm text-muted-foreground mb-2" }, p.subtitle),
          p.meta
            ? h("p", { class: "text-sm text-muted-foreground" }, p.meta)
            : null,
        ]),
        h(
          AppButton,
          {
            variant: "outline",
            size: "sm",
            class: "w-full md:w-auto",
            onClick: () => emit("action"),
          },
          () => p.action,
        ),
      ]),
    ]),
});

function useSavedRoute(route: {
  from: string;
  to: string;
  filter: string;
}) {
  router.push({
    path: "/route-results",
    query: { start: route.from, destination: route.to, filter: route.filter },
    state: { start: route.from, destination: route.to, filter: route.filter },
  });
}

// Re-run a past search from the History tab.
function repeatTrip(trip: { from: string; to: string; filter: string }) {
  useSavedRoute(trip);
}

function removeOfflineRoute(cacheKey: string) {
  void removeCachedRoute(cacheKey);
}

function tabClass(value: string) {
  return [
    "flex items-center justify-between gap-2 px-3 md:px-5 py-2.5 rounded-lg whitespace-nowrap transition-all text-sm",
    activeTab.value === value
      ? "bg-primary text-primary-foreground"
      : "bg-card border-2 border-border text-muted-foreground hover:border-primary",
  ];
}

function tabCountClass(value: string) {
  return [
    "rounded-full px-2 py-0.5 text-xs",
    activeTab.value === value
      ? "bg-primary-foreground/20 text-primary-foreground"
      : "bg-muted text-muted-foreground",
  ];
}

function placeTypeClass(value: SavedPlaceType) {
  return [
    "flex min-h-10 items-center justify-center rounded-full border-2 px-4 py-2 text-sm text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    newPlaceType.value === value
      ? "border-primary bg-secondary text-primary"
      : "border-border text-foreground hover:border-primary hover:bg-muted",
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

function savedPlaceLabel(place: { name: string; type?: SavedPlaceType }) {
  const normalized = place.name.trim().toLowerCase();
  if (normalized === "home") return t("home.placeTypes.home");
  if (normalized === "work") return t("home.placeTypes.work");
  if (normalized === "school") return t("home.placeTypes.school");
  if (normalized === "gym") return t("home.placeTypes.gym");
  return place.name;
}

function closeAddPlaceModal() {
  addPlaceModalOpen.value = false;
  placeError.value = "";
}

function selectPlaceType(type: SavedPlaceType) {
  newPlaceType.value = type;
  if (!newPlaceName.value.trim() && type !== "other") {
    newPlaceName.value = t(`home.placeTypes.${type}`);
  }
}

async function addNewPlace() {
  const address = newPlaceAddress.value.trim();
  const name = newPlaceName.value.trim() || address;

  if (!address) {
    placeError.value = t("home.validation.placeAddressRequired");
    return;
  }

  await saveFavoritePlace({
    id: makeSavedPlaceId(name, address),
    name,
    address,
    type: newPlaceType.value,
    createdAt: Date.now(),
  });
  newPlaceName.value = "";
  newPlaceAddress.value = "";
  newPlaceType.value = "other";
  closeAddPlaceModal();
}

function removeSavedPlace(placeId: string) {
  if (activePlaceMenuId.value === placeId) {
    activePlaceMenuId.value = null;
  }
  void removeFavoritePlace(placeId);
}

function togglePlaceMenu(placeId: string) {
  activePlaceMenuId.value =
    activePlaceMenuId.value === placeId ? null : placeId;
}

function planRouteToPlace(destination: string) {
  activePlaceMenuId.value = null;
  router.push({
    path: "/route-results",
    query: {
      start: "Tahrir Square",
      destination,
      filter: "fastest",
    },
    state: {
      start: "Tahrir Square",
      destination,
      filter: "fastest",
    },
  });
}
</script>
