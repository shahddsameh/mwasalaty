<template>
  <div class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6">
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <InfoCard title="Admin Session" :items="[
        ['Status', 'Active'],
        ['Storage', 'Browser session token'],
      ]" />
      <InfoCard title="System Status" :items="[
        ['Backend API', apiBase],
        ['Environment', appMode],
      ]" />
      <InfoCard title="Supabase" :items="[
        ['Users', loading ? '...' : String(stats?.totals.users ?? 0)],
        ['Routes', loading ? '...' : String(stats?.totals.transitRoutes ?? 0)],
        ['Stops', loading ? '...' : String(stats?.totals.transitStops ?? 0)],
      ]" />
      <InfoCard title="OTP / Planner" :items="[
        ['Route Searches', loading ? '...' : String(stats?.totals.routeSearches ?? 0)],
        ['Status', stats ? 'Available through backend' : 'Checking'],
      ]" />
      <InfoCard title="Tickets" :items="[
        ['Tickets', loading ? '...' : String(stats?.totals.tickets ?? 0)],
        ['Support Tickets', loading ? '...' : String(stats?.totals.supportTickets ?? 0)],
      ]" />
      <Card>
        <div class="p-5">
          <h2 class="text-lg font-bold text-[#2B2A27] mb-2">Settings</h2>
          <p class="text-sm text-[#6B7280]">Settings and system controls will appear here.</p>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from 'vue';
import { Card } from '../components/AdminShared.vue';
import { getDashboardStats, type DashboardStats } from '../services/adminApi';

const loading = ref(true);
const error = ref('');
const stats = ref<DashboardStats | null>(null);
const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const appMode = import.meta.env.MODE;

const InfoCard = defineComponent({
  props: { title: String, items: { type: Array, required: true } },
  setup(props) {
    return () => h(Card, null, {
      default: () => h('div', { class: 'p-5' }, [
        h('h2', { class: 'text-lg font-bold text-[#2B2A27] mb-4' }, props.title),
        h('div', { class: 'space-y-3' }, (props.items as string[][]).map(([label, value]) =>
          h('div', { class: 'flex items-center justify-between gap-3 text-sm' }, [
            h('span', { class: 'text-[#6B7280]' }, label),
            h('span', { class: 'font-semibold text-[#111827] text-right' }, value),
          ])
        )),
      ]),
    });
  },
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    stats.value = await getDashboardStats();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load system status';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
