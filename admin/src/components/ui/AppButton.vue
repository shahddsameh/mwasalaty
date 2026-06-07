<template><button :class="classes" v-bind="$attrs"><slot /></button></template>
<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ variant?: "primary" | "secondary" | "danger" | "ghost" }>(), { variant: "primary" });
const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "border border-border bg-card hover:bg-secondary",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  ghost: "hover:bg-secondary"
};
const classes = computed(() => `focus-ring inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 font-bold transition ${variants[props.variant]}`);
</script>
