<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
      <button
        class="flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
        @click="router.back()"
      >
        <ArrowLeft class="w-5 h-5" /> Back to Search
      </button>

      <section class="mb-6">
        <h1 class="font-display text-2xl md:text-3xl text-foreground mb-2">
          Route Options
        </h1>
        <div
          class="flex items-center gap-2 text-sm md:text-base text-muted-foreground"
        >
          <MapPin class="w-4 h-4 flex-shrink-0" />
          <span class="truncate">{{ start }} -> {{ destination }}</span>
        </div>
      </section>

      <div class="lg:hidden grid grid-cols-2 gap-3 mb-4">
        <Stat label="Distance" value="~28 km" />
        <Stat label="Routes Found" :value="`${routes.length} options`" />
      </div>

      <div class="mb-6 -mx-4 md:mx-0 px-4 md:px-0">
        <div class="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="tabClass(tab.value)"
            @click="sortBy = tab.value"
          >
            {{ tab.label }}
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
          <RouteCard
            v-for="route in sortedRoutes"
            :key="route.id"
            v-bind="route"
            @select="selectRoute(route)"
          />
        </div>

        <aside class="hidden lg:block lg:sticky lg:top-8 h-fit">
          <div class="bg-card rounded-xl p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-4">
              Map Overview
            </h3>
            <div
              class="aspect-square bg-gradient-to-br from-primary-soft to-warning-soft rounded-lg flex items-center justify-center border-2 border-border"
            >
              <div class="text-center">
                <MapPin class="w-16 h-16 text-primary mx-auto mb-2" />
                <p class="text-sm text-muted-foreground">Interactive map</p>
                <p class="text-xs text-muted-foreground">showing all routes</p>
              </div>
            </div>
            <div class="mt-6 space-y-3">
              <Stat label="Distance" value="~28 km" />
              <Stat label="Routes Found" :value="`${routes.length} options`" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, MapPin, SlidersHorizontal } from "@lucide/vue";
import RouteCard from "../components/RouteCard.vue";
import { routeOptions, type RouteOption } from "../data";

const router = useRouter();
const state = history.state ?? {};
const start = state.start ?? "Tahrir Square";
const destination = state.destination ?? "Cairo Airport";
const sortBy = ref<"fastest" | "cheapest" | "comfortable">(
  state.filter ?? "fastest",
);

const tabs = [
  { value: "fastest" as const, label: "Fastest" },
  { value: "cheapest" as const, label: "Cheapest" },
  { value: "comfortable" as const, label: "Comfortable" },
];

const routes = computed(() =>
  routeOptions.map((route) => ({
    ...route,
    recommended: recommendation(route),
  })),
);

const sortedRoutes = computed(() =>
  [...routes.value].sort((a, b) => {
    if (sortBy.value === "fastest")
      return parseInt(a.duration) - parseInt(b.duration);
    if (sortBy.value === "cheapest") return parseInt(a.cost) - parseInt(b.cost);
    const order = { "Very High": 1, High: 2, Medium: 3, Low: 4 };
    return (
      order[a.comfort as keyof typeof order] -
      order[b.comfort as keyof typeof order]
    );
  }),
);

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

function recommendation(route: RouteOption) {
  return (
    (sortBy.value === "fastest" && route.id === 3) ||
    (sortBy.value === "cheapest" && route.id === 2) ||
    (sortBy.value === "comfortable" && route.id === 3)
  );
}

function tabClass(value: string) {
  return [
    "px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-all text-sm whitespace-nowrap flex-shrink-0",
    sortBy.value === value
      ? "bg-primary text-primary-foreground"
      : "bg-card border-2 border-border text-muted-foreground hover:border-primary",
  ];
}

function selectRoute(route: RouteOption) {
  router.push({ path: "/route-details", state: { route, start, destination } });
}
</script>
