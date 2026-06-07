<template>
  <section>
    <slot v-if="state === 'ready'" />
    <div v-else class="admin-panel grid min-h-64 place-items-center p-8 text-center">
      <div>
        <div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-secondary text-2xl">{{ state === "error" ? "!" : state === "empty" ? "0" : "..." }}</div>
        <h2 class="text-2xl font-bold">{{ title ?? $t(`stateView.${state}.headline`) }}</h2>
        <p class="mt-2 text-muted-foreground">{{ support ?? $t(`stateView.${state}.support`) }}</p>
        <slot name="action" />
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ state: "loading" | "empty" | "error" | "ready"; title?: string; support?: string }>(), { title: undefined, support: undefined });
</script>
