<template>
  <div
    class="bg-card border-2 border-border rounded-xl p-5 hover:border-primary transition-all"
    :class="{
      'cursor-pointer': !isComfortable,
    }"
    @click="handleCardClick"
  >
    <!-- Badges -->
    <div class="flex flex-wrap gap-2 mb-4">
      <span
        v-if="isFastest"
        class="flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-3 rounded-full bg-red-200 text-red-900 text-xs font-semibold"
      >
        <Zap class="w-3 h-3 md:w-4 md:h-4" />
        <span class="hidden sm:inline">{{ t("routeResults.fastest") }}</span>
        <span class="sm:hidden">Fastest</span>
      </span>

      <span
        v-if="isCheapest"
        class="flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-3 rounded-full bg-green-200 text-green-900 text-xs font-semibold"
      >
        <Wallet class="w-3 h-3 md:w-4 md:h-4" />
        <span class="hidden sm:inline">{{ t("routeResults.cheapest") }}</span>
        <span class="sm:hidden">Cheap</span>
      </span>
      <span
        v-if="isComfortable"
        class="flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-3 rounded-full bg-blue-200 text-blue-900 text-xs font-semibold"
      >
        <Sofa class="w-3 h-3 md:w-4 md:h-4" />
        <span class="hidden sm:inline">{{
          t("routeResults.mostComfortable")
        }}</span>
        <span class="sm:hidden">Comfy</span>
      </span>
    </div>
    <!-- Transport Steps -->
    <div
      class="flex flex-wrap items-center gap-1 md:gap-2 mb-4 md:mb-5 overflow-x-auto pb-2"
    >
      <template v-for="(step, index) in route.steps" :key="index">
        <div class="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          <component
            :is="getIcon(step.type)"
            class="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0"
          />

          <span
            class="text-xs md:text-sm font-medium text-foreground whitespace-nowrap"
          >
            {{ formatStepLabel(step.label, step.type) }}
          </span>
        </div>

        <ChevronRight
          v-if="index < route.steps.length - 1"
          class="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0 rtl:rotate-180"
        />
      </template>
    </div>

    <!-- Route Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-5">
      <div>
        <p class="text-xs text-muted-foreground truncate">
          {{ t("routeResults.totalDuration") }}
        </p>
        <p class="font-semibold text-sm md:text-lg leading-tight">
          {{ formatUnit(route.duration) }}
        </p>
      </div>

      <div>
        <p class="text-xs text-muted-foreground truncate">
          {{ t("routeResults.totalCost") }}
        </p>
        <p class="font-semibold text-sm md:text-lg leading-tight">
          {{ isFree ? t("routeResults.free") : formatUnit(route.cost) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground truncate">
          {{ t("routeResults.transfers") }}
        </p>
        <p class="font-semibold text-sm md:text-lg leading-tight">
          {{ route.transfers }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground truncate">
          {{ t("routeResults.walking") }}
        </p>
        <p class="font-semibold text-sm md:text-lg leading-tight">
          {{ formatUnit(route.walkingDistance) }}
        </p>
      </div>
    </div>

    <!-- <a
      v-if="isComfortable"
      href="https://m.uber.com"
      target="_blank"
      rel="noopener noreferrer"
      @click.stop
      class="w-full flex items-center justify-center py-3 rounded-lg bg-black text-white font-medium hover:opacity-90 transition"
    >
      Book Uber
    </a> -->
    <!-- View Details -->
    <AppButton variant="primary" class="w-full" @click.stop="$emit('select')">
      {{ t("routeResults.viewDetails") }}
    </AppButton>
  </div>
</template>

<script setup lang="ts">
import {
  Train,
  Bus,
  Car,
  CarFront,
  PersonStanding,
  ChevronRight,
  Zap,
  Wallet,
  Sofa,
} from "@lucide/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AppButton from "../ui/AppButton.vue";
import {
  localizeMode,
  localizeRouteInstruction,
} from "@/services/placeLocalization";

const emit = defineEmits(["select"]);
const { locale, t } = useI18n();

const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
  isFastest: Boolean,
  isCheapest: Boolean,
  isComfortable: Boolean,
});

// Walk-only itineraries have no fare — show "Free" rather than "0 EGP".
const isFree = computed(() => Number(props.route?.totalFare?.amount) === 0);

function handleCardClick() {
  if (!props.isComfortable) {
    emit("select");
  }
}

function getIcon(type: string) {
  switch (type) {
    case "metro":
      return Train;

    case "microbus":
    case "bus":
      return Bus;

    case "walking":
      return PersonStanding;

    case "ride-hailing":
      return Car;

    default:
      return Bus;
  }
}

function formatUnit(value: unknown) {
  const text = String(value);
  if (locale.value !== "ar") return text;
  return text
    .replace(/(\d+(?:\.\d+)?)\s*min\b/gi, "$1 دقيقة")
    .replace(/(\d+(?:\.\d+)?)\s*km\b/gi, "$1 كم")
    .replace(/(\d+(?:\.\d+)?)\s*m\b/gi, "$1 م")
    .replace(/(\d+(?:\.\d+)?)\s*EGP\b/gi, "$1 جنيه");
}

function formatStepLabel(label: string, type: string) {
  if (locale.value !== "ar") return label;

  const modeMatch = label.match(/^(Bus|Metro)\s+(.+)$/i);
  if (modeMatch) {
    return `${localizeMode(modeMatch[1], "ar")} ${modeMatch[2]}`;
  }

  if (type === "walking" || type === "walk") {
    return localizeRouteInstruction(label, "ar");
  }

  return localizeRouteInstruction(label, "ar");
}
</script>
