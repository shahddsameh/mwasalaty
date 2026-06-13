<template>
  <nav
    class="operator-nav bottom-nav-safe fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-1 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl md:static md:mx-auto md:mb-5 md:w-full md:max-w-5xl md:rounded-2xl md:border md:p-2 md:shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
    aria-label="Operator navigation"
  >
    <ul class="mx-auto flex w-full max-w-5xl items-stretch md:items-center md:gap-1">
      <li v-for="item in items" :key="item.to" class="flex-1">
        <RouterLink
          :to="item.to"
          class="operator-nav-link group tap-target relative flex h-full flex-col items-center justify-center gap-1 px-0.5 py-2 text-muted-foreground transition-all hover:text-foreground md:flex-row md:gap-2 md:rounded-xl md:px-3 md:py-2.5 md:hover:bg-secondary"
          active-class="operator-nav-active"
        >
          <AppIcon :name="item.icon" class="h-5 w-5 transition-transform group-hover:-translate-y-0.5 md:h-5 md:w-5" />
          <span class="max-w-full truncate text-[0.62rem] font-extrabold leading-none sm:text-[0.7rem] md:text-sm">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { AppIconName } from "@/components/ui/AppIcon.vue";

const { t } = useI18n();

const items = computed<Array<{ to: string; label: string; icon: AppIconName }>>(() => [
  { to: "/dashboard", label: t("common.dashboard"), icon: "dashboard" },
  { to: "/scan", label: t("common.scan"), icon: "scan" },
  { to: "/history", label: t("common.history"), icon: "history" },
  { to: "/sync", label: t("common.sync"), icon: "sync" },
  { to: "/shift-summary", label: t("common.summary"), icon: "summary" },
  { to: "/account", label: t("common.account"), icon: "account" }
]);
</script>

<style scoped>
.operator-nav-active {
  color: var(--primary-contrast);
}

.operator-nav-active::before {
  content: "";
  position: absolute;
  inset-inline: 18%;
  top: 0;
  height: 3px;
  border-radius: 999px;
  background: var(--primary);
}

@media (max-width: 767px) {
  :global(.dark .operator-nav) {
    border-color: var(--border);
    background: color-mix(in srgb, var(--card) 95%, transparent);
    box-shadow: 0 -10px 30px rgba(2, 6, 23, 0.42);
  }

  :global(.dark .operator-nav-link) {
    color: var(--muted-foreground);
  }

  :global(.dark .operator-nav-link:hover) {
    color: var(--foreground);
    background: var(--surface-hover);
  }

  :global(.dark .operator-nav-link:focus-visible) {
    color: var(--foreground);
    background: var(--surface-hover);
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }

  :global(.dark .operator-nav-active),
  :global(.dark .operator-nav-active:hover),
  :global(.dark .operator-nav-active:focus-visible) {
    color: var(--primary) !important;
    background: color-mix(in srgb, var(--primary) 12%, transparent) !important;
  }

  :global(.dark .operator-nav-active::before) {
    background: var(--primary);
    box-shadow: 0 0 12px color-mix(in srgb, var(--primary) 50%, transparent);
  }
}

@media (min-width: 768px) {
  .operator-nav-active {
    background: var(--primary-soft);
  }

  :global(.dark .operator-nav) {
    border-color: var(--border);
    background: var(--card);
    box-shadow: 0 14px 36px rgba(2, 6, 23, 0.38);
  }

  :global(.dark .operator-nav-link) {
    color: var(--muted-foreground);
  }

  :global(.dark .operator-nav-link:hover) {
    color: var(--foreground);
    background: var(--surface-hover);
  }

  :global(.dark .operator-nav-link:focus-visible) {
    color: var(--foreground);
    background: var(--surface-hover);
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  :global(.dark .operator-nav-active),
  :global(.dark .operator-nav-active:hover),
  :global(.dark .operator-nav-active:focus-visible) {
    color: var(--primary-contrast) !important;
    background: var(--primary) !important;
    box-shadow: 0 8px 20px rgba(234, 179, 8, 0.24);
  }

  :global(.dark .operator-nav-active::before) {
    background: var(--primary-contrast);
  }

  .operator-nav-active::before {
    inset-block: 25%;
    inset-inline-start: 0;
    inset-inline-end: auto;
    width: 3px;
    height: auto;
  }
}
</style>
