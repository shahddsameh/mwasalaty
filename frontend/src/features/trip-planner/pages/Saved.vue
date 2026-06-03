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

      <div class="flex gap-2 md:gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="tabClass(tab.value)"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <section v-if="activeTab === 'places'">
        <div class="flex flex-col sm:flex-row justify-between gap-3 mb-6">
          <h2 class="font-display text-2xl text-foreground">
            Saved Places ({{ savedPlaces.length }})
          </h2>
          <AppButton
            class="flex items-center gap-2"
            @click="addPlaceModalOpen = true"
          >
            <MapPin class="w-5 h-5" /> Add New Place
          </AppButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SavedCard
            v-for="place in savedPlaces"
            :key="place.name"
            :title="place.name"
            :subtitle="place.address"
          />
        </div>
      </section>

      <section v-else-if="activeTab === 'routes'" class="space-y-4">
        <h2 class="font-display text-2xl text-foreground mb-6">Saved Routes</h2>
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
        <h2 class="font-display text-2xl text-foreground mb-6">Recent Trips</h2>
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
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <SavedCard
          v-for="plan in aiPlans"
          :key="plan.name"
          :title="plan.name"
          :subtitle="`Created ${plan.created}`"
          :meta="`${plan.budget} - ${plan.destinations} destinations`"
          @click="router.push('/ai-plan')"
        />
      </section>

      <section v-else class="space-y-4">
        <h2 class="font-display text-2xl text-foreground mb-6">
          Offline Routes
        </h2>
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
            v-for="type in ['Home', 'Work', 'School', 'Other']"
            :key="type"
            class="p-4 border-2 border-border rounded-lg hover:border-primary"
          >
            {{ type }}
          </button>
        </div>
        <input
          class="w-full px-4 py-2.5 bg-card border border-border rounded-lg"
          placeholder="Place name"
        />
        <input
          class="w-full px-4 py-2.5 bg-card border border-border rounded-lg"
          placeholder="Address or location"
        />
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="addPlaceModalOpen = false"
            >Save Place</AppButton
          >
          <AppButton
            variant="outline"
            class="flex-1"
            @click="addPlaceModalOpen = false"
          >
            Cancel
          </AppButton>
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import { BookmarkCheck, MapPin, Trash2 } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import PageTitle from "@/components/shared/PageTitle.vue";
import { savedPlaces } from "@/constants/data";

const router = useRouter();
const activeTab = ref<"places" | "routes" | "history" | "ai" | "offline">(
  "places",
);
const addPlaceModalOpen = ref(false);

const tabs = [
  { value: "places" as const, label: "Saved Places" },
  { value: "routes" as const, label: "Saved Routes" },
  { value: "history" as const, label: "Recent Trips" },
  { value: "ai" as const, label: "AI Plans" },
  { value: "offline" as const, label: "Offline Routes" },
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

const SavedCard = defineComponent({
  props: { title: String, subtitle: String, meta: String },
  emits: ["click"],
  setup:
    (p, { emit }) =>
    () =>
      h(
        "article",
        {
          class:
            "bg-card rounded-xl p-6 border-2 border-border hover:border-primary transition-all cursor-pointer group",
          onClick: () => emit("click"),
        },
        [
          h("div", { class: "flex justify-between mb-4" }, [
            h(
              "div",
              {
                class:
                  "w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center",
              },
              [h(MapPin, { class: "w-6 h-6 text-primary" })],
            ),
            h(
              "button",
              {
                class:
                  "p-2 hover:bg-danger-soft rounded-lg opacity-0 group-hover:opacity-100",
              },
              [h(Trash2, { class: "w-5 h-5 text-destructive" })],
            ),
          ]),
          h(
            "h3",
            { class: "font-display text-xl text-foreground mb-1" },
            p.title,
          ),
          h("p", { class: "text-muted-foreground mb-3" }, p.subtitle),
          p.meta
            ? h("p", { class: "text-sm text-muted-foreground mb-4" }, p.meta)
            : null,
          h(
            AppButton,
            { variant: "outline", size: "sm", class: "w-full" },
            () => "Open",
          ),
        ],
      ),
});

const ListRow = defineComponent({
  props: { title: String, subtitle: String, meta: String, action: String },
  setup: (p) => () =>
    h("article", { class: "bg-card rounded-xl p-5 border-2 border-border" }, [
      h("div", { class: "flex flex-col sm:flex-row justify-between gap-4" }, [
        h("div", [
          h(
            "h3",
            { class: "font-display text-xl text-foreground mb-2" },
            p.title,
          ),
          h("p", { class: "text-muted-foreground mb-2" }, p.subtitle),
          p.meta
            ? h("p", { class: "text-sm text-muted-foreground" }, p.meta)
            : null,
        ]),
        h(AppButton, { variant: "outline", size: "sm" }, () => p.action),
      ]),
    ]),
});

function tabClass(value: string) {
  return [
    "px-4 md:px-6 py-3 rounded-lg whitespace-nowrap transition-all text-sm",
    activeTab.value === value
      ? "bg-primary text-primary-foreground"
      : "bg-card border-2 border-border text-muted-foreground hover:border-primary",
  ];
}
</script>
