<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6"
  >
    <Card>
      <div class="p-8 text-center">
        <Settings class="w-16 h-16 text-[#6B7280] mx-auto mb-4" />
        <h2
          class="text-xl font-bold text-[#2B2A27] mb-2"
          style="font-family: 'DM Sans', sans-serif"
        >
          Settings
        </h2>
        <p class="text-sm text-[#6B7280]">
          Configure app, admin account, and local database
        </p>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Settings } from '@lucide/vue';
import { Card } from '../components/AdminShared.vue';
</script>
