<template>
  <section :class="partial ? 'border-dashed' : ''" class="min-h-40">
    <slot v-if="state === 'ready'" />

    <slot v-else-if="state === 'loading'" name="loading">
      <div class="grid min-h-64 place-items-center text-center">
        <div>
          <div class="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-primary-soft border-t-primary" aria-hidden="true" />
          <h2 class="text-xl font-bold">{{ title ?? $t("stateView.loading.headline") }}</h2>
          <p class="mt-2 text-muted-foreground">{{ support ?? $t("stateView.loading.support") }}</p>
        </div>
      </div>
    </slot>

    <slot v-else-if="state === 'empty'" name="empty">
      <div class="grid min-h-64 place-items-center text-center">
        <div class="max-w-sm">
          <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-lg bg-muted text-3xl" aria-hidden="true">-</div>
          <h2 class="text-xl font-bold">{{ title ?? $t("stateView.empty.headline") }}</h2>
          <p class="mt-2 text-muted-foreground">{{ support ?? $t("stateView.empty.support") }}</p>
          <slot name="action" />
        </div>
      </div>
    </slot>

    <slot v-else name="error">
      <div class="grid min-h-64 place-items-center text-center">
        <div class="max-w-sm">
          <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-lg bg-danger-soft text-3xl text-destructive" aria-hidden="true">!</div>
          <h2 class="text-xl font-bold">{{ title ?? $t("stateView.error.headline") }}</h2>
          <p class="mt-2 text-muted-foreground">{{ support ?? $t("stateView.error.support") }}</p>
          <slot name="action" />
        </div>
      </div>
    </slot>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    state: "loading" | "empty" | "error" | "ready";
    partial?: boolean;
    title?: string;
    support?: string;
  }>(),
  { partial: false, title: undefined, support: undefined }
);
</script>
