<template>
  <nav class="mx-auto mb-5 flex w-full max-w-5xl items-center gap-2 overflow-x-auto rounded-lg border border-border bg-card p-2 shadow-sm" aria-label="Operator navigation">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="tap-target inline-flex min-w-fit items-center justify-center rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-surface-hover"
      active-class="bg-surface-dark text-white"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const items = computed(() => [
  { to: "/dashboard", label: t("common.dashboard") },
  { to: "/scan", label: t("common.scan") },
  { to: "/history", label: t("common.history") },
  { to: "/sync", label: t("common.sync") },
  { to: "/shift-summary", label: t("common.summary") },
  { to: "/account", label: t("common.account") }
]);
</script>
