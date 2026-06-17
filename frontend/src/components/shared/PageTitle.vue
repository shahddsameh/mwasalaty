<template>
  <section class="mb-6 md:mb-8">
    <h1
      class="font-display text-xl lg:text-2xl text-foreground mb-2 md:mb-3 flex items-center gap-3"
    >
      <slot name="icon"
        ><Sparkles v-if="sparkles" class="w-9 h-9 md:w-11 md:h-11 text-primary"
      /></slot>
      <span>{{ title }}</span>
    </h1>
    <p
      v-if="subtitle"
      class="text-sm md:text-base lg:text-lg text-muted-foreground"
    >
      {{ subtitle }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { Sparkles } from "@lucide/vue";

withDefaults(
  defineProps<{ title: string; subtitle?: string; sparkles?: boolean }>(),
  { sparkles: true },
);
</script>
