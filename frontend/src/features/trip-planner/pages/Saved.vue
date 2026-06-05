<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <PageTitle
        title="Saved & History"
        subtitle="Your saved places, routes, and travel history"
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
          <span>{{ tab.label }}</span>
          <span :class="tabCountClass(tab.value)">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <section v-if="activeTab === 'places'">
        <div class="flex flex-col gap-3 mb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 class="font-display text-xl md:text-2xl text-foreground">
              Saved Places
            </h2>
            <p class="text-sm text-muted-foreground">
              Quick destinations you can reuse for route planning.
            </p>
          </div>
          <AppButton
            class="w-full md:w-auto flex items-center justify-center gap-2"
            @click="addPlaceModalOpen = true"
          >
            <MapPin class="w-5 h-5" /> Add New Place
          </AppButton>
        </div>

        <div
          v-if="savedPlaces.length === 0"
          class="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center"
        >
          <MapPin class="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 class="font-display text-lg text-foreground mb-1">
            No saved places yet
          </h3>
          <p class="text-sm text-muted-foreground mb-4">
            Add home, work, school, or frequent destinations for faster planning.
          </p>
          <AppButton @click="addPlaceModalOpen = true">Add Place</AppButton>
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-3 md:gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(280px,360px))] md:justify-start"
        >
          <SavedCard
            v-for="place in savedPlaces"
            :key="place.id"
            :title="place.name"
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
          title="Saved Routes"
          subtitle="Routes you marked for quick reuse."
        />
        <ListRow
          v-for="route in savedRoutes"
          :key="route.name"
          :title="route.name"
          :subtitle="`${route.from} -> ${route.to}`"
          :meta="`${route.duration} - ${route.cost} - Last used ${route.lastUsed}`"
          action="Use Route"
        />
      </section>

      <section v-else-if="activeTab === 'history'" class="space-y-4">
        <SectionHeader
          title="Recent Trips"
          subtitle="Past journeys you can repeat or review."
        />
        <ListRow
          v-for="trip in recentTrips"
          :key="trip.date"
          :title="`${trip.from} -> ${trip.to}`"
          :subtitle="`${trip.date} - ${trip.duration}`"
          meta="Completed"
          action="Repeat Trip"
        />
      </section>

      <section
        v-else-if="activeTab === 'ai'"
        class="space-y-4"
      >
        <SectionHeader title="AI Plans" subtitle="Saved itinerary ideas." />
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SavedCard
            v-for="plan in aiPlans"
            :key="plan.name"
            :title="plan.name"
            :subtitle="`Created ${plan.created}`"
            :meta="`${plan.budget} - ${plan.destinations} destinations`"
            action-label="Open Plan"
            @click="router.push('/ai-plan')"
          />
        </div>
      </section>

      <section v-else class="space-y-4">
        <SectionHeader
          title="Offline Routes"
          subtitle="Downloaded routes available without internet."
        />
        <ListRow
          v-for="route in offlineRoutes"
          :key="route.name"
          :title="route.name"
          :subtitle="`${route.size} - Downloaded ${route.downloaded}`"
          action="Remove"
        />
      </section>
    </div>

    <Modal
      :open="addPlaceModalOpen"
      title="Add New Place"
      @close="addPlaceModalOpen = false"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-2">
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
        <input
          v-model="newPlaceName"
          class="w-full px-4 py-2.5 bg-card border border-border rounded-lg"
          placeholder="Place name"
        />
        <PlaceAutocomplete
          v-model="newPlaceAddress"
          placeholder="Address or location"
          :suggestions="placeSuggestions"
        />
        <p v-if="placeError" class="text-sm text-destructive">
          {{ placeError }}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AppButton class="w-full" @click="addNewPlace"
            >Save Place</AppButton
          >
          <AppButton
            variant="outline"
            class="w-full"
            @click="closeAddPlaceModal"
          >
            Cancel
          </AppButton>
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
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
  deleteSavedPlace,
  getSavedPlaces,
  savePlace,
  type SavedPlaceIconKey,
  type SavedPlaceType,
} from "@/features/home/services/savedPlaces";

const router = useRouter();
const activeTab = ref<"places" | "routes" | "history" | "ai" | "offline">(
  "places",
);
const addPlaceModalOpen = ref(false);
const savedPlaces = ref(getSavedPlaces());
const newPlaceName = ref("");
const newPlaceAddress = ref("");
const newPlaceType = ref<SavedPlaceType>("other");
const placeError = ref("");
const activePlaceMenuId = ref<string | null>(null);

const tabs = computed(() => [
  { value: "places" as const, label: "Places", count: savedPlaces.value.length },
  { value: "routes" as const, label: "Routes", count: savedRoutes.length },
  { value: "history" as const, label: "Trips", count: recentTrips.length },
  { value: "ai" as const, label: "AI Plans", count: aiPlans.length },
  { value: "offline" as const, label: "Offline", count: offlineRoutes.length },
]);

const placeTypes = [
  { value: "home" as const, label: "Home" },
  { value: "work" as const, label: "Work" },
  { value: "school" as const, label: "School" },
  { value: "other" as const, label: "Other" },
];

const savedRoutes = [
  {
    name: "Morning Commute",
    from: "Home",
    to: "Work",
    duration: "35 min",
    cost: "18 EGP",
    lastUsed: "2 hours ago",
  },
  {
    name: "Airport Route",
    from: "Tahrir Square",
    to: "Cairo Airport",
    duration: "45 min",
    cost: "25 EGP",
    lastUsed: "Yesterday",
  },
];

const recentTrips = [
  {
    from: "Maadi",
    to: "New Cairo",
    date: "Today, 3:45 PM",
    duration: "42 min",
  },
  {
    from: "Tahrir",
    to: "Airport",
    date: "Yesterday, 6:20 AM",
    duration: "48 min",
  },
];

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

const offlineRoutes = [
  { name: "Home to Work", size: "2.4 MB", downloaded: "Dec 25, 2024" },
  { name: "Airport Route", size: "3.1 MB", downloaded: "Dec 24, 2024" },
];

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
    actionLabel: { type: String, default: "Plan Route" },
  },
  emits: ["click", "delete", "toggle-menu"],
  setup(p, { emit }) {
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
            h("div", { class: "flex shrink-0 items-center gap-1 self-center md:absolute md:right-3 md:top-3" }, [
              p.removable
                ? h(
                    "button",
                    {
                      class:
                        "rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "aria-label": "Saved place actions",
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
                : h("span", { class: "text-xs text-muted-foreground" }, "Quick route"),
              h(
                AppButton,
                {
                  variant: "outline",
                  size: "sm",
                  class: "shrink-0",
                  onClick: activate,
                },
                () => p.actionLabel,
              ),
            ]),
          ]),
          p.removable && p.menuOpen
            ? h(
                "div",
                {
                  class:
                    "absolute right-3 top-12 z-20 w-44 rounded-lg border border-border bg-card p-1 shadow-lg",
                  role: "menu",
                  onClick: (event: MouseEvent) => event.stopPropagation(),
                },
                [
                  h(
                    "button",
                    {
                      class:
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      role: "menuitem",
                      onClick: deletePlace,
                    },
                    [
                      h(Trash2, { class: "w-4 h-4" }),
                      "Delete Place",
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
  setup: (p) => () =>
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
          { variant: "outline", size: "sm", class: "w-full md:w-auto" },
          () => p.action,
        ),
      ]),
    ]),
});

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
    "flex min-h-14 items-center justify-center p-3 text-center border-2 rounded-lg transition-all",
    newPlaceType.value === value
      ? "border-primary bg-secondary text-primary"
      : "border-border hover:border-primary",
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

function closeAddPlaceModal() {
  addPlaceModalOpen.value = false;
  placeError.value = "";
}

function addNewPlace() {
  const address = newPlaceAddress.value.trim();
  const name = newPlaceName.value.trim() || address;

  if (!address) {
    placeError.value = "Enter a place address first.";
    return;
  }

  savedPlaces.value = savePlace({
    name,
    address,
    type: newPlaceType.value,
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
  savedPlaces.value = deleteSavedPlace(placeId);
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
