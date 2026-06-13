<template>
  <nav
    class="operator-nav bottom-nav-safe fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-1 shadow-sm backdrop-blur-xl md:static md:mx-auto md:mb-5 md:w-full md:max-w-5xl md:rounded-2xl md:border md:p-2"
    aria-label="Operator navigation"
  >
    <ul class="mx-auto flex w-full max-w-5xl items-stretch md:items-center md:gap-1">
      <li v-for="item in items" :key="item.to" class="flex-1">
        <RouterLink
          :to="item.to"
          class="operator-nav-link group tap-target relative flex h-full flex-col items-center justify-center gap-1 px-0.5 py-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:flex-row md:gap-2 md:rounded-xl md:px-3 md:py-2.5"
          active-class="operator-nav-active"
        >
          <AppIcon :name="item.icon" class="h-5 w-5" />
          <span class="max-w-full truncate text-[0.62rem] font-medium leading-none sm:text-[0.7rem] md:text-sm">{{ item.label }}</span>
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
  color: var(--foreground);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
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

@media (min-width: 768px) {
  .operator-nav-active::before {
    inset-block: 25%;
    inset-inline-start: 0;
    inset-inline-end: auto;
    width: 3px;
    height: auto;
  }
}
</style>
