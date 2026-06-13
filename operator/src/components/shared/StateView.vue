<template>
  <section :class="partial ? 'border-dashed' : ''" class="min-h-40">
    <slot v-if="state === 'ready'" />

    <slot v-else-if="state === 'loading'" name="loading">
      <div class="empty-state min-h-64">
        <div>
          <div class="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-primary-soft border-t-primary" aria-hidden="true" />
          <h2 class="text-xl font-bold">{{ title ?? $t("stateView.loading.headline") }}</h2>
          <p class="mt-2 text-muted-foreground">{{ support ?? $t("stateView.loading.support") }}</p>
        </div>
      </div>
    </slot>

    <slot v-else-if="state === 'empty'" name="empty">
      <div class="empty-state min-h-64">
        <div class="max-w-sm">
          <div class="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-primary-soft text-primary-hover" aria-hidden="true">
            <AppIcon name="history" class="h-9 w-9" />
          </div>
          <h2 class="text-xl font-bold">{{ title ?? $t("stateView.empty.headline") }}</h2>
          <p class="mt-2 text-muted-foreground">{{ support ?? $t("stateView.empty.support") }}</p>
          <slot name="action" />
        </div>
      </div>
    </slot>

    <slot v-else name="error">
      <div class="empty-state min-h-64">
        <div class="max-w-sm">
          <div class="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-danger-soft text-destructive" aria-hidden="true">
            <AppIcon name="warning" class="h-9 w-9" />
          </div>
          <h2 class="text-xl font-bold">{{ title ?? $t("stateView.error.headline") }}</h2>
          <p class="mt-2 text-muted-foreground">{{ support ?? $t("stateView.error.support") }}</p>
          <slot name="action" />
        </div>
      </div>
    </slot>
  </section>
</template>

<script setup lang="ts">
import AppIcon from "@/components/ui/AppIcon.vue";

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
