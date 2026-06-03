<template>
  <div class="min-h-screen bg-background">
    <Header v-if="showHeader" />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import Header from "../components/layout/Header.vue";

const route = useRoute();
const headerlessRoutes = new Set(["live-navigation", "ticket"]);
const showHeader = computed(() => !headerlessRoutes.has(String(route.name)));
</script>
