<template>
  <nav
    class="bottom-nav-safe fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card shadow-[0_-2px_12px_rgba(15,23,42,0.08)] md:static md:mx-auto md:mb-5 md:w-full md:max-w-5xl md:rounded-lg md:border md:p-2 md:shadow-sm"
    aria-label="Operator navigation"
  >
    <ul class="mx-auto flex w-full max-w-5xl items-stretch md:items-center md:gap-1">
      <li v-for="item in items" :key="item.to" class="flex-1">
        <RouterLink
          :to="item.to"
          class="tap-target flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-muted-foreground transition-colors hover:text-foreground md:flex-row md:gap-2 md:rounded-lg md:px-3 md:py-2 md:hover:bg-surface-hover"
          active-class="text-primary"
        >
          <svg
            class="h-6 w-6 md:h-5 md:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="icons[item.icon]" />
          </svg>
          <span class="text-[0.7rem] font-bold leading-none md:text-sm">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const icons: Record<string, string> = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 13h7v7H4z",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4M12 7v5l3 2",
  sync: "M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M3 20v-4h4",
  summary: "M9 4h6a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v0a1 1 0 0 1 1-1zM7 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M9 13v3M12 11v5M15 14v2",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0"
};

const items = computed(() => [
  { to: "/dashboard", label: t("common.dashboard"), icon: "dashboard" },
  { to: "/scan", label: t("common.scan"), icon: "scan" },
  { to: "/history", label: t("common.history"), icon: "history" },
  { to: "/sync", label: t("common.sync"), icon: "sync" },
  { to: "/shift-summary", label: t("common.summary"), icon: "summary" },
  { to: "/account", label: t("common.account"), icon: "account" }
]);
</script>
