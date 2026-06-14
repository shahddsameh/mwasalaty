<template>
  <div class="min-h-screen bg-background">
    <OfflineIndicator />
    <Header v-if="showHeader && !showBlockedOverlay" />
    <RouterView />
    <div
      v-if="showBlockedOverlay"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
    >
      <section class="w-full max-w-md rounded-2xl border-2 border-border bg-card p-6 text-center shadow-xl">
        <h2 class="font-display text-2xl text-foreground mb-3">Account Blocked</h2>
        <p class="text-muted-foreground mb-6">
          Your account has been blocked due to suspicious activity or policy violations. You can contact support if you believe this is a mistake.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button class="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground" @click="contactSupport">
            Contact Support
          </button>
          <button class="rounded-xl border-2 border-border px-5 py-3 font-semibold text-foreground" @click="logout">
            Logout
          </button>
        </div>
      </section>
    </div>
    <PwaUpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import Header from "../components/layout/Header.vue";
import PwaUpdatePrompt from "../pwa/PwaUpdatePrompt.vue";
import OfflineIndicator from "../components/shared/OfflineIndicator.vue";
import { useAuthState } from "@/services/authState";
import { getUserStatus, logoutBlockedUser } from "@/services/userStatus";

const route = useRoute();
const router = useRouter();
const headerlessRoutes = new Set(["live-navigation", "ticket", "payment-success"]);
const isAdminRoute = computed(() => route.path.startsWith("/admin"));
const isSupportRoute = computed(() => route.path === "/support");
const showHeader = computed(
  () => !isAdminRoute.value && !headerlessRoutes.has(String(route.name)),
);
const { isAuthenticated } = useAuthState();
const blocked = ref(false);
const showBlockedOverlay = computed(() => blocked.value && !isAdminRoute.value && !isSupportRoute.value);

watch(
  () => [route.fullPath, isAuthenticated.value, isAdminRoute.value] as const,
  async () => {
    if (!isAuthenticated.value || isAdminRoute.value) {
      blocked.value = false;
      return;
    }
    blocked.value = (await getUserStatus()).blocked === true;
  },
  { immediate: true },
);

async function logout() {
  await logoutBlockedUser();
  blocked.value = false;
  window.location.href = "/login";
}

function contactSupport() {
  router.push("/support");
}

function showBlockedModal() {
  blocked.value = true;
}

onMounted(() => window.addEventListener("mwasalaty:user-blocked", showBlockedModal));
onUnmounted(() => window.removeEventListener("mwasalaty:user-blocked", showBlockedModal));
</script>
