<template>
  <header
    class="w-full bg-sidebar text-sidebar-foreground border-b border-sidebar-border"
  >
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-3">
      <div class="flex items-center justify-between">
        <RouterLink
          to="/"
          class="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
        >
          <div
            class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center"
          >
            <MapPin class="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <span class="font-display text-xl md:text-xl font-bold"
            >Mwasalaty</span
          >
        </RouterLink>

        <nav class="hidden lg:flex items-center gap-2">
          <RouterLink
            v-for="item in desktopLinks"
            :key="item.to"
            :to="item.to"
            :class="desktopClass(item.to)"
          >
            <component v-if="item.icon" :is="item.icon" class="w-4 h-4" />
            {{ item.label }}
          </RouterLink>
          <div class="w-px h-6 bg-sidebar-border mx-1" />
          <RouterLink
            to="/profile"
            :class="iconClass('/profile')"
            title="Profile"
            ><User class="w-5 h-5"
          /></RouterLink>
          <RouterLink
            to="/settings"
            :class="iconClass('/settings')"
            title="Settings"
            ><Settings class="w-5 h-5"
          /></RouterLink>
          <RouterLink
            to="/auth"
            class="ml-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <LogIn class="w-4 h-4" />
            Login
          </RouterLink>
        </nav>
      </div>

      <nav
        class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border px-2 py-2"
      >
        <div class="flex items-center justify-around">
          <RouterLink
            v-for="item in mobileLinks"
            :key="item.to"
            :to="item.to"
            :class="mobileClass(item.to)"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  BookmarkCheck,
  Brain,
  LogIn,
  MapPin,
  Settings,
  Ticket,
  User,
} from "@lucide/vue";

const route = useRoute();
const currentPath = computed(() => route.path);
const active = (path: string) => currentPath.value === path;

const desktopLinks = [
  { to: "/", label: "Route Planner" },
  { to: "/ai-trip-planner", label: "AI Trip Planner", icon: Brain },
  { to: "/saved", label: "Saved", icon: BookmarkCheck },
  { to: "/all-tickets", label: "All Tickets", icon: Ticket },
];

const mobileLinks = [
  { to: "/", label: "Routes", icon: MapPin },
  { to: "/ai-trip-planner", label: "AI Trip", icon: Brain },
  { to: "/saved", label: "Saved", icon: BookmarkCheck },
  { to: "/all-tickets", label: "Tickets", icon: Ticket },
  { to: "/profile", label: "Profile", icon: User },
];

function desktopClass(path: string) {
  return [
    "px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-1.5",
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
