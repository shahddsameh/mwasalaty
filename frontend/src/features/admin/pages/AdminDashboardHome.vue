<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-5 md:gap-6 pb-20 lg:pb-8"
  >
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total Transit Routes" :value="loading ? '...' : summary.routes" color="#2B2A27" />
      <StatCard label="Total Route Searches" :value="loading ? '...' : summary.searches" color="#7C3AED" />
      <StatCard label="Total Stops" :value="loading ? '...' : summary.stops" color="#00B86B" />
      <StatCard label="Total Users" :value="loading ? '...' : summary.users" color="#0EA5E9" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Card, StatCard } from '../components/AdminShared.vue';
import { listRouteSearches, listTransitRoutes, listTransitStops, listUsers } from '../services/adminApi';

defineEmits<{
  nav: [page: string];
}>();

const loading = ref(true);
const error = ref('');
const summary = reactive({
  routes: 0,
  searches: 0,
  stops: 0,
  users: 0,
});

async function loadSummary() {
  loading.value = true;
  error.value = '';
  try {
    const [routes, searches, stops, users] = await Promise.all([
      listTransitRoutes(),
      listRouteSearches(),
      listTransitStops(),
      listUsers(),
    ]);
    summary.routes = routes.length;
    summary.searches = searches.length;
    summary.stops = stops.length;
    summary.users = users.length;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard summary';
  } finally {
    loading.value = false;
  }
}

onMounted(loadSummary);
</script>
