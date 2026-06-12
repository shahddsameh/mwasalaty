<template>
  <button :class="buttonClass" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "danger" | "warning" | "slate";
    size?: "sm" | "md" | "lg" | "xl";
  }>(),
  { variant: "primary", size: "md" }
);

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
  ghost: "text-foreground hover:bg-surface-hover active:bg-surface-pressed",
  outline: "border border-primary text-foreground bg-secondary hover:bg-primary-soft",
  secondary: "text-foreground border border-border bg-card hover:bg-secondary active:bg-muted",
  success: "bg-success text-success-foreground hover:bg-success-hover active:bg-success-active",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active",
  warning: "bg-warning text-white hover:bg-primary-hover active:bg-primary-hover",
  slate: "bg-slate-700 text-white hover:bg-slate-800 active:bg-slate-900"
};

const sizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-5 py-3 text-lg",
  xl: "px-6 py-4 text-xl"
};

const buttonClass = computed(
  () =>
    `tap-target inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-50 ${variants[props.variant]} ${sizes[props.size]}`
);
</script>
