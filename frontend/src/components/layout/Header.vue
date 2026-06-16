<template>
  <header
    class="w-full bg-sidebar text-sidebar-foreground border-b border-sidebar-border"
  >
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-3">
      <div class="flex items-center justify-between">
        <RouterLink
          to="/"
          dir="ltr"
          class="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            :src="mwasalatyLogo"
            alt="Mwasalaty logo"
            class="h-10 md:h-12 w-auto object-contain"
          />

          <span
            class="font-display text-xl md:text-2xl font-bold leading-none -ms-2 md:-ms-3"
          >
            wasalaty
          </span>
        </RouterLink>

        <RouterLink
          to="/settings"
          class="block lg:hidden"
          :class="iconClass('/settings')"
          :title="t('nav.settings')"
        >
          <Settings class="w-5 h-5" />
        </RouterLink>

        <nav class="hidden lg:flex items-center gap-2">
          <RouterLink
            v-for="item in desktopLinks"
            :key="item.to"
            :to="item.to"
            :class="desktopClass(item.to)"
          >
            <component
              v-if="item.icon"
              :is="item.icon"
              class="w-4 h-4 me-1.5"
            />
            {{ t(item.labelKey) }}
          </RouterLink>

          <div class="w-px h-6 bg-sidebar-border mx-1" />

          <button
            type="button"
            class="px-3 py-2 rounded-lg transition-colors text-sm hover:bg-sidebar-accent"
            @click="toggleLanguage"
          >
            {{ t("language.toggle") }}
          </button>

          <button
            type="button"
            class="rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            :aria-label="
              theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')
            "
            :title="
              theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')
            "
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'dark'" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>

          <RouterLink
            :to="isAuthenticated ? '/profile' : '/auth'"
            :class="
              isAuthenticated
                ? iconClass('/profile')
                : [
                    'ms-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2 text-sm font-medium',
                  ]
            "
            :title="isAuthenticated ? t('nav.profile') : t('nav.login')"
          >
            <User v-if="isAuthenticated" class="w-5 h-5" />
            <LogIn v-else class="w-4 h-4" />
            <span v-if="!isAuthenticated">{{ t("nav.login") }}</span>
          </RouterLink>

          <RouterLink
            to="/settings"
            :class="iconClass('/settings')"
            :title="t('nav.settings')"
          >
            <Settings class="w-5 h-5" />
          </RouterLink>
        </nav>
      </div>

      <nav
        class="lg:hidden fixed bottom-0 z-50 bg-sidebar border-t border-sidebar-border px-2 py-2"
        style="inset-inline-start: 0; inset-inline-end: 0"
      >
        <div class="flex items-center justify-around">
          <RouterLink
            v-for="item in mobileLinks"
            :key="item.to"
            :to="item.to"
            :class="mobileClass(item.to)"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ t(item.labelKey) }}</span>
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";
import {
  BookmarkCheck,
  LogIn,
  MapPin,
  Moon,
  Settings,
  Sun,
  Ticket,
  User,
} from "@lucide/vue";

import mwasalatyLogo from "@/assets/mwasalaty-lightlogo1.png";

import { setI18nLanguage } from "@/i18n";
import { useAuthState } from "@/services/authState";
import { changeLanguage, type AppLanguage } from "@/services/language";
import { applyTheme, getSavedTheme, type AppTheme } from "@/services/theme";

const route = useRoute();
const { locale, t } = useI18n();
const { isAuthenticated } = useAuthState();

const theme = ref<AppTheme>(getSavedTheme());

const currentPath = computed(() => route.path);
const active = (path: string) => currentPath.value === path;

const desktopLinks = computed(() => [
  { to: "/", labelKey: "nav.routePlanner", icon: MapPin },
  ...(isAuthenticated.value
    ? [
        { to: "/saved", labelKey: "nav.saved", icon: BookmarkCheck },
        { to: "/all-tickets", labelKey: "nav.allTickets", icon: Ticket },
      ]
    : []),
]);

const mobileLinks = computed(() => [
  { to: "/", labelKey: "nav.routePlanner", icon: MapPin },
  ...(isAuthenticated.value
    ? [
        { to: "/saved", labelKey: "nav.saved", icon: BookmarkCheck },
        { to: "/all-tickets", labelKey: "nav.tickets", icon: Ticket },
      ]
    : []),
  isAuthenticated.value
    ? { to: "/profile", labelKey: "nav.profile", icon: User }
    : { to: "/auth", labelKey: "nav.login", icon: LogIn },
]);

async function toggleLanguage() {
  const nextLanguage: AppLanguage = locale.value === "ar" ? "en" : "ar";

  setI18nLanguage(nextLanguage);
  await changeLanguage(nextLanguage);
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
}

watch(
  () => route.fullPath,
  () => {
    theme.value = getSavedTheme();
  },
);

function desktopClass(path: string) {
  return [
    "px-3 py-2 rounded-lg transition-colors text-sm flex items-center",
    active(path)
      ? "bg-primary text-primary-foreground font-medium"
      : "hover:bg-sidebar-accent",
  ];
}

function iconClass(path: string) {
  return [
    "p-2 rounded-lg transition-colors",
    active(path)
      ? "bg-primary text-primary-foreground"
      : "hover:bg-sidebar-accent",
  ];
}

function mobileClass(path: string) {
  return [
    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs",
    active(path)
      ? "text-primary"
      : "text-sidebar-foreground hover:text-primary",
  ];
}
</script>
