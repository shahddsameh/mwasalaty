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
            :disabled="loading || !input.trim()"
            @click="search"
          >
            <Send class="w-5 h-5" />
            {{ loading ? "Understanding request..." : "Search Route" }}
          </AppButton>
          <p v-if="message" class="mt-4 text-sm text-destructive" role="alert">
            {{ message }}
          </p>
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
            class="bg-gradient-to-br from-primary to-primary-soft text-gradient-foreground rounded-xl p-6 border-2 border-primary"
          >
            <h3 class="font-display text-xl mb-2">Need a full trip plan?</h3>
            <p class="text-sm mb-4">
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
import { defineComponent, h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Clock, MapPin, Send, Sparkles, TrendingUp } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import PageTitle from "@/components/shared/PageTitle.vue";
import { parseAiRouteIntent, type AiRouteIntent } from "@/services/api";
import { getFavoritePlaces } from "@/core/offline/repositories/favoritePlacesRepository";
import { setPlaceCoords } from "@/features/trip-planner/services/routeSearch";
import type { FavoritePlace } from "@/db/appDb";

const router = useRouter();
const { t } = useI18n();
const input = ref("");
const loading = ref(false);
const message = ref("");

// Cached saved places (home / work / school / named favorites). The AI parser
// emits the literal token "home"/"work"/"school" — we swap in the user's saved
// place here so personal addresses never leave the device (or reach the LLM).
const favorites = ref<FavoritePlace[]>([]);
onMounted(async () => {
  try {
    favorites.value = (await getFavoritePlaces()).data;
  } catch {
    favorites.value = [];
  }
});

const PERSONAL_TYPES: Record<string, string> = {
  home: "home",
  house: "home",
  work: "work",
  office: "work",
  workplace: "work",
  job: "work",
  school: "school",
  college: "school",
  university: "school",
};

type ResolvedPlace = {
  label: string;
  coords?: { lat: number; lng: number };
  missing?: boolean;
};

// Resolve a parser place token against the user's favorites. Returns null when the
// label is an ordinary place, `{ missing: true }` when a personal place is referenced
// but not saved yet, otherwise the saved place's display label and coordinates.
function resolvePersonal(label: string | null): ResolvedPlace | null {
  if (!label) return null;
  const key = label.trim().toLowerCase();
  const type = PERSONAL_TYPES[key];
  let fav = type ? favorites.value.find((f) => f.type === type) : undefined;
  if (!fav)
    fav = favorites.value.find((f) => f.name.trim().toLowerCase() === key);
  if (type && !fav) return { label, missing: true };
  if (!fav) return null;
  const coords =
    typeof fav.lat === "number" && typeof fav.lng === "number"
      ? { lat: fav.lat, lng: fav.lng }
      : undefined;
  return { label: fav.name, coords };
}

// One-shot device location (triggers the browser's permission prompt).
function getCurrentCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  });
}

function goToResults(
  startLabel: string,
  destLabel: string,
  intent: AiRouteIntent,
) {
  router.push({
    path: "/route-results",
    query: {
      start: startLabel,
      destination: destLabel,
      filter: intent.filter,
      timeMode: intent.timeMode,
      ...(intent.date ? { date: intent.date } : {}),
      ...(intent.time ? { time: intent.time } : {}),
      ...(intent.maxDurationMinutes
        ? { maxDurationMinutes: String(intent.maxDurationMinutes) }
        : {}),
    },
    state: {
      aiPrompt: input.value.trim(),
      ...intent,
      from: startLabel,
      to: destLabel,
    },
  });
}
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

async function search() {
  const prompt = input.value.trim();
  if (!prompt || loading.value) return;

  loading.value = true;
  message.value = "";
  try {
    const result = await parseAiRouteIntent(prompt);
    const intent = result.intent;

    const fromRes = resolvePersonal(intent.from);
    const toRes = resolvePersonal(intent.to);

    // Referenced a personal place that hasn't been saved yet.
    if (fromRes?.missing || toRes?.missing) {
      const which = fromRes?.missing ? intent.from : intent.to;
      message.value = `You haven't saved a "${which}" place yet. Add it under Saved places first.`;
      return;
    }

    const startLabel = fromRes?.label ?? intent.from ?? undefined;
    const destLabel = toRes?.label ?? intent.to ?? undefined;

    if (result.status === "needs_clarification") {
      // Destination is known (e.g. "go home") but the origin is missing — use the
      // rider's current location, asking the browser for geolocation permission.
      if (
        result.missingFields.includes("from") &&
        toRes &&
        !fromRes &&
        destLabel
      ) {
        message.value = t("home.gettingLocation");
        try {
          const coords = await getCurrentCoords();
          const startLabel = t("home.currentLocation");
          setPlaceCoords(startLabel, coords);
          if (toRes.coords) setPlaceCoords(destLabel, toRes.coords);
          message.value = "";
          goToResults(startLabel, destLabel, intent);
        } catch (geoError: any) {
          message.value =
            geoError?.code === geoError?.PERMISSION_DENIED
              ? t("home.validation.permissionDenied")
              : t("home.validation.locationUnavailable");
        }
      } else {
        message.value = result.message;
      }
      return;
    }

    if (!startLabel || !destLabel) {
      message.value = "Please include both a starting point and a destination.";
      return;
    }

    // The results page resolves a label to coordinates via getPlaceCoords, so make
    // the saved place's coords available under its label (no geocoding of "home").
    if (fromRes?.coords) setPlaceCoords(startLabel, fromRes.coords);
    if (toRes?.coords) setPlaceCoords(destLabel, toRes.coords);

    goToResults(startLabel, destLabel, intent);
  } catch (error) {
    message.value =
      error instanceof Error
        ? error.message
        : "Could not understand that route request.";
  } finally {
    loading.value = false;
  }
}
</script>
