<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6"
  >
    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total Routes" :value="stats.total" color="#2B2A27" />
      <StatCard label="Active Routes" :value="stats.active" color="#00B86B" />
      <StatCard label="Inactive Routes" :value="stats.inactive" color="#E63946" />
      <StatCard label="Average Fare" :value="`${stats.avgFare} EGP`" color="#111827" />
    </div>

    <!-- Routes card -->
    <Card>
      <!-- Toolbar -->
      <div class="p-4 md:p-5 border-b border-[#E6DEC8] flex flex-col gap-3">
        <!-- Row 1: search + add button -->
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <Search
              class="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              v-model="filters.search"
              placeholder="Search routes, stops…"
              class="w-full pl-9 pr-4 py-2 border-2 border-[#E6DEC8] rounded-xl text-sm text-[#2B2A27] placeholder-[#6B7280] focus:outline-none focus:border-[#FFC400] bg-white"
            />
          </div>
          <button
            @click="loadRoutes"
            class="p-2 rounded-xl border-2 border-[#E6DEC8] text-[#6B7280] hover:border-[#FFC400] hover:text-[#111827] transition-all flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
          <button
            @click="openAddModal"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFC400] text-[#111827] text-sm font-semibold hover:bg-[#FFD633] transition-colors flex-shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Add Route</span>
            <span class="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16 text-[#6B7280] text-sm">
        Loading routes…
      </div>

      <!-- Routes list -->
      <div v-else-if="filteredRoutes.length > 0" class="p-4 flex flex-col gap-3">
        <div
          v-for="route in filteredRoutes"
          :key="route.id"
          class="bg-white rounded-2xl border-2 border-[#FFC400] p-4"
        >
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[#2B2A27] truncate">
                {{ route.name }}
              </p>
              <p class="text-xs text-[#6B7280] mt-0.5">
                {{ route.from }} → {{ route.to }}
              </p>
            </div>
            <StatusBadge :status="route.status" />
          </div>

          <div class="flex items-center gap-2 flex-wrap mb-4">
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border"
              :style="{
                background: transportStyles[route.transportType].bg,
                color: transportStyles[route.transportType].text,
                borderColor: transportStyles[route.transportType].border,
              }"
            >
              {{ route.transportType }}
            </span>
            <span class="text-xs text-[#6B7280]">
              · {{ route.fare === 0 ? 'Free' : `${route.fare} EGP` }}
            </span>
            <span class="text-xs text-[#6B7280]">· {{ route.duration }} min</span>
            <span v-if="route.transfers > 0" class="text-xs text-[#6B7280]">
              · {{ route.transfers }} transfer{{ route.transfers > 1 ? 's' : '' }}
            </span>
          </div>

          <div class="flex gap-2">
            <button
              @click="editRoute(route)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border-2 border-[#E6DEC8] text-[#2B2A27] hover:border-[#FFC400] hover:bg-[#FFF7D6] transition-all"
            >
              <Pencil class="w-3.5 h-3.5" /> Edit
            </button>
            <button
              @click="deleteRoute(route)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border-2 border-[#FECACA] text-[#E63946] hover:bg-[#FEF2F2] transition-all"
            >
              <Trash2 class="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-16 px-4 gap-3">
        <div
          class="w-16 h-16 rounded-2xl bg-[#FFF7D6] border-2 border-[#E6DEC8] flex items-center justify-center"
        >
          <RouteIcon class="w-7 h-7 text-[#6B7280]" />
        </div>
        <p
          class="text-base font-bold text-[#2B2A27]"
          style="font-family: 'DM Sans', sans-serif"
        >
          No routes found
        </p>
        <p class="text-sm text-[#6B7280] text-center">
          Get started by adding your first route
        </p>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFC400] text-[#111827] text-sm font-semibold hover:bg-[#FFD633] transition-colors mt-1"
        >
          <Plus class="w-4 h-4" /> Add First Route
        </button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Search, RefreshCw, Pencil, Trash2, Route as RouteIcon } from '@lucide/vue';
import { adminDb, seedRoutes, type Route, type TransportType } from '@/db/adminDb';
import { StatCard, Card, StatusBadge } from '../components/AdminShared.vue';

const routes = ref<Route[]>([]);
const loading = ref(true);
const filters = ref({ search: '' });

const transportStyles: Record<TransportType, { bg: string; text: string; border: string }> = {
  Metro: { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  Bus: { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0' },
  Microbus: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Walking: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  'Ride-hailing': { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
};

const filteredRoutes = computed(() => {
  const q = filters.value.search.toLowerCase();
  if (!q) return routes.value;
  return routes.value.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.from.toLowerCase().includes(q) ||
      r.to.toLowerCase().includes(q)
  );
});

const stats = computed(() => ({
  total: routes.value.length,
  active: routes.value.filter((r) => r.status === 'Active').length,
  inactive: routes.value.filter((r) => r.status === 'Inactive').length,
  avgFare: routes.value.length
    ? Math.round(routes.value.reduce((s, r) => s + r.fare, 0) / routes.value.length)
    : 0,
}));

async function loadRoutes() {
  loading.value = true;
  await seedRoutes();
  routes.value = await adminDb.routes.toArray();
  loading.value = false;
}

function openAddModal() {
  alert('Add Route modal - To be implemented');
}

function editRoute(route: Route) {
  alert(`Edit Route: ${route.name} - To be implemented`);
}

async function deleteRoute(route: Route) {
  if (confirm(`Delete route "${route.name}"?`)) {
    if (route.id) {
      await adminDb.routes.delete(route.id);
      await loadRoutes();
    }
  }
}

onMounted(() => {
  loadRoutes();
});
</script>
