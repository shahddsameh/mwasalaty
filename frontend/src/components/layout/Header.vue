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

        <RouterLink
          to="/settings"
          class="block lg:hidden"
          :class="iconClass('/settings')"
          title="Settings"
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
            <component v-if="item.icon" :is="item.icon" class="w-4 h-4" />
            {{ item.label }}
          </RouterLink>
          <div class="w-px h-6 bg-sidebar-border mx-1" />
          <RouterLink
            :to="isAuthenticated ? '/profile' : '/auth'"
            :class="
              isAuthenticated
                ? iconClass('/profile')
                : [
                    'ml-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2 text-sm font-medium',
                  ]
            "
            :title="isAuthenticated ? 'Profile' : 'Login'"
          >
            <User v-if="isAuthenticated" class="w-5 h-5" />
            <LogIn v-else class="w-4 h-4" />
            <span v-if="!isAuthenticated">Login</span>
          </RouterLink>
          <RouterLink
            to="/settings"
            :class="iconClass('/settings')"
            title="Settings"
          >
            <Settings class="w-5 h-5" />
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
import { useAuthState } from "@/services/authState";

const route = useRoute();
const { isAuthenticated } = useAuthState();
const currentPath = computed(() => route.path);
const active = (path: string) => currentPath.value === path;

const desktopLinks = [
  { to: "/", label: "Route Planner" },
  { to: "/ai-trip-planner", label: "AI Trip Planner", icon: Brain },
  { to: "/saved", label: "Saved", icon: BookmarkCheck },
  { to: "/all-tickets", label: "All Tickets", icon: Ticket },
];

const mobileLinks = computed(() => [
  { to: "/", label: "Routes", icon: MapPin },
  { to: "/ai-trip-planner", label: "AI Trip", icon: Brain },
  { to: "/saved", label: "Saved", icon: BookmarkCheck },
  { to: "/all-tickets", label: "Tickets", icon: Ticket },
  isAuthenticated.value
    ? { to: "/profile", label: "Profile", icon: User }
    : { to: "/auth", label: "Login", icon: LogIn },
]);

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
