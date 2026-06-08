<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6"
  >
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total Stops" :value="stops.length" color="#2B2A27" />
      <StatCard label="With Location" :value="locatedStops" color="#00B86B" />
      <StatCard label="Missing Location" :value="stops.length - locatedStops" color="#E63946" />
      <StatCard label="Visible" :value="filteredStops.length" color="#111827" />
    </div>

    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <Card>
      <div class="p-4 md:p-5 border-b border-[#E6DEC8] flex items-center gap-3">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="search"
            placeholder="Search stops..."
            class="w-full pl-9 pr-4 py-2 border-2 border-[#E6DEC8] rounded-xl text-sm text-[#2B2A27] placeholder-[#6B7280] focus:outline-none focus:border-[#FFC400] bg-white"
          />
        </div>
        <button
          @click="loadStops"
          class="p-2 rounded-xl border-2 border-[#E6DEC8] text-[#6B7280] hover:border-[#FFC400] hover:text-[#111827] transition-all flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-16 text-[#6B7280] text-sm">
        Loading stops...
      </div>

      <div v-else-if="filteredStops.length > 0" class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="bg-[#111827] text-[#FFC400] uppercase text-xs tracking-wide">
            <tr>
              <th class="px-4 py-3">Stop</th>
              <th class="px-4 py-3">Latitude</th>
              <th class="px-4 py-3">Longitude</th>
              <th class="px-4 py-3">ID</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stop in filteredStops" :key="stopKey(stop)" class="border-b border-[#E6DEC8]">
              <td class="px-4 py-3 font-semibold text-[#111827]">{{ stop.name || 'Unnamed stop' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ stop.lat ?? '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ stop.lng ?? stop.lon ?? '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ stop.id || '-' }}</td>
              <td class="px-4 py-3">
                <button
                  class="rounded-lg border border-[#E6DEC8] px-3 py-1.5 font-semibold hover:bg-[#FFF7D6]"
                  @click="selectedStop = stop"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 px-4 gap-3">
        <MapPin class="w-10 h-10 text-[#6B7280]" />
        <p class="text-base font-bold text-[#2B2A27]">No stops found</p>
        <p class="text-sm text-[#6B7280] text-center">
          Start OTP and backend so the startup sync can load transit stops.
        </p>
      </div>
    </Card>

    <Card v-if="selectedStop">
      <div class="p-4 md:p-5 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-[#2B2A27]">{{ selectedStop.name || 'Stop details' }}</h3>
          <pre class="mt-3 whitespace-pre-wrap text-xs text-[#4B5563]">{{ selectedStop }}</pre>
        </div>
        <button class="rounded-lg border border-[#E6DEC8] px-3 py-1.5 text-sm font-semibold" @click="selectedStop = null">
          Close
        </button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { MapPin, RefreshCw, Search } from '@lucide/vue';
import { Card, StatCard } from '../components/AdminShared.vue';
import { listTransitStops, type TransitStop } from '../services/adminApi';

const stops = ref<TransitStop[]>([]);
const selectedStop = ref<TransitStop | null>(null);
const search = ref('');
const loading = ref(true);
const error = ref('');

const locatedStops = computed(
  () => stops.value.filter((stop) => stop.lat !== null && stop.lat !== undefined && (stop.lng ?? stop.lon) !== null && (stop.lng ?? stop.lon) !== undefined).length
);

const filteredStops = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return stops.value;
  return stops.value.filter((stop) =>
    [stop.id, stop.name, stop.lat, stop.lng ?? stop.lon].some((value) =>
      String(value || '').toLowerCase().includes(q)
    )
  );
});

function stopKey(stop: TransitStop) {
  return String(stop.id || stop.name || JSON.stringify(stop));
}

async function loadStops() {
  loading.value = true;
  error.value = '';
  try {
    stops.value = await listTransitStops();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load transit stops';
  } finally {
    loading.value = false;
  }
}

onMounted(loadStops);
</script>
