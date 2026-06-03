<template>
  <div
    class="bg-card border-2 border-border rounded-xl p-5 hover:border-primary transition-all"
    :class="{
      'cursor-pointer': !isComfortable,
    }"
    @click="handleCardClick"
  >
    <!-- Badges -->
    <div class="flex gap-2 mb-4">
      <span
        v-if="isFastest"
        class="flex items-center gap-2 px-5 py-3 rounded-full bg-red-200 text-red-900 text-xs font-semibold"
      >
        <Zap class="w-4 h-4" />
        Fastest
      </span>

      <span
        v-if="isCheapest"
        class="flex items-center gap-2 px-5 py-3 rounded-full bg-green-200 text-green-900 text-xs font-semibold"
      >
        <Wallet class="w-4 h-4" />
        Cheapest
      </span>
      <span
        v-if="isComfortable"
        class="flex items-center gap-2 px-5 py-3 rounded-full bg-blue-200 text-blue-900 text-xs font-semibold"
      >
        <Sofa class="w-4 h-4" />
        Most Comfortable
      </span>
    </div>
    <!-- Transport Steps -->
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <template v-for="(step, index) in route.steps" :key="index">
        <div class="flex items-center gap-1">
          <component :is="getIcon(step.type)" class="w-5 h-5 text-primary" />

          <span class="text-sm font-medium text-foreground">
            {{ step.label }}
          </span>
        </div>

        <ChevronRight
          v-if="index < route.steps.length - 1"
          class="w-4 h-4 text-muted-foreground"
        />
      </template>
    </div>

    <!-- Route Stats -->
    <div class="grid grid-cols-4 gap-4 mb-5">
      <div>
        <p class="text-xs text-muted-foreground">Total Duration</p>
        <p class="font-semibold text-lg">
          {{ route.duration }}
        </p>
      </div>

      <div>
        <p class="text-xs text-muted-foreground">Total Cost</p>
        <p class="font-semibold text-lg">
          {{ route.cost }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">Transfers</p>
        <p class="font-semibold">{{ route.transfers }}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">Walking</p>
        <p class="font-semibold">{{ route.walkingDistance }}</p>
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
      View Details
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
import AppButton from "../ui/AppButton.vue";

const emit = defineEmits(["select"]);

const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
  isFastest: Boolean,
  isCheapest: Boolean,
  isComfortable: Boolean,
});

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
</script>
