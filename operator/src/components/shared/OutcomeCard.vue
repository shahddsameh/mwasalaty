<template>
  <article :class="toneClasses" class="outcome-card">
    <span class="outcome-card__icon">
      <AppIcon :name="icon" class="h-6 w-6" />
    </span>
    <div>
      <p class="text-xs font-medium text-muted-foreground sm:text-sm">{{ label }}</p>
      <strong class="mt-1 block text-2xl font-semibold leading-none text-foreground sm:text-3xl">{{ value }}</strong>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { Outcome } from "@/services/outcome";

const props = defineProps<{ outcome: Outcome; label: string; value: number }>();

const map = {
  valid: { classes: "outcome-card--success", icon: "successBadge" },
  already_used: { classes: "outcome-card--warning", icon: "usedTicket" },
  invalid: { classes: "outcome-card--danger", icon: "errorCircle" },
  no_match: { classes: "outcome-card--neutral", icon: "routeMismatch" },
  ambiguous: { classes: "outcome-card--primary", icon: "helpCircle" },
  unverified: { classes: "outcome-card--slate", icon: "unverifiedStatus" }
} as const;

const toneClasses = computed(() => map[props.outcome].classes);
const icon = computed(() => map[props.outcome].icon);
</script>
