<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6"
  >
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Transit Routes" :value="routes.length" color="#2B2A27" />
      <StatCard label="Route Searches" :value="searches.length" color="#7C3AED" />
      <StatCard label="Metro" :value="countByMode('metro')" color="#2563EB" />
      <StatCard label="Bus" :value="countByMode('bus')" color="#00B86B" />
    </div>

    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <Card>
      <div class="p-4 md:p-5 border-b border-[#E6DEC8] flex flex-col gap-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in routeTabs"
            :key="tab.value"
            class="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all"
            :class="activeTab === tab.value ? 'border-[#FFC400] bg-[#FFC400] text-[#111827]' : 'border-[#E6DEC8] bg-white text-[#4B5563] hover:border-[#FFC400]'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div v-if="activeTab === 'transit'" class="flex flex-wrap gap-2">
            <button
              v-for="option in modeFilters"
              :key="option.value"
              class="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all"
              :class="selectedMode === option.value ? 'border-[#111827] bg-[#111827] text-white' : 'border-[#E6DEC8] bg-white text-[#4B5563] hover:border-[#FFC400]'"
              @click="selectedMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="relative flex-1 min-w-[220px]">
            <Search class="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="search"
              :placeholder="activeTab === 'transit' ? 'Search transit routes...' : 'Search route searches...'"
              class="w-full pl-9 pr-4 py-2 border-2 border-[#E6DEC8] rounded-xl text-sm text-[#2B2A27] placeholder-[#6B7280] focus:outline-none focus:border-[#FFC400] bg-white"
            />
          </div>
          <button
            @click="loadData"
            class="p-2 rounded-xl border-2 border-[#E6DEC8] text-[#6B7280] hover:border-[#FFC400] hover:text-[#111827] transition-all flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-16 text-[#6B7280] text-sm">
        Loading routes...
      </div>

      <div v-else-if="activeTab === 'transit' && filteredRoutes.length > 0" class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="bg-[#111827] text-[#FFC400] uppercase text-xs tracking-wide">
            <tr>
              <th class="px-4 py-3">Short Name</th>
              <th class="px-4 py-3">Long Name</th>
              <th class="px-4 py-3">Mode</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="route in filteredRoutes" :key="routeKey(route)" class="border-b border-[#E6DEC8]">
              <td class="px-4 py-3 font-semibold text-[#111827]">{{ route.short_name || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ route.long_name || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ normalizeMode(route) }}</td>
              <td class="px-4 py-3">
                <button class="rounded-lg border border-[#E6DEC8] px-3 py-1.5 font-semibold hover:bg-[#FFF7D6]" @click="selectedRoute = route">
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="activeTab === 'searches' && filteredSearches.length > 0" class="overflow-x-auto">
        <table class="w-full min-w-[960px] text-left text-sm">
          <thead class="bg-[#111827] text-[#FFC400] uppercase text-xs tracking-wide">
            <tr>
              <th class="px-4 py-3">From</th>
              <th class="px-4 py-3">To</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Time</th>
              <th class="px-4 py-3">Optimized For</th>
              <th class="px-4 py-3">Total Routes</th>
              <th class="px-4 py-3">Search Count</th>
              <th class="px-4 py-3">Latest Created</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredSearches" :key="searchKey(item)" class="border-b border-[#E6DEC8]">
              <td class="px-4 py-3 font-semibold text-[#111827]">{{ item.from_label || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ item.to_label || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ item.date || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ item.time || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ item.optimized_for || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ item.total_routes ?? '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ item.search_count ?? 1 }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ formatDate(item.latest_created_at || item.created_at) }}</td>
              <td class="px-4 py-3">
                <button class="rounded-lg border border-[#E6DEC8] px-3 py-1.5 font-semibold hover:bg-[#FFF7D6]" @click="selectedSearch = item">
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 px-4 gap-3">
        <RouteIcon class="w-10 h-10 text-[#6B7280]" />
        <p class="text-base font-bold text-[#2B2A27]">No routes found</p>
        <p class="text-sm text-[#6B7280] text-center">
          {{ activeTab === 'transit' ? 'No transit routes match this filter.' : 'No user route searches match this filter.' }}
        </p>
      </div>
    </Card>

    <Card v-if="selectedRoute">
      <DetailsHeader title="Transit Route Details" @close="selectedRoute = null" />
      <pre class="p-4 md:p-5 whitespace-pre-wrap text-xs text-[#4B5563]">{{ selectedRoute }}</pre>
    </Card>

    <Card v-if="selectedSearch">
      <DetailsHeader title="Route Search Details" @close="selectedSearch = null" />
      <div class="p-4 md:p-5 space-y-3">
        <p class="text-sm font-semibold text-[#111827]">
          {{ selectedSearch.from_label || '-' }} -> {{ selectedSearch.to_label || '-' }}
        </p>
        <pre class="whitespace-pre-wrap text-xs text-[#4B5563]">{{ selectedSearch.latest_itineraries || selectedSearch.itineraries || selectedSearch }}</pre>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { RefreshCw, Route as RouteIcon, Search } from '@lucide/vue';
import { Card, StatCard } from '../components/AdminShared.vue';
import {
  listRouteSearches,
  listTransitRoutes,
  type RouteSearch,
  type TransitRoute,
} from '../services/adminApi';

const routes = ref<TransitRoute[]>([]);
const searches = ref<RouteSearch[]>([]);
const selectedRoute = ref<TransitRoute | null>(null);
const selectedSearch = ref<RouteSearch | null>(null);
const activeTab = ref<'transit' | 'searches'>('transit');
const search = ref('');
const selectedMode = ref('all');
const loading = ref(true);
const error = ref('');

const routeTabs = [
  { value: 'transit', label: 'Transit Routes' },
  { value: 'searches', label: 'User Route Searches' },
] as const;

const modeFilters = [
  { value: 'all', label: 'All' },
  { value: 'bus', label: 'Bus' },
  { value: 'metro', label: 'Metro' },
];

const DetailsHeader = defineComponent({
  props: { title: { type: String, required: true } },
  emits: ['close'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'p-4 md:p-5 border-b border-[#E6DEC8] flex items-center justify-between gap-4' }, [
        h('h3', { class: 'text-lg font-bold text-[#2B2A27]' }, props.title),
        h(
          'button',
          {
            class: 'rounded-lg border border-[#E6DEC8] px-3 py-1.5 text-sm font-semibold',
            onClick: () => emit('close'),
          },
          'Close'
        ),
      ]);
  },
});

function routeKey(route: TransitRoute) {
  return String(route.id || route.short_name || route.long_name || JSON.stringify(route));
}

function searchKey(item: RouteSearch) {
  return String(
    [item.from_label, item.to_label, item.date, item.time, item.optimized_for].join('|') ||
      item.id ||
      item.plan_id ||
      item.latest_created_at ||
      JSON.stringify(item)
  );
}

function looksLikeMetro(route: TransitRoute) {
  const name = `${route.short_name || ''} ${route.long_name || ''} ${route.id || ''}`.toLowerCase();
  return name.includes('metro') || /^m\d+\b/i.test(String(route.short_name || route.id || ''));
}

function normalizeMode(route: TransitRoute) {
  const value = String(route.mode || '').toLowerCase();
  if (value === 'bus') return 'Bus';
  if (value === 'subway' || value === 'metro' || value === 'rail' || looksLikeMetro(route)) return 'Metro';
  return route.mode ? String(route.mode) : 'Unknown';
}

function matchesMode(route: TransitRoute, mode: string) {
  if (mode === 'all') return true;
  return normalizeMode(route).toLowerCase() === mode.toLowerCase();
}

function countByMode(mode: string) {
  return routes.value.filter((route) => matchesMode(route, mode)).length;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

const filteredRoutes = computed(() => {
  const q = search.value.trim().toLowerCase();
  return routes.value.filter((route) => {
    if (!matchesMode(route, selectedMode.value)) return false;
    if (!q) return true;
    return [route.id, route.short_name, route.long_name, route.mode, normalizeMode(route)].some((value) =>
      String(value || '').toLowerCase().includes(q)
    );
  });
});

const filteredSearches = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return searches.value;
  return searches.value.filter((item) =>
    [
      item.from_label,
      item.to_label,
      item.date,
      item.time,
      item.optimized_for,
      item.total_routes,
      item.search_count,
      item.latest_created_at || item.created_at,
    ].some((value) => String(value || '').toLowerCase().includes(q))
  );
});

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const [transitRoutes, routeSearches] = await Promise.all([
      listTransitRoutes(),
      listRouteSearches(),
    ]);
    routes.value = transitRoutes;
    searches.value = routeSearches;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load routes';
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>
