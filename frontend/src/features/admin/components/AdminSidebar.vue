<template>
  <aside
    class="hidden lg:flex flex-col w-64 xl:w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-shrink-0"
  >
    <!-- Logo -->
    <div class="px-6 py-6 border-b border-sidebar-border">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-[#FFC400] flex items-center justify-center text-[#ffffff] text-xl font-bold"
        >
          M
        </div>
        <div>
          <p
            class="text-lg font-bold text-sidebar-foreground"
            style="font-family: &quot;DM Sans&quot;, sans-serif"
          >
            Mwaslaty
          </p>
          <p class="text-xs text-sidebar-foreground/60">Admin Panel</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <div class="space-y-1">
        <button
          v-for="item in navItems"
          :key="item.page"
          @click="$emit('nav', item.page)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
            active === item.page
              ? 'bg-sidebar-primary text-[#ffffff] shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-sidebar-border">
      <p class="text-xs text-sidebar-foreground/60">Mwaslaty Admin v1.0.0</p>
      <p class="text-xs text-sidebar-foreground/45 mt-0.5">
        Cairo Transport System
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  Route as RouteIcon,
  MapPin,
  Ticket,
  Users,
  Settings,
  MessageCircle,
} from "@lucide/vue";

defineProps<{
  active: string;
}>();

defineEmits<{
  nav: [page: string];
}>();

const navItems = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "routes", label: "Routes", icon: RouteIcon },
  { page: "stops", label: "Stops", icon: MapPin },
  { page: "tickets", label: "Tickets", icon: Ticket },
  { page: "users", label: "Users", icon: Users },
  { page: "support", label: "Support", icon: MessageCircle },
  { page: "settings", label: "Settings", icon: Settings },
];
</script>
