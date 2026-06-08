<template>
  <section class="space-y-4">
    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 class="font-display text-xl">Saved Route Searches</h2>
        <button class="rounded-lg border px-3 py-2 text-sm" @click="load">Refresh</button>
      </div>
      <div v-if="loading" class="p-4 text-slate-500">Loading routes...</div>
      <div v-else-if="!routes.length" class="p-4 text-slate-500">No route searches found.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-950 text-left text-yellow-400">
            <tr>
              <th class="p-3">Route</th>
              <th class="p-3">Date / Time</th>
              <th class="p-3">Optimized For</th>
              <th class="p-3">Total Routes</th>
              <th class="p-3">Created</th>
              <th class="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="route in routes" :key="route.id ?? route.plan_id" class="border-t">
              <td class="p-3">{{ route.from_label || "Origin" }} -> {{ route.to_label || "Destination" }}</td>
              <td class="p-3">{{ route.date }} {{ route.time }}</td>
              <td class="p-3">{{ route.optimized_for }}</td>
              <td class="p-3">{{ route.total_routes }}</td>
              <td class="p-3">{{ formatDate(route.created_at) }}</td>
              <td class="p-3">
                <button class="text-blue-700" @click="selected = route">View details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="selected" class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-display text-lg">Route Details</h3>
        <button class="text-sm text-slate-500" @click="selected = null">Close</button>
      </div>
      <pre class="max-h-96 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-white">{{ selected.itineraries }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listRouteSearches, type RouteSearch } from "@/features/admin/services/adminApi";

const routes = ref<RouteSearch[]>([]);
const selected = ref<RouteSearch | null>(null);
const loading = ref(false);
const error = ref("");

onMounted(load);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    routes.value = await listRouteSearches();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Route searches could not load.";
  } finally {
    loading.value = false;
  }
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}
</script>
