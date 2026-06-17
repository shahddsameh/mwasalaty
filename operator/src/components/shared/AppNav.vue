<template>
  <header
    class="w-full bg-sidebar text-sidebar-foreground border border-sidebar-border rounded-xl p-3 mb-5 flex items-center justify-between md:static md:mx-auto md:max-w-5xl md:rounded-lg md:p-3"
  >
    <div class="flex w-full items-center justify-between">
      <!-- Logo and App Name -->
      <RouterLink
        to="/dashboard"
        dir="ltr"
        class="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity"
      >
        <img
          :src="mwasalatyLogo"
          alt="Mwasalaty logo"
          class="h-8 md:h-10 w-auto object-contain"
        />
        <span
          class="font-display text-xl md:text-2xl font-bold leading-none -ms-1.5 md:-ms-2"
        >
          wasalaty
        </span>
      </RouterLink>

      <!-- Mobile Account Link (hidden on desktop) -->
      <RouterLink
        to="/account"
        class="block md:hidden"
        :class="iconClass('/account')"
        :title="t('common.account')"
      >
        <AppIcon name="account" class="w-5 h-5 flex-shrink-0" />
      </RouterLink>

      <!-- Desktop Nav Links (hidden on mobile) -->
      <nav class="hidden md:flex items-center gap-2">
        <RouterLink
          v-for="item in desktopItems"
          :key="item.to"
          :to="item.to"
          :class="desktopClass(item.to)"
        >
          <AppIcon :name="item.icon" class="w-4 h-4 me-1.5 flex-shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <!-- Mobile Fixed Bottom Nav (hidden on desktop) -->
    <nav
      class="md:hidden fixed bottom-0 z-[9999] bg-sidebar border-t border-sidebar-border px-2 py-2"
      style="inset-inline-start: 0; inset-inline-end: 0"
    >
      <div class="flex items-center justify-around">
        <RouterLink
          v-for="item in mobileItems"
          :key="item.to"
          :to="item.to"
          :class="mobileClass(item.to)"
        >
          <AppIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span
            class="max-w-full truncate text-[0.65rem] font-medium leading-tight sm:text-[0.75rem]"
            >{{ item.label }}</span
          >
        </RouterLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { AppIconName } from "@/components/ui/AppIcon.vue";
import mwasalatyLogo from "@/assets/mwasalaty-lightlogo1.png";

const route = useRoute();
const { t } = useI18n();

const currentPath = computed(() => route.path);
const active = (path: string) => currentPath.value === path;

const desktopItems = computed<Array<{ to: string; label: string; icon: AppIconName }>>(
  () => [
    { to: "/dashboard", label: t("common.dashboard"), icon: "dashboard" },
    { to: "/scan", label: t("common.scan"), icon: "scan" },
    { to: "/history", label: t("common.history"), icon: "history" },
    { to: "/sync", label: t("common.sync"), icon: "sync" },
    { to: "/shift-summary", label: t("common.summary"), icon: "summary" },
    { to: "/account", label: t("common.account"), icon: "account" },
  ],
);

const mobileItems = computed<Array<{ to: string; label: string; icon: AppIconName }>>(
  () => [
    { to: "/dashboard", label: t("common.dashboard"), icon: "dashboard" },
    { to: "/scan", label: t("common.scan"), icon: "scan" },
    { to: "/history", label: t("common.history"), icon: "history" },
    { to: "/sync", label: t("common.sync"), icon: "sync" },
    { to: "/shift-summary", label: t("common.summary"), icon: "summary" },
  ],
);

function desktopClass(path: string) {
  return [
    "px-3 py-2 rounded-lg transition-colors text-sm flex items-center",
    active(path)
      ? "bg-primary text-primary-foreground font-medium"
      : "hover:bg-sidebar-accent text-sidebar-foreground",
  ];
}

function iconClass(path: string) {
  return [
    "p-2 rounded-lg transition-colors",
    active(path)
      ? "bg-primary text-primary-foreground"
      : "hover:bg-sidebar-accent text-sidebar-foreground",
  ];
}

function mobileClass(path: string) {
  return [
    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs",
    active(path)
      ? "text-primary font-medium"
      : "text-sidebar-foreground hover:text-primary",
  ];
}
</script>
