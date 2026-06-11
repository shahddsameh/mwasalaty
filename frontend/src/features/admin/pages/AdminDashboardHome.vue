<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-5 md:gap-6 pb-20 lg:pb-8"
  >
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Total Tickets"
        :value="cardValue('tickets')"
        color="#FF7A1A"
      />
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Active Tickets"
        :value="cardValue('activeTickets')"
        color="#00B86B"
      />
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Refund Issues"
        :value="cardValue('refundIssues')"
        color="#E63946"
      />
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Open Support Tickets"
        :value="cardValue('openSupportTickets')"
        color="#0EA5E9"
      />
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Total Users"
        :value="cardValue('users')"
        color="#7C3AED"
      />
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Blocked Users"
        :value="cardValue('blockedUsers')"
        color="#E63946"
      />
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Total Routes"
        :value="cardValue('transitRoutes')"
        color="#2B2A27"
      />
      <StatCard
        className="bg-[#1F2937] rounded-xl border border-[#374151]"
        label="Total Stops"
        :value="cardValue('transitStops')"
        color="#00B86B"
      />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
      <ChartCard
        title="Route Searches Over Time"
        :empty="!stats.routeSearchesByDay.length"
      >
        <Bar :data="searchesByDayData" :options="chartOptions" />
      </ChartCard>

      <ChartCard
        title="Transit Routes by Mode"
        :empty="!stats.transitRoutesByMode.length"
      >
        <Doughnut :data="routesByModeData" :options="doughnutOptions" />
      </ChartCard>

      <ChartCard
        title="Tickets by Status"
        :empty="!stats.ticketsByStatus.length"
      >
        <Bar :data="ticketsByStatusData" :options="chartOptions" />
      </ChartCard>

      <Card className="bg-[#1F2937] rounded-xl border border-[#374151]">
        <div class="px-5 py-4 border-b border-[#374151]">
          <h2
            class="text-base font-bold text-white"
            style="font-family: &quot;DM Sans&quot;, sans-serif"
          >
            Top Searched Routes
          </h2>
        </div>
        <div
          v-if="!stats.topSearchedRoutes.length"
          class="p-8 text-center text-sm text-[#9CA3AF]"
        >
          No data yet
        </div>
        <div v-else class="p-5 flex flex-col gap-3">
          <div
            v-for="route in stats.topSearchedRoutes"
            :key="`${route.from_label}-${route.to_label}`"
          >
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="font-semibold text-white truncate">
                {{ route.from_label || "-" }} -> {{ route.to_label || "-" }}
              </span>
              <span class="font-bold text-white">{{ route.search_count }}</span>
            </div>
            <div class="mt-2 h-2 rounded-full bg-[#111827] overflow-hidden">
              <div
                class="h-full rounded-full bg-[#FFC400]"
                :style="{ width: topRouteWidth(route.search_count) }"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>

    <Card className="bg-[#1F2937] rounded-xl border border-[#374151]">
      <div class="px-5 py-4 border-b border-[#374151]">
        <h2
          class="text-base font-bold text-white"
          style="font-family: &quot;DM Sans&quot;, sans-serif"
        >
          Recent Activity
        </h2>
        <p class="text-xs text-[#9CA3AF]">Recent route searches</p>
      </div>
      <div
        v-if="!stats.recentRouteSearches.length"
        class="p-8 text-center text-sm text-[#9CA3AF]"
      >
        No data yet
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm table-fixed">
          <thead class="bg-[#111827] border-b border-[#374151]">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                From
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                To
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                Created
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                Total Routes
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#374151]">
            <tr
              v-for="item in stats.recentRouteSearches"
              :key="`${item.from_label}-${item.to_label}-${item.created_at}`"
              class="hover:bg-[#111827] transition-colors"
            >
              <td class="px-4 py-3 font-semibold text-white">
                {{ item.from_label || "-" }}
              </td>
              <td class="px-4 py-3 text-[#9CA3AF]">
                {{ item.to_label || "-" }}
              </td>
              <td class="px-4 py-3 text-[#9CA3AF]">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="px-4 py-3 text-[#9CA3AF]">
                {{ item.total_routes ?? "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from "vue";
import { Bar, Doughnut } from "vue-chartjs";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Card, StatCard } from "../components/AdminShared.vue";
import { getDashboardStats, type DashboardStats } from "../services/adminApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
);

defineEmits<{
  nav: [page: string];
}>();

const loading = ref(true);
const error = ref("");
const stats = reactive<DashboardStats>({
  totals: {
    users: 0,
    blockedUsers: 0,
    transitRoutes: 0,
    transitStops: 0,
    routeSearches: 0,
    tickets: 0,
    activeTickets: 0,
    refundIssues: 0,
    supportTickets: 0,
    openSupportTickets: 0,
  },
  routeSearchesByDay: [],
  transitRoutesByMode: [],
  ticketsByStatus: [],
  topSearchedRoutes: [],
  recentRouteSearches: [],
});

const colors = [
  "#FFC400",
  "#00B86B",
  "#0EA5E9",
  "#7C3AED",
  "#FF7A1A",
  "#E63946",
];
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: "index" } },
  scales: {
    x: { ticks: { color: "#9CA3AF" }, grid: { color: "#374151" } },
    y: { ticks: { color: "#9CA3AF" }, grid: { color: "#374151" } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom", labels: { color: "#9CA3AF" } } },
};

const ChartCard = defineComponent({
  props: {
    title: { type: String, required: true },
    empty: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h(
        Card,
        { className: "bg-[#1F2937] rounded-xl border border-[#374151]" },
        {
          default: () => [
            h("div", { class: "px-5 py-4 border-b border-[#374151]" }, [
              h(
                "h2",
                {
                  class: "text-base font-bold text-white",
                  style: "font-family: 'DM Sans', sans-serif",
                },
                props.title,
              ),
            ]),
            props.empty
              ? h(
                  "div",
                  { class: "p-8 text-center text-sm text-[#9CA3AF]" },
                  "No data yet",
                )
              : h("div", { class: "h-72 p-5" }, slots.default?.()),
          ],
        },
      );
  },
});

function cardValue(key: keyof DashboardStats["totals"]) {
  return loading.value ? "..." : (stats.totals[key] ?? 0);
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function topRouteWidth(count: number) {
  const max = Math.max(
    ...stats.topSearchedRoutes.map((route) => route.search_count),
    1,
  );
  return `${Math.max(8, Math.round((count / max) * 100))}%`;
}

const searchesByDayData = computed(() => ({
  labels: stats.routeSearchesByDay.map((item) => item.date),
  datasets: [
    {
      data: stats.routeSearchesByDay.map((item) => item.count),
      backgroundColor: "#FFC400",
    },
  ],
}));

const routesByModeData = computed(() => ({
  labels: stats.transitRoutesByMode.map((item) => item.mode),
  datasets: [
    {
      data: stats.transitRoutesByMode.map((item) => item.count),
      backgroundColor: colors,
    },
  ],
}));

const ticketsByStatusData = computed(() => ({
  labels: stats.ticketsByStatus.map((item) => item.status),
  datasets: [
    {
      data: stats.ticketsByStatus.map((item) => item.count),
      backgroundColor: "#0EA5E9",
    },
  ],
}));

async function loadDashboard() {
  loading.value = true;
  error.value = "";
  try {
    Object.assign(stats, await getDashboardStats());
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load dashboard stats";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>
