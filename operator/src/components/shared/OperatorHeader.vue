<template>
  <header class="operator-hero">
    <div class="operator-hero__glow" aria-hidden="true" />
    <div class="relative flex flex-wrap items-start justify-between gap-5">
      <div class="min-w-0 flex-1">
        <div class="mb-4 flex items-center gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-contrast shadow-[0_8px_24px_rgba(234,179,8,0.28)]">
            <AppIcon :name="icon" class="h-6 w-6" />
          </span>
          <div>
            <p class="text-xs font-black uppercase tracking-[0.16em] text-primary">{{ eyebrow }}</p>
            <p class="mt-1 text-xs font-semibold text-surface-dark-foreground/70">{{ $t("common.appName") }}</p>
          </div>
        </div>
        <h1 class="max-w-3xl text-2xl font-black leading-tight text-surface-dark-foreground sm:text-3xl md:text-4xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-2 max-w-2xl text-sm font-medium leading-6 text-surface-dark-foreground/70 sm:text-base">{{ subtitle }}</p>
      </div>

      <div v-if="status || meta" class="flex shrink-0 flex-col items-end gap-2">
        <span v-if="status" class="inline-flex items-center gap-2 rounded-full border border-surface-dark-border bg-surface-dark-foreground/10 px-3 py-1.5 text-xs font-bold text-surface-dark-foreground backdrop-blur">
          <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]" />
          {{ status }}
        </span>
        <span v-if="meta" class="text-xs font-semibold text-surface-dark-foreground/60">{{ meta }}</span>
      </div>
    </div>
    <slot />
  </header>
</template>

<script setup lang="ts">
import AppIcon from "@/components/ui/AppIcon.vue";

withDefaults(defineProps<{
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: string;
  meta?: string;
  icon?: "dashboard" | "scan" | "history" | "sync" | "summary" | "account" | "route";
}>(), {
  subtitle: undefined,
  status: undefined,
  meta: undefined,
  icon: "route"
});
</script>
