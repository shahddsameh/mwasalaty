<template>
  <main class="min-h-screen bg-background pb-20">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <div
        class="mb-8 flex flex-col lg:flex-row items-start justify-between gap-4"
      >
        <div>
          <h1
            class="font-display text-2xl md:text-3xl text-foreground mb-3 flex items-center gap-3"
          >
            <Sparkles class="w-10 h-10 text-primary" />{{ tripType }}
          </h1>
          <p class="text-muted-foreground">
            {{ duration }}-day AI-generated itinerary - Budget: {{ budget }} EGP
          </p>
        </div>
        <div class="flex flex-wrap gap-3 w-full lg:w-auto">
          <AppButton
            variant="outline"
            class="flex-1 sm:flex-none flex items-center gap-2"
            @click="savedPlan = true"
          >
            <BookmarkPlus class="w-5 h-5" /> {{ savedPlan ? "Saved" : "Save" }}
          </AppButton>
          <AppButton
            variant="outline"
            class="flex-1 sm:flex-none flex items-center gap-2"
          >
            <Share2 class="w-5 h-5" /> Share
          </AppButton>
          <AppButton
            variant="outline"
            class="flex-1 sm:flex-none flex items-center gap-2"
          >
            <Download class="w-5 h-5" /> Export
          </AppButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section class="lg:col-span-2 space-y-6">
          <article
            v-for="day in daySchedule"
            :key="day.day"
            class="bg-card rounded-xl p-4 md:p-6 border-2 border-border"
          >
            <div class="flex items-center gap-3 mb-6">
              <div
                class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display"
              >
                {{ day.day }}
              </div>
              <h2 class="font-display text-xl md:text-2xl text-foreground">
                {{ day.title }}
              </h2>
            </div>
            <div class="space-y-4">
              <div
                v-for="(item, index) in day.items"
                :key="item.time + item.name"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="text-sm text-muted-foreground mb-2 whitespace-nowrap"
                  >
                    {{ item.time }}
                  </div>
                  <div
                    class="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center"
                  >
                    <component
                      :is="getActivityIcon(item.icon)"
                      class="w-6 h-6 text-primary"
                    />
                  </div>
                  <div
                    v-if="index < day.items.length - 1"
                    class="w-0.5 h-10 bg-border my-2"
                  />
                </div>
                <div class="flex-1 pb-4 min-w-0">
                  <h3 class="font-display text-lg text-foreground">
                    {{ item.name }}
                  </h3>
                  <div
                    class="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1"
                  >
                    <span class="flex items-center gap-1"
                      ><Clock class="w-4 h-4" />{{ item.duration }}</span
                    >
                    <span class="flex items-center gap-1"
                      ><DollarSign class="w-4 h-4" />{{ item.cost }}</span
                    >
                  </div>
                  <div
                    class="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg mt-3"
                  >
                    <MapPin class="w-4 h-4" />{{ item.transport }}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <aside class="space-y-6">
          <section
            class="bg-card rounded-xl p-6 border-2 border-border lg:sticky lg:top-8"
          >
            <h3 class="font-display text-xl text-foreground mb-4">
              Cost Breakdown
            </h3>
            <Cost label="Attractions" value="770 EGP" />
            <Cost label="Food & Dining" value="530 EGP" />
            <Cost label="Transport" value="200 EGP" />
            <div class="pt-4 border-t-2 border-border mt-4">
              <div class="flex items-center justify-between">
                <span class="font-display text-lg text-foreground"
                  >Total Cost</span
                >
                <span class="font-display text-2xl text-primary"
                  >{{ totalCost }} EGP</span
                >
              </div>
              <div class="text-sm text-muted-foreground mt-2">
                Budget: {{ budget }} EGP - Remaining:
                {{ Number(budget) - totalCost }} EGP
              </div>
            </div>
          </section>
          <section
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary text-gradient-foreground rounded-xl p-6 border-2 border-primary"
          >
            <Sparkles class="w-6 h-6 mb-2" />
            <h3 class="font-display text-lg mb-2">AI Recommendations</h3>
            <p class="text-sm">
              This itinerary balances cultural exploration with authentic local
              cuisine. Transport is optimized for time and cost.
            </p>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import {
  Building2,
  ShoppingBag,
  Utensils,
  Landmark,
  Trees,
  Coffee,
  Camera,
  Train,
  Bus,
  MapPin,
  BookmarkPlus,
  Download,
  Share2,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import { aiDaySchedule } from "@/constants/data";

const state = history.state ?? {};
const tripType = state.tripType ?? "Weekend Cultural Tour";
const duration = state.duration ?? "2";
const budget = state.budget ?? "1500";
const savedPlan = ref(false);
const daySchedule = aiDaySchedule;
const totalCost = computed(() =>
  daySchedule.reduce(
    (sum, day) =>
      sum + day.items.reduce((daySum, item) => daySum + parseInt(item.cost), 0),
    0,
  ),
);
const Cost = defineComponent({
  props: { label: String, value: String },
  setup: (p) => () =>
    h("div", { class: "flex items-center justify-between mb-3 text-sm" }, [
      h("span", { class: "text-muted-foreground" }, p.label),
      h("span", { class: "font-display text-foreground" }, p.value),
    ]),
});
function getActivityIcon(type: string) {
  switch (type) {
    case "Museum":
      return Landmark;

    case "Shopping":
      return ShoppingBag;

    case "Food":
      return Utensils;

    case "Cafe":
      return Coffee;

    case "Nature":
      return Trees;

    case "Photo":
      return Camera;

    case "Transport":
      return Bus;

    default:
      return MapPin;
  }
}
</script>
