<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6"
  >
    <Card>
      <div class="p-8 text-center">
        <MapPin class="w-16 h-16 text-[#6B7280] mx-auto mb-4" />
        <h2
          class="text-xl font-bold text-[#2B2A27] mb-2"
          style="font-family: 'DM Sans', sans-serif"
        >
          Stops Management
        </h2>
        <p class="text-sm text-[#6B7280] mb-4">
          Create, edit, and manage transport stops
        </p>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFC400] text-[#111827] text-sm font-semibold hover:bg-[#FFD633] transition-colors mx-auto"
        >
          <Plus class="w-4 h-4" /> Add Stop
        </button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { MapPin, Plus } from '@lucide/vue';
import { Card } from '../components/AdminShared.vue';
</script>
