<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5"
  >
    <div>
      <h2 class="text-[28px] font-bold leading-tight text-[#F8FAFC]">Settings</h2>
      <p class="mt-1 text-sm text-[#94A3B8]">
        System configuration and admin environment overview
      </p>
    </div>

    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <InfoCard
        title="System Status"
        :items="[
          ['Backend API', stats ? 'Available' : loading ? 'Checking' : 'Not available'],
          ['OTP Status', stats ? 'Available through backend' : 'Not available'],
          ['Supabase Status', stats ? 'Available through backend' : 'Not available'],
        ]"
      />
      <InfoCard
        title="Admin Session"
        :items="[
          ['Current Admin', 'Admin'],
          ['Role', 'Administrator'],
          ['Login State', 'Active'],
        ]"
      />
      <InfoCard
        title="Database Overview"
        :items="[
          ['Users', loading ? '...' : String(stats?.totals.users ?? 0)],
          ['Routes', loading ? '...' : String(stats?.totals.transitRoutes ?? 0)],
          ['Stops', loading ? '...' : String(stats?.totals.transitStops ?? 0)],
          ['Route Searches', loading ? '...' : String(stats?.totals.routeSearches ?? 0)],
        ]"
      />
      <InfoCard
        title="App Info"
        :items="[
          ['Version', '1.0.0'],
          ['Environment', appMode || 'Not available'],
          ['API Base', apiBase || 'Not available'],
          ['Last Updated', lastUpdated],
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from "vue";
import { Card } from "../components/AdminShared.vue";
import { getDashboardStats, type DashboardStats } from "../services/adminApi";

const loading = ref(true);
const error = ref("");
const stats = ref<DashboardStats | null>(null);
const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
const appMode = import.meta.env.MODE;
const lastUpdated = new Date().toLocaleDateString();

const InfoCard = defineComponent({
  props: { title: String, items: { type: Array, required: true } },
  setup(props) {
    return () =>
      h(
        Card,
        { className: "bg-[#1E293B] rounded-2xl border border-white/10" },
        {
          default: () =>
            h("div", { class: "p-5 min-h-[210px]" }, [
              h(
                "h2",
                { class: "text-base font-bold text-[#F8FAFC] mb-4" },
                props.title,
              ),
              h(
                "div",
                { class: "space-y-3" },
                (props.items as string[][]).map(([label, value]) =>
                  h(
                    "div",
                    {
                      class: "flex items-center justify-between gap-3 text-sm",
                    },
                    [
                      h("span", { class: "text-[#94A3B8]" }, label),
                      h(
                        "span",
                        { class: "font-semibold text-[#F8FAFC] text-right" },
                        value || "Not available",
                      ),
                    ],
                  ),
                ),
              ),
            ]),
        },
      );
  },
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    stats.value = await getDashboardStats();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load system status";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
