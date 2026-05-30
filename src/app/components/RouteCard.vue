<template>
  <div
    :class="[
      'bg-card rounded-xl p-3.5 md:p-4 lg:p-5 border-2 cursor-pointer hover:shadow-md transition-all duration-200',
      recommended ? 'border-primary shadow-lg' : 'border-border',
    ]"
    @click="$emit('select')"
  >
    <div v-if="recommended" class="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs md:text-sm rounded-full mb-3">
      Recommended
    </div>
    <div class="flex items-start justify-between mb-4 gap-3">
      <div class="flex gap-2 flex-wrap">
        <span
          v-for="mode in modes"
          :key="mode"
          class="inline-flex items-center justify-center w-8 h-8 rounded-lg"
          :style="{ backgroundColor: modeInfo(mode).soft }"
        >
          <component :is="modeInfo(mode).icon" class="w-4 h-4" :style="{ color: modeInfo(mode).color }" />
        </span>
      </div>
      <div class="text-right flex-shrink-0">
        <div class="text-lg md:text-xl lg:text-2xl font-display text-foreground leading-tight">{{ duration }}</div>
        <div class="text-xs md:text-sm text-muted-foreground">Total time</div>
      </div>
    </div>
    <div :class="['grid gap-3 mb-4', walkingDistance ? 'grid-cols-3' : 'grid-cols-2']">
      <div class="flex items-start gap-1.5">
        <DollarSign class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div class="min-w-0">
          <div class="text-xs text-muted-foreground">Cost</div>
          <div class="font-display text-sm text-foreground truncate">{{ cost }}</div>
        </div>
      </div>
      <div class="flex items-start gap-1.5">
        <MapPin class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <div class="text-xs text-muted-foreground">Transfers</div>
          <div class="font-display text-sm text-foreground">{{ transfers }}</div>
        </div>
      </div>
      <div v-if="walkingDistance" class="flex items-start gap-1.5">
        <TrendingUp class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div class="min-w-0">
          <div class="text-xs text-muted-foreground">Walking</div>
          <div class="font-display text-sm text-foreground truncate">{{ walkingDistance }}</div>
        </div>
      </div>
    </div>
    <div v-if="comfort" class="flex items-center gap-2 text-sm text-muted-foreground">
      Comfort: <span class="text-foreground">{{ comfort }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bus, Car, DollarSign, Footprints, MapPin, Train, TrendingUp, Users } from '@lucide/vue'

defineProps<{
  duration: string
  cost: string
  modes: string[]
  transfers: number
  walkingDistance?: string
  comfort?: string
  recommended?: boolean
}>()

defineEmits<{ select: [] }>()

const modeMap = {
  metro: { icon: Train, color: 'var(--transport-metro)', soft: 'var(--transport-metro-soft)' },
  bus: { icon: Bus, color: 'var(--transport-bus)', soft: 'var(--transport-bus-soft)' },
  microbus: { icon: Users, color: 'var(--transport-microbus)', soft: 'var(--transport-microbus-soft)' },
  walking: { icon: Footprints, color: 'var(--transport-walking)', soft: 'var(--transport-walking-soft)' },
  'ride-hailing': { icon: Car, color: 'var(--transport-ride)', soft: 'var(--transport-ride-soft)' },
}

function modeInfo(mode: string) {
  return modeMap[mode.toLowerCase() as keyof typeof modeMap] ?? { icon: Car, color: 'var(--transport-metro)', soft: 'var(--transport-metro-soft)' }
}
</script>
