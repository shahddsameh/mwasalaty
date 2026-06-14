<template>
  <div class="admin-theme flex h-screen overflow-hidden bg-background text-foreground">
    <AdminSidebar :active="activePage" @nav="goToPage" />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Top header -->
      <header
        class="flex-shrink-0 border-b border-border bg-card text-card-foreground"
      >
        <div class="flex items-center justify-between px-4 md:px-6 py-3 gap-4">
          <div class="min-w-0">
            <h1
              class="text-base md:text-lg font-bold text-white truncate"
              style="font-family: &quot;DM Sans&quot;, sans-serif"
            >
              {{ meta.title }}
            </h1>
            <p class="text-xs text-[#9CA3AF] hidden sm:block truncate">
              {{ meta.sub }}
            </p>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
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
                class="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B] shadow-2xl"
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
                <div v-else class="max-h-[420px] overflow-y-auto">
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
                    <p class="mt-2 line-clamp-2 text-xs text-[#CBD5E1]">
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
      <main class="flex-1 overflow-auto bg-background pb-20 lg:pb-0">
        <component :is="currentComponent" @nav="goToPage" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Bell, LogOut, ChevronDown, Moon, Sun } from "@lucide/vue";
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
  "feedback",
  "settings",
]);

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
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove("admin-theme-active");
  document.removeEventListener("click", closeNotificationsOnOutsideClick);
  window.removeEventListener("admin-notifications-refresh", loadNotifications);
});

function goToPage(page: string) {
  const nextPage = validPages.has(page) ? page : "dashboard";
  activePage.value = nextPage;
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
