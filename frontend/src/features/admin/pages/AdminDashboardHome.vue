<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-5 md:gap-6 pb-20 lg:pb-8"
  >
    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
      <StatCard label="Total Routes" :value="10" sub="All types" color="#2B2A27" />
      <StatCard label="Active Stops" :value="48" sub="Live stops" color="#00B86B" />
      <StatCard label="Tickets Today" :value="312" sub="Booked today" color="#0EA5E9" />
      <StatCard label="Total Users" :value="1840" sub="Registered" color="#7C3AED" />
      <StatCard label="Average Fare" value="12 EGP" sub="Across routes" color="#FF7A1A" />
    </div>

    <!-- Middle row: Activity + Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
      <!-- Recent Activity -->
      <Card class="lg:col-span-2">
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-[#E6DEC8]"
        >
          <div>
            <h2
              class="text-base font-bold text-[#2B2A27]"
              style="font-family: 'DM Sans', sans-serif"
            >
              Recent Activity
            </h2>
            <p class="text-xs text-[#6B7280]">Latest admin actions</p>
          </div>
          <Clock class="w-4 h-4 text-[#9CA3AF]" />
        </div>
        <ul class="divide-y divide-[#F3F0E8]">
          <li
            v-for="(activity, i) in ACTIVITY"
            :key="i"
            class="flex items-start gap-3 px-5 py-3.5 hover:bg-[#FFF7D6] transition-colors"
          >
            <span
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              :style="{ background: activity.bg }"
            >
              <component :is="activity.icon" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-[#2B2A27] leading-snug">
                {{ activity.text }}
              </p>
              <p class="text-xs text-[#9CA3AF] mt-0.5">{{ activity.time }}</p>
            </div>
          </li>
        </ul>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <div class="px-5 py-4 border-b border-[#E6DEC8]">
          <h2
            class="text-base font-bold text-[#2B2A27]"
            style="font-family: 'DM Sans', sans-serif"
          >
            Quick Actions
          </h2>
          <p class="text-xs text-[#6B7280]">Jump to common tasks</p>
        </div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <button
            v-for="qa in QUICK_ACTIONS"
            :key="qa.label"
            @click="qa.page && $emit('nav', qa.page)"
            class="flex flex-col items-center gap-2 rounded-2xl py-5 px-3 border-2 border-[#E6DEC8] hover:border-[#FFC400] hover:bg-[#FFF7D6] transition-all group"
          >
            <span
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :style="{ background: qa.bg, color: qa.color }"
            >
              <component :is="qa.icon" class="w-5 h-5" />
            </span>
            <span
              class="text-sm font-semibold text-[#2B2A27] text-center leading-tight"
              >{{ qa.label }}</span
            >
          </button>
        </div>
      </Card>
    </div>

    <!-- Popular Routes -->
    <Card>
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-[#E6DEC8]"
      >
        <div>
          <h2
            class="text-base font-bold text-[#2B2A27]"
            style="font-family: 'DM Sans', sans-serif"
          >
            Popular Routes
          </h2>
          <p class="text-xs text-[#6B7280]">Most booked routes this week</p>
        </div>
        <button
          @click="$emit('nav', 'routes')"
          class="flex items-center gap-1 text-xs font-semibold text-[#FFC400] hover:text-[#F0B700] transition-colors"
        >
          View all <ArrowUpRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden p-4 flex flex-col gap-3">
        <div
          v-for="(route, i) in POPULAR_ROUTES"
          :key="i"
          class="bg-[#FFF7D6] rounded-xl border-2 border-[#E6DEC8] p-4"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <p class="text-sm font-semibold text-[#2B2A27] leading-snug">
              {{ route.name }}
            </p>
            <StatusBadge :status="route.status" />
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border"
              :style="{
                background: TYPE_COLORS[route.type].bg,
                color: TYPE_COLORS[route.type].text,
                borderColor: TYPE_COLORS[route.type].border,
              }"
            >
              {{ route.type }}
            </span>
            <span class="text-xs text-[#6B7280]"
              >· {{ route.tickets.toLocaleString() }} tickets</span
            >
            <span class="text-xs text-[#6B7280]">· {{ route.fare }} EGP</span>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="hidden md:block">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-[#111827]">
              <th
                v-for="h in ['Route', 'Type', 'Tickets', 'Fare', 'Status']"
                :key="h"
                class="text-left px-4 py-3 text-xs font-bold text-[#FFC400] uppercase tracking-wider"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(route, i) in POPULAR_ROUTES"
              :key="i"
              class="hover:bg-[#FFF7D6] transition-colors border-b border-[#F3F0E8] last:border-b-0"
            >
              <td class="px-4 py-3.5">
                <p class="text-sm font-semibold text-[#2B2A27] truncate">
                  {{ route.name }}
                </p>
              </td>
              <td class="px-4 py-3.5">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border"
                  :style="{
                    background: TYPE_COLORS[route.type].bg,
                    color: TYPE_COLORS[route.type].text,
                    borderColor: TYPE_COLORS[route.type].border,
                  }"
                >
                  {{ route.type }}
                </span>
              </td>
              <td class="px-4 py-3.5 text-sm font-semibold text-[#2B2A27]">
                {{ route.tickets.toLocaleString() }}
              </td>
              <td class="px-4 py-3.5 text-sm text-[#6B7280]">
                {{ route.fare }} EGP
              </td>
              <td class="px-4 py-3.5">
                <StatusBadge :status="route.status" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {
  MapPin,
  Ticket,
  Users,
  TrendingUp,
  Plus,
  UserCog,
  Download,
  ArrowUpRight,
  Clock,
} from '@lucide/vue';
import { StatCard, Card, StatusBadge } from '../components/AdminShared.vue';

defineEmits<{
  nav: [page: string];
}>();

const POPULAR_ROUTES = [
  {
    name: 'Line 1 — Helwan to New El-Marg',
    type: 'Metro',
    tickets: 1240,
    fare: 7,
    status: 'Active',
  },
  {
    name: 'CTA 800 — Tahrir to Nasr City',
    type: 'Bus',
    tickets: 890,
    fare: 4,
    status: 'Active',
  },
  {
    name: 'Microbus — Tahrir to Mohandiseen',
    type: 'Microbus',
    tickets: 740,
    fare: 3,
    status: 'Active',
  },
  {
    name: 'Line 2 — Shubra to Cairo Airport',
    type: 'Metro',
    tickets: 620,
    fare: 10,
    status: 'Active',
  },
  {
    name: 'Uber/Careem — Nasr City to New Cairo',
    type: 'Ride-hailing',
    tickets: 310,
    fare: 85,
    status: 'Active',
  },
];

const ACTIVITY = [
  {
    icon: TrendingUp,
    text: 'Route fare updated — CTA 800 raised to 4 EGP',
    time: '2 min ago',
    bg: '#FFFBEB',
  },
  {
    icon: MapPin,
    text: 'New stop added — Zamalek Bridge Bus Stop',
    time: '18 min ago',
    bg: '#ECFDF5',
  },
  {
    icon: Ticket,
    text: 'Ticket MWS-1027 cancelled by user',
    time: '34 min ago',
    bg: '#FEF2F2',
  },
  {
    icon: Users,
    text: 'User Omar Khaled was blocked by admin',
    time: '1 hr ago',
    bg: '#F5F3FF',
  },
  {
    icon: Plus,
    text: 'New route added — Line 3 extension',
    time: '3 hr ago',
    bg: '#EFF6FF',
  },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Metro: { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  Bus: { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0' },
  Microbus: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Walking: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  'Ride-hailing': { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
};

const QUICK_ACTIONS = [
  {
    icon: MapPin,
    label: 'Add Stop',
    page: 'stops',
    color: '#00B86B',
    bg: '#ECFDF5',
  },
  {
    icon: Ticket,
    label: 'View Tickets',
    page: 'tickets',
    color: '#0EA5E9',
    bg: '#EFF6FF',
  },
  {
    icon: UserCog,
    label: 'Manage Users',
    page: 'users',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    icon: Download,
    label: 'Export Data',
    page: '',
    color: '#FFC400',
    bg: '#FFFBEB',
  },
];
</script>
