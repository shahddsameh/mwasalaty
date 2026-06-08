<template>
  <div class="min-h-screen bg-background">
    <OfflineIndicator />
    <Header v-if="showHeader" />
    <RouterView />
    <PwaUpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import Header from "../components/layout/Header.vue";
import PwaUpdatePrompt from "../pwa/PwaUpdatePrompt.vue";
import OfflineIndicator from "../components/shared/OfflineIndicator.vue";

const route = useRoute();
const headerlessRoutes = new Set(["live-navigation", "ticket", "payment-success"]);
const isAdminRoute = computed(() => route.path.startsWith("/admin"));
const showHeader = computed(
  () => !isAdminRoute.value && !headerlessRoutes.has(String(route.name)),
);
</script>
