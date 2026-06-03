<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <PageTitle
        title="AI Assistant"
        subtitle="Ask me anything about your journey in natural language"
      />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section
          class="lg:col-span-2 bg-card rounded-xl border-2 border-border p-6 md:p-8"
        >
          <div class="flex items-center gap-3 mb-4">
            <Sparkles class="w-8 h-8 text-primary" />
            <h2 class="font-display text-2xl text-foreground">
              Describe Your Journey
            </h2>
          </div>
          <p class="text-muted-foreground mb-6">
            Tell us where you want to go and your preferences. We'll find the
            best routes for you.
          </p>
          <textarea
            v-model="input"
            rows="6"
            class="w-full p-4 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Example: I need the fastest route from Nasr City to Cairo Airport with minimal walking."
          />
          <AppButton
            class="mt-4 w-full md:w-auto flex items-center gap-2"
            @click="search"
          >
            <Send class="w-5 h-5" /> Search Route
          </AppButton>
        </section>

        <aside class="space-y-6">
          <section class="bg-card rounded-xl p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-4">
              Try asking:
            </h3>
            <div class="space-y-2">
              <button
                v-for="example in examples"
                :key="example"
                class="w-full p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary-soft transition-all text-sm"
                @click="input = example"
              >
                {{ example }}
              </button>
            </div>
          </section>

          <section class="bg-card rounded-xl p-6 border-2 border-border">
            <h3 class="font-display text-xl text-foreground mb-4">
              I can help with:
            </h3>
            <Feature v-for="item in features" :key="item.title" v-bind="item" />
          </section>

          <section
            class="bg-gradient-to-br from-primary to-secondary rounded-xl p-6 border-2 border-primary"
          >
            <h3 class="font-display text-xl text-foreground mb-2">
              Need a full trip plan?
            </h3>
            <p class="text-foreground text-sm mb-4">
              Use AI Trip Planner for complete day itineraries with attractions,
              restaurants, and transport.
            </p>
            <AppButton
              variant="outline"
              class="w-full"
              @click="router.push('/ai-trip-planner')"
            >
              Try Trip Planner
            </AppButton>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import { Clock, MapPin, Send, Sparkles, TrendingUp } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import PageTitle from "@/components/shared/PageTitle.vue";

const router = useRouter();
const input = ref("");
const examples = [
  "Get me to Cairo Airport in under an hour",
  "What's the cheapest way to reach Giza Pyramids?",
  "Find a comfortable route to New Cairo",
  "How do I get to City Stars Mall?",
];
const features = [
  {
    title: "Route Planning",
    copy: "Find the best way to get anywhere",
    icon: MapPin,
  },
  { title: "Time & Cost", copy: "Balance speed and budget", icon: Clock },
  {
    title: "Smart Suggestions",
    copy: "Personalized recommendations",
    icon: TrendingUp,
  },
  { title: "Trip Planning", copy: "Full day itineraries", icon: Sparkles },
];

const Feature = defineComponent({
  props: {
    title: String,
    copy: String,
    icon: { type: [Object, Function], required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "flex items-start gap-3 mb-3 last:mb-0" }, [
        h(props.icon as any, {
          class: "w-5 h-5 text-primary flex-shrink-0 mt-0.5",
        }),
        h("div", [
          h("div", { class: "font-medium text-foreground" }, props.title),
          h("div", { class: "text-sm text-muted-foreground" }, props.copy),
        ]),
      ]);
  },
});

function search() {
  if (input.value.trim()) {
    router.push({ path: "/route-results", state: { aiPrompt: input.value } });
  }
}
</script>
