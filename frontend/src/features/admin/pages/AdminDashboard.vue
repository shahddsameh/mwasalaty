<template>
  <div class="admin-theme flex h-screen overflow-hidden bg-background text-foreground">
    <AdminSidebar :active="activePage" @nav="goToPage" />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Top header -->
      <header
        class="flex-shrink-0 border-b border-border bg-card text-card-foreground"
      >
        <div class="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 gap-2 sm:gap-4">
          <button
            type="button"
            class="hidden md:block lg:hidden rounded-lg border border-border bg-muted p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Open admin menu"
            title="Open admin menu"
            @click="mobileSidebarOpen = true"
          >
            <Menu class="h-5 w-5" />
          </button>

          <div class="min-w-0 flex-1">
            <h1
              class="text-base md:text-lg font-bold text-white truncate sm:whitespace-normal"
              style="font-family: &quot;DM Sans&quot;, sans-serif"
            >
              {{ pageTitle }}
            </h1>
            <p class="text-xs text-[#9CA3AF] hidden sm:block truncate">
              {{ meta.sub }}
            </p>
          </div>

          <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              class="rounded-lg border border-border bg-muted p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleTheme"
            >
              <Sun v-if="theme === 'dark'" class="h-5 w-5" />
              <Moon v-else class="h-5 w-5" />
            </button>

            <div ref="notificationMenuRef" class="relative">
              <button
                class="relative p-2 rounded-lg hover:bg-[#1F2937] transition-colors"
                type="button"
                @click="toggleNotifications"
              >
                <Bell class="w-5 h-5" />
                <span
                  v-if="unreadCount > 0"
                  class="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[#FFC400] px-1.5 text-[11px] font-bold leading-5 text-[#111827] ring-2 ring-[#111827]"
                >
                  {{ unreadCount > 9 ? "9+" : unreadCount }}
                </span>
              </button>

              <div
                v-if="notificationsOpen"
                class="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-16 md:top-11 z-50 w-auto md:w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B] shadow-2xl"
              >
                <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div>
                    <h2 class="text-sm font-bold text-[#F8FAFC]">Notifications</h2>
                    <p class="text-xs text-[#94A3B8]">Recent support tickets</p>
                  </div>
                  <span
                    v-if="unreadCount > 0"
                    class="rounded-full bg-[#FFC400] px-2 py-0.5 text-xs font-bold text-[#111827]"
                  >
                    {{ unreadCount }}
                  </span>
                </div>

                <div v-if="notificationsLoading" class="px-4 py-8 text-center text-sm text-[#94A3B8]">
                  Loading notifications...
                </div>
                <div v-else-if="!notifications.length" class="px-4 py-8 text-center text-sm text-[#94A3B8]">
                  No new notifications
                </div>
                <div v-else class="max-h-[min(420px,calc(100vh-8rem))] overflow-y-auto">
                  <div
                    v-for="item in notifications"
                    :key="item.id"
                    class="border-b border-white/10 px-4 py-3 last:border-b-0 hover:bg-[#0F172A]"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-[#F8FAFC]">
                          {{ item.title || "New support ticket" }}
                        </p>
                        <p class="mt-0.5 truncate text-xs text-[#94A3B8]">
                          {{ item.user_email || "No email" }}
                        </p>
                      </div>
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-semibold"
                        :class="item.status === 'open' ? 'bg-sky-500/10 text-[#38BDF8]' : 'bg-emerald-500/10 text-[#10B981]'"
                      >
                        {{ item.status }}
                      </span>
                    </div>
                    <p class="mt-2 line-clamp-2 text-xs text-[#CBD5E1] whitespace-normal break-words">
                      {{ item.message || "No message preview" }}
                    </p>
                    <div class="mt-3 flex items-center justify-between gap-3">
                      <span class="text-xs text-[#64748B]">
                        {{ formatNotificationDate(item.created_at) }}
                      </span>
                      <button
                        class="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-[#FFC400] hover:border-[#FFC400]"
                        type="button"
                        @click="openNotification(item)"
                      >
                        View ticket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
      <main class="flex-1 min-w-0 overflow-x-hidden overflow-y-auto bg-background pb-24 lg:pb-0">
        <component :is="currentComponent" @nav="goToPage" />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#1E293B] border-t border-white/10 flex items-center justify-around px-2 pb-safe shadow-lg">
      <button
        v-for="item in mobileNavItems"
        :key="item.page"
        type="button"
        class="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors"
        :class="isActive(item.page) ? 'text-[#FFC400]' : 'text-[#9CA3AF] hover:text-white'"
        @click="item.action ? item.action() : goToPage(item.page)"
      >
        <component :is="item.icon" class="w-5 h-5 mb-0.5" />
        <span class="text-[10px] sm:text-xs truncate max-w-full px-1">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Mobile Bottom Sheet Menu (screens < 768px) -->
    <Teleport to="body">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <button
          type="button"
          class="absolute inset-0 h-full w-full bg-black/60 transition-opacity backdrop-blur-xs"
          aria-label="Close menu"
          @click="mobileMenuOpen = false"
        />
        
        <!-- Sheet Content -->
        <div class="relative w-full bg-[#1E293B] rounded-t-3xl border-t border-white/10 p-5 pb-8 flex flex-col max-h-[85vh] overflow-y-auto z-10 shadow-2xl">
          <!-- Pull handle -->
          <div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 flex-shrink-0" />
          
          <div class="flex items-center justify-between mb-5">
            <div>
              <p class="text-sm font-bold text-white uppercase tracking-wider">Mwaslaty Admin</p>
              <p class="text-xs text-[#9CA3AF]">Additional links and configuration</p>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-lg bg-[#0F172A] border border-white/10 text-white"
              @click="mobileMenuOpen = false"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Extra navigation links -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <button
              v-for="item in extraNavItems"
              :key="item.page"
              type="button"
              class="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0F172A] border border-white/10 text-center gap-2 hover:border-[#FFC400] hover:bg-[#111827] transition-all"
              @click="goToPage(item.page); mobileMenuOpen = false;"
            >
              <component :is="item.icon" class="w-6 h-6 text-[#FFC400]" />
              <span class="text-xs font-semibold text-white">{{ item.label }}</span>
            </button>
          </div>

          <!-- Bottom controls -->
          <div class="border-t border-white/10 pt-4 flex flex-col gap-3">
            <div class="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-white/10">
              <span class="text-xs font-semibold text-[#9CA3AF]">App Theme</span>
              <button
                type="button"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-white/10 text-white text-xs font-medium"
                @click="toggleTheme"
              >
                <component :is="theme === 'dark' ? Sun : Moon" class="w-4 h-4 text-[#FFC400]" />
                {{ theme === 'dark' ? 'Light Mode' : 'Dark Mode' }}
              </button>
            </div>

            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-colors"
              @click="logout(); mobileMenuOpen = false;"
            >
              <LogOut class="w-4 h-4" />
              <span>Exit Admin Panel</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-0 z-50 lg:hidden"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="absolute inset-0 h-full w-full bg-black/55"
          aria-label="Close admin menu"
          @click="mobileSidebarOpen = false"
        />
        <div class="relative h-full">
          <AdminSidebar
            :active="activePage"
            mobile
            @nav="goToPage"
            @close="mobileSidebarOpen = false"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Bell, LogOut, ChevronDown, Moon, Sun, Menu, LayoutDashboard, Route as RouteIcon, MapPin, Ticket, X, Users, MessageCircle, MessageSquareText, Settings } from "@lucide/vue";
import AdminSidebar from "../components/AdminSidebar.vue";
import AdminDashboardHome from "./AdminDashboardHome.vue";
import AdminRoutes from "./AdminRoutes.vue";
import AdminStops from "./AdminStops.vue";
import AdminTickets from "./AdminTickets.vue";
import AdminUsers from "./AdminUsers.vue";
import AdminSupportTickets from "./AdminSupportTickets.vue";
import AdminFeedback from "./AdminFeedback.vue";
import AdminSettings from "./AdminSettings.vue";
import { adminLogout, getAdminNotifications, type AdminNotification } from "../services/adminApi";
import { applyTheme, getSavedTheme, type AppTheme } from "../../../services/theme";
import "../styles/admin-theme.css";

const route = useRoute();
const router = useRouter();
const activePage = ref("dashboard");
const mobileSidebarOpen = ref(false);
const mobileMenuOpen = ref(false);
const theme = ref<AppTheme>(getSavedTheme());
const notificationMenuRef = ref<HTMLElement | null>(null);
const notificationsOpen = ref(false);
const notificationsLoading = ref(false);
const unreadCount = ref(0);
const notifications = ref<AdminNotification[]>([]);
const validPages = new Set([
  "dashboard",
  "routes",
  "stops",
  "tickets",
  "users",
  "support",
  "support-tickets",
  "stations",
  "feedback",
  "settings",
]);

const isMobile = ref(false);
const updateWidth = () => {
  isMobile.value = window.innerWidth < 768;
};

const mobileNavItems = computed(() => [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "routes", label: "Routes", icon: RouteIcon },
  { page: "stops", label: "Stops", icon: MapPin },
  { page: "tickets", label: "Tickets", icon: Ticket },
  { 
    page: "menu", 
    label: "Menu", 
    icon: Menu, 
    action: () => {
      if (window.innerWidth < 768) {
        mobileMenuOpen.value = true;
      } else {
        mobileSidebarOpen.value = true;
      }
    } 
  }
]);

const extraNavItems = [
  { page: "users", label: "Users", icon: Users },
  { page: "support", label: "Support", icon: MessageCircle },
  { page: "feedback", label: "Feedback", icon: MessageSquareText },
  { page: "settings", label: "Settings", icon: Settings },
];

function isActive(page: string) {
  if (page === "menu") return false;
  if (activePage.value === "stations" && page === "stops") return true;
  return activePage.value === page;
}

const PAGE_META: Record<string, { title: string; sub: string }> = {
  dashboard: {
    title: "Dashboard",
    sub: "Overview of transport operations",
  },
  routes: {
    title: "Routes Management",
    sub: "Create, edit, and manage transport routes",
  },
  stops: {
    title: "Stops Management",
    sub: "Create, edit, and manage transport stops",
  },
  stations: {
    title: "Stations Management",
    sub: "Create, edit, and manage transport stops and stations",
  },
  tickets: {
    title: "Tickets Management",
    sub: "View and manage user bookings",
  },
  users: {
    title: "Users Management",
    sub: "View and manage app users",
  },
  support: {
    title: "Customer Service Requests",
    sub: "View and manage customer support messages",
  },
  "support-tickets": {
    title: "Customer Service Requests",
    sub: "View and manage customer support messages",
  },
  feedback: {
    title: "Feedback",
    sub: "Review journey route ratings and issues",
  },
  settings: {
    title: "Settings",
    sub: "Configure app, admin account, and local database",
  },
};

const meta = computed(() => PAGE_META[activePage.value] ?? PAGE_META.dashboard);

const pageTitle = computed(() => {
  if (isMobile.value) {
    const MOBILE_TITLES: Record<string, string> = {
      dashboard: "Dashboard",
      routes: "Routes",
      stops: "Stops",
      stations: "Stations",
      tickets: "Tickets",
      users: "Users",
      support: "Service Requests",
      "support-tickets": "Service Requests",
      feedback: "Feedback",
      settings: "Settings",
    };
    return MOBILE_TITLES[activePage.value] ?? meta.value.title;
  }
  return meta.value.title;
});

watch(
  () => route.params.section,
  (section) => {
    const page = typeof section === "string" ? section : "dashboard";
    activePage.value = validPages.has(page) ? page : "dashboard";
  },
  { immediate: true },
);

onMounted(() => {
  document.documentElement.classList.add("admin-theme-active");
  loadNotifications();
  document.addEventListener("click", closeNotificationsOnOutsideClick);
  window.addEventListener("admin-notifications-refresh", loadNotifications);
  window.addEventListener("resize", updateWidth);
  updateWidth();
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove("admin-theme-active");
  document.removeEventListener("click", closeNotificationsOnOutsideClick);
  window.removeEventListener("admin-notifications-refresh", loadNotifications);
  window.removeEventListener("resize", updateWidth);
});

function goToPage(page: string) {
  const nextPage = validPages.has(page) ? page : "dashboard";
  activePage.value = nextPage;
  mobileSidebarOpen.value = false;
  router.push(nextPage === "dashboard" ? "/admin" : `/admin/${nextPage}`);
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
}

async function loadNotifications() {
  notificationsLoading.value = true;
  try {
    const data = await getAdminNotifications();
    unreadCount.value = data.unreadCount ?? 0;
    notifications.value = data.notifications ?? [];
  } catch {
    unreadCount.value = 0;
    notifications.value = [];
  } finally {
    notificationsLoading.value = false;
  }
}

async function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value;
  if (notificationsOpen.value) await loadNotifications();
}

function closeNotificationsOnOutsideClick(event: MouseEvent) {
  if (!notificationsOpen.value) return;
  const target = event.target as Node | null;
  if (target && notificationMenuRef.value?.contains(target)) return;
  notificationsOpen.value = false;
}

function openNotification(item: AdminNotification) {
  notificationsOpen.value = false;
  goToPage(item.targetUrl.includes("support") ? "support" : "dashboard");
}

function formatNotificationDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

async function logout() {
  await adminLogout();
  router.push("/admin/login");
}

const currentComponent = computed(() => {
  switch (activePage.value) {
    case "dashboard":
      return AdminDashboardHome;
    case "routes":
      return AdminRoutes;
    case "stops":
    case "stations":
      return AdminStops;
    case "tickets":
      return AdminTickets;
    case "users":
      return AdminUsers;
    case "support":
    case "support-tickets":
      return AdminSupportTickets;
    case "feedback":
      return AdminFeedback;
    case "settings":
      return AdminSettings;
    default:
      return AdminDashboardHome;
  }
});
</script>
