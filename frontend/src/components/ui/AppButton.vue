<template>
  <button :class="buttonClass" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?:
      | "primary"
      | "secondary"
      | "outline"
      | "ghost"
      | "success"
      | "danger";
    size?: "sm" | "md" | "lg";
  }>(),
  { variant: "primary", size: "md" },
);

const variants = {
  primary:
    "bg-primary text-button-primary-text hover:bg-button-hover active:bg-primary-hover",
  ghost: "text-foreground hover:bg-surface-hover active:bg-surface-pressed",
  outline:
    "border-2 border-primary text-foreground bg-secondary hover:bg-primary-soft",
  secondary:
    "text-foreground border-2 border-border bg-muted hover:bg-secondary active:bg-muted",
  success:
    "bg-success text-success-foreground hover:bg-success-hover active:bg-success-active",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const buttonClass = computed(
  () =>
    `rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[props.variant]} ${sizes[props.size]}`,
);
</script>
