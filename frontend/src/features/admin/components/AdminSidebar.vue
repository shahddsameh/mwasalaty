<template>
  <aside
    class="hidden lg:flex flex-col w-64 xl:w-72 bg-[#111827] text-white border-r border-[#374151] flex-shrink-0"
  >
    <!-- Logo -->
    <div class="px-6 py-6 border-b border-[#374151]">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-[#FFC400] flex items-center justify-center text-[#111827] text-xl font-bold"
        >
          M
        </div>
        <div>
          <p
            class="text-lg font-bold text-white"
            style="font-family: &quot;DM Sans&quot;, sans-serif"
          >
            Mwaslaty
          </p>
          <p class="text-xs text-[#6B7280]">Admin Panel</p>
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
              ? 'bg-[#FFC400] text-[#111827]'
              : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-white',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-[#374151]">
      <p class="text-xs text-[#6B7280]">Mwaslaty Admin v1.0.0</p>
      <p class="text-xs text-[#4B5563] mt-0.5">Cairo Transport System</p>
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
