<template>
  <div class="flex h-screen overflow-hidden bg-[#FFF7D6]">
    <AdminSidebar :active="activePage" @nav="goToPage" />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Top header -->
      <header
        class="flex-shrink-0 bg-[#111827] text-white border-b border-[#374151]"
      >
        <div class="flex items-center justify-between px-4 md:px-6 py-3 gap-4">
          <div class="min-w-0">
            <h1
              class="text-base md:text-lg font-bold text-white truncate"
              style="font-family: 'DM Sans', sans-serif"
            >
              {{ meta.title }}
            </h1>
            <p class="text-xs text-[#9CA3AF] hidden sm:block truncate">
              {{ meta.sub }}
            </p>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              class="relative p-2 rounded-lg hover:bg-[#1F2937] transition-colors"
            >
              <Bell class="w-5 h-5" />
              <span
                class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FFC400] border border-[#111827]"
              />
            </button>

            <button
              class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1F2937] transition-colors"
            >
              <div
                class="w-7 h-7 rounded-full bg-[#FFC400] flex items-center justify-center text-[#111827] text-xs font-bold flex-shrink-0"
              >
                A
              </div>
              <span class="text-sm font-medium text-white hidden md:block"
                >Admin</span
              >
              <ChevronDown class="w-4 h-4 text-[#6B7280] hidden md:block" />
            </button>

            <button
              @click="logout"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-sm text-[#9CA3AF] hover:text-white"
            >
              <LogOut class="w-4 h-4" />
              <span class="hidden sm:inline">Exit Admin</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto pb-20 lg:pb-0">
        <component :is="currentComponent" @nav="goToPage" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Bell, LogOut, ChevronDown } from '@lucide/vue';
import AdminSidebar from '../components/AdminSidebar.vue';
import AdminDashboardHome from './AdminDashboardHome.vue';
import AdminRoutes from './AdminRoutes.vue';
import AdminStops from './AdminStops.vue';
import AdminTickets from './AdminTickets.vue';
import AdminUsers from './AdminUsers.vue';
import AdminSettings from './AdminSettings.vue';
import { adminLogout } from '../services/adminApi';

const route = useRoute();
const router = useRouter();
const activePage = ref('dashboard');
const validPages = new Set(['dashboard', 'routes', 'stops', 'tickets', 'users', 'settings']);

const PAGE_META: Record<string, { title: string; sub: string }> = {
  dashboard: {
    title: 'Dashboard',
    sub: 'Overview of transport operations',
  },
  routes: {
    title: 'Routes Management',
    sub: 'Create, edit, and manage transport routes',
  },
  stops: {
    title: 'Stops Management',
    sub: 'Create, edit, and manage transport stops',
  },
  tickets: {
    title: 'Tickets Management',
    sub: 'View and manage user bookings',
  },
  users: {
    title: 'Users Management',
    sub: 'View and manage app users',
  },
  settings: {
    title: 'Settings',
    sub: 'Configure app, admin account, and local database',
  },
};

const meta = computed(() => PAGE_META[activePage.value] ?? PAGE_META.dashboard);

watch(
  () => route.params.section,
  (section) => {
    const page = typeof section === 'string' ? section : 'dashboard';
    activePage.value = validPages.has(page) ? page : 'dashboard';
  },
  { immediate: true }
);

function goToPage(page: string) {
  const nextPage = validPages.has(page) ? page : 'dashboard';
  activePage.value = nextPage;
  router.push(nextPage === 'dashboard' ? '/admin' : `/admin/${nextPage}`);
}

async function logout() {
  await adminLogout();
  router.push('/admin/login');
}

const currentComponent = computed(() => {
  switch (activePage.value) {
    case 'dashboard':
      return AdminDashboardHome;
    case 'routes':
      return AdminRoutes;
    case 'stops':
      return AdminStops;
    case 'tickets':
      return AdminTickets;
    case 'users':
      return AdminUsers;
    case 'settings':
      return AdminSettings;
    default:
      return AdminDashboardHome;
  }
});
</script>
