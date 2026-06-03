<template>
  <main class="min-h-screen bg-background pb-20">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <PageTitle
        title="AI Trip Planner"
        subtitle="Let AI create a complete day itinerary with attractions, restaurants, and transport"
      />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section class="lg:col-span-2 space-y-6">
          <div class="bg-card rounded-xl p-4 md:p-8 border-2 border-border">
            <h2 class="font-display text-2xl text-foreground mb-6">
              Tell me about your trip
            </h2>
            <div class="space-y-6">
              <label class="block">
                <span class="block text-sm text-foreground mb-2"
                  >What kind of trip are you planning?</span
                >
                <textarea
                  v-model="tripType"
                  rows="4"
                  class="w-full px-4 py-3 bg-card border border-border  rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="E.g., A weekend cultural tour of Cairo..."
                />
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppInput
                  v-model="duration"
                  label="Trip Duration"
                  type="number"
                  placeholder="Number of days"
                >
                  <template #icon><Calendar class="w-5 h-5" /></template>
                </AppInput>
                <AppInput
                  v-model="budget"
                  label="Total Budget (EGP)"
                  type="number"
                  placeholder="Your budget"
                >
                  <template #icon><DollarSign class="w-5 h-5" /></template>
                </AppInput>
              </div>
              <div>
                <label class="block text-sm text-foreground mb-3"
                  >Select your interests</label
                >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    v-for="option in interestOptions"
                    :key="option.id"
                    :class="interestClass(option.id)"
                    @click="toggleInterest(option.id)"
                  >
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center"
                        :style="{ backgroundColor: option.softColor }"
                      >
                        <component
                          :is="option.icon"
                          class="w-4 h-4"
                          :style="{ color: option.color }"
                        />
                      </div>
                      <span class="text-sm text-foreground font-medium">{{
                        option.label
                      }}</span>
                    </div>
                  </button>
                </div>
              </div>
              <AppButton
                size="lg"
                class="w-full flex items-center justify-center gap-2"
                :disabled="!tripType || !budget"
                @click="generate"
              >
                <Wand2 class="w-5 h-5" /> Generate My Trip Plan
              </AppButton>
            </div>
          </div>

          <section class="bg-card rounded-xl p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-4">
              Popular Trip Ideas
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                v-for="idea in ideas"
                :key="idea.name"
                class="p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-primary-soft transition-all"
                @click="useIdea(idea)"
              >
                <component
                  :is="idea.icon"
                  class="w-8 h-8 mb-3"
                  :style="{ color: idea.color }"
                />
                <div class="font-display text-foreground mb-1">
                  {{ idea.name }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ idea.duration }} - {{ idea.budget }}
                </div>
              </button>
            </div>
          </section>
        </section>

        <aside class="space-y-6">
          <section class="bg-card rounded-xl p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-4">
              How it works
            </h3>
            <Step
              n="1"
              title="Tell us your preferences"
              copy="Duration, budget, and interests"
            />
            <Step
              n="2"
              title="AI creates your plan"
              copy="Attractions, food, and transport"
            />
            <Step n="3" title="Save your trip" copy="Access it anytime" />
          </section>

          <section
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary rounded-xl p-6 border-2 border-primary"
          >
            <Sparkles class="w-8 h-8 text-foreground mb-3" />
            <h3 class="font-display text-xl text-foreground mb-2">
              Included in your plan
            </h3>
            <ul class="space-y-2 text-sm text-foreground">
              <li>AI-generated daily itineraries</li>
              <li>Personalized activity suggestions</li>
              <li>Restaurant and cafe recommendations</li>
              <li>Detailed cost breakdown</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Building2,
  Calendar,
  DollarSign,
  Landmark,
  ScrollText,
  ShoppingBag,
  Sparkles,
  Theater,
  TreePine,
  Utensils,
  Wand2,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import PageTitle from "@/components/shared/PageTitle.vue";

const router = useRouter();
const tripType = ref("");
const duration = ref("1");
const budget = ref("");
const interests = ref<string[]>([]);
const interestOptions = [
  {
    id: "culture",
    label: "Cultural Sites",
    icon: Landmark,
    color: "var(--primary)",
    softColor: "var(--primary-soft)",
  },
  {
    id: "food",
    label: "Food & Dining",
    icon: Utensils,
    color: "var(--transport-microbus)",
    softColor: "var(--transport-microbus-soft)",
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: ShoppingBag,
    color: "var(--transport-walking)",
    softColor: "var(--transport-walking-soft)",
  },
  {
    id: "nature",
    label: "Parks & Nature",
    icon: TreePine,
    color: "var(--success)",
    softColor: "var(--success-soft)",
  },
  {
    id: "history",
    label: "Historical",
    icon: ScrollText,
    color: "var(--foreground)",
    softColor: "var(--muted)",
  },
  {
    id: "modern",
    label: "Modern Cairo",
    icon: Building2,
    color: "var(--muted-foreground)",
    softColor: "var(--muted)",
  },
];
const ideas = [
  {
    name: "Ancient Cairo Explorer",
    duration: "1 day",
    budget: "500 EGP",
    icon: Landmark,
    color: "var(--primary)",
  },
  {
    name: "Food Lover's Tour",
    duration: "1 day",
    budget: "800 EGP",
    icon: Utensils,
    color: "var(--transport-microbus)",
  },
  {
    name: "Modern Cairo Experience",
    duration: "2 days",
    budget: "1500 EGP",
    icon: Building2,
    color: "var(--success)",
  },
  {
    name: "Weekend Cultural Tour",
    duration: "3 days",
    budget: "2000 EGP",
    icon: Theater,
    color: "var(--transport-walking)",
  },
];
const Step = defineComponent({
  props: { n: String, title: String, copy: String },
  setup: (p) => () =>
    h("div", { class: "flex gap-3 mb-4 last:mb-0" }, [
      h(
        "div",
        {
          class:
            "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-display",
        },
        p.n,
      ),
      h("div", [
        h("div", { class: "font-medium text-foreground" }, p.title),
        h("div", { class: "text-sm text-muted-foreground" }, p.copy),
      ]),
    ]),
});

function toggleInterest(id: string) {
  interests.value = interests.value.includes(id)
    ? interests.value.filter((item) => item !== id)
    : [...interests.value, id];
}

function interestClass(id: string) {
  return [
    "p-4 rounded-lg border-2 transition-all text-left",
    interests.value.includes(id)
      ? "border-primary bg-primary-soft"
      : "border-border hover:border-primary",
  ];
}

function useIdea(idea: { name: string; duration: string; budget: string }) {
  tripType.value = idea.name;
  duration.value = idea.duration.split(" ")[0];
  budget.value = idea.budget.split(" ")[0];
}

function generate() {
  router.push({
    path: "/ai-plan",
    state: {
      tripType: tripType.value,
      duration: duration.value,
      budget: budget.value,
      interests: interests.value,
    },
  });
}
</script>
