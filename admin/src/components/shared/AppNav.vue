<template>
  <header class="bg-surface-dark text-white">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-5 py-4">
      <RouterLink to="/dashboard" class="me-auto">
        <span class="block text-xs uppercase tracking-[0.3em] text-primary">Cairo network</span>
        <strong class="text-xl">{{ $t("common.appName") }}</strong>
      </RouterLink>
      <nav v-if="authenticated" class="flex flex-wrap items-center gap-1">
        <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="rounded-md px-3 py-2 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white" active-class="bg-white/10 !text-primary">{{ item.label }}</RouterLink>
      </nav>
      <AppButton variant="ghost" class="text-white" @click="toggleLocale">{{ $t("common.language") }}</AppButton>
      <AppButton v-if="authenticated" variant="ghost" class="text-white" @click="signOut">{{ $t("nav.logout") }}</AppButton>
    </div>
  </header>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AppButton from "@/components/ui/AppButton.vue";
import { getCurrentLocale, setLocale } from "@/i18n";
import * as api from "@/services/api";
import { clearSession, isAuthenticated, sessionRevision } from "@/services/session";
const { t } = useI18n();
const router = useRouter();
const authenticated = computed(() => {
  sessionRevision.value;
  return isAuthenticated();
});
const items = computed(() => [
  { to: "/dashboard", label: t("nav.dashboard") }, { to: "/stops", label: t("nav.stops") }, { to: "/stations", label: t("nav.stations") }
]);
function toggleLocale() { setLocale(getCurrentLocale() === "ar" ? "en" : "ar"); }
async function signOut() {
  try { await api.logout(); } catch { /* Local sign-out still wins. */ }
  clearSession();
  await router.push({ name: "login", query: { message: "signedOut" } });
}
</script>
