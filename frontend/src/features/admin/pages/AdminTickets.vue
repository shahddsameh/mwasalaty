<template>
  <div class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6">
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total Tickets" :value="tickets.length" color="#2B2A27" />
      <StatCard label="Active" :value="tickets.filter((t) => t.status === 'active').length" color="#00B86B" />
      <StatCard label="Refunded" :value="tickets.filter((t) => t.status === 'refunded').length" color="#7C3AED" />
      <StatCard label="Refund Issues" :value="tickets.filter((t) => t.refundStatus === 'refund_failed').length" color="#E63946" />
    </div>

    <Card>
      <div class="flex items-center justify-between gap-3 border-b border-[#E6DEC8] p-4 md:p-5">
        <div>
          <h2 class="text-lg font-bold text-[#2B2A27]" style="font-family: 'DM Sans', sans-serif">Tickets</h2>
          <p class="text-sm text-[#6B7280]">User bookings and payment status</p>
        </div>
        <button class="rounded-xl border border-[#E6DEC8] px-4 py-2 text-sm font-semibold hover:bg-[#FFF7D6]" :disabled="loading" @click="loadTickets">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
      <div v-if="loading" class="py-16 text-center text-sm text-[#6B7280]">Loading tickets...</div>
      <div v-else-if="!tickets.length" class="py-16 text-center text-sm text-[#6B7280]">No tickets yet.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead class="bg-[#111827] text-[#FFC400] uppercase text-xs tracking-wide">
            <tr>
              <th class="px-4 py-3">Ticket ID</th>
              <th class="px-4 py-3">User</th>
              <th class="px-4 py-3">Route</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Payment</th>
              <th class="px-4 py-3">Created</th>
              <th class="px-4 py-3">Valid Until</th>
              <th class="px-4 py-3">Refund</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in tickets" :key="ticket.id" class="border-b border-[#E6DEC8]">
              <td class="px-4 py-3 font-semibold text-[#111827]">{{ ticket.ticketId }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ ticket.userName || ticket.userId || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ routeText(ticket) }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ ticket.status || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ ticket.paymentStatus || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ formatDate(ticket.created_at) }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ formatDate(ticket.valid_until) }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ ticket.refundStatus || '-' }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                  <button class="rounded-lg border px-3 py-1.5 font-semibold" @click="selectedTicket = ticket">View Details</button>
                  <button class="rounded-lg border border-[#A7F3D0] px-3 py-1.5 font-semibold text-[#047857]" :disabled="busyId === ticket.id" @click="activate(ticket.id)">Mark Active</button>
                  <button class="rounded-lg border border-[#DDD6FE] px-3 py-1.5 font-semibold text-[#6D28D9]" :disabled="busyId === ticket.id" @click="refunded(ticket.id)">Mark Refunded</button>
                  <button class="rounded-lg border border-[#FCA5A5] px-3 py-1.5 font-semibold text-[#B91C1C]" :disabled="busyId === ticket.id" @click="refundFailed(ticket.id)">Refund Failed</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Card v-if="selectedTicket">
      <div class="p-4 md:p-5 border-b border-[#E6DEC8] flex items-center justify-between gap-4">
        <h3 class="text-lg font-bold text-[#2B2A27]">Ticket Details</h3>
        <button class="rounded-lg border border-[#E6DEC8] px-3 py-1.5 text-sm font-semibold" @click="selectedTicket = null">Close</button>
      </div>
      <div class="p-4 md:p-5 grid gap-4 md:grid-cols-2 text-sm">
        <Detail label="Ticket ID" :value="selectedTicket.ticketId" />
        <Detail label="User" :value="selectedTicket.userName || selectedTicket.userId || '-'" />
        <Detail label="Route" :value="routeText(selectedTicket)" />
        <Detail label="Status" :value="selectedTicket.status || '-'" />
        <Detail label="Payment Status" :value="selectedTicket.paymentStatus || '-'" />
        <Detail label="Refund Status" :value="selectedTicket.refundStatus || '-'" />
        <Detail label="Created" :value="formatDate(selectedTicket.created_at)" />
        <Detail label="Valid Until" :value="formatDate(selectedTicket.valid_until)" />
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from 'vue';
import { Card, StatCard } from '../components/AdminShared.vue';
import {
  activateAdminTicket,
  listAdminTickets,
  markAdminTicketRefundFailed,
  markAdminTicketRefunded,
  type AdminTicket,
} from '../services/adminApi';

const tickets = ref<AdminTicket[]>([]);
const selectedTicket = ref<AdminTicket | null>(null);
const loading = ref(false);
const error = ref('');
const busyId = ref<string | null>(null);

const Detail = defineComponent({
  props: { label: String, value: [String, Number] },
  setup(props) {
    return () => h('div', { class: 'rounded-xl border border-[#E6DEC8] p-3' }, [
      h('div', { class: 'text-xs text-[#6B7280]' }, props.label),
      h('div', { class: 'mt-1 font-semibold text-[#111827]' }, String(props.value ?? '-')),
    ]);
  },
});

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function routeText(ticket: AdminTicket) {
  return [ticket.route, ticket.from, ticket.to].filter(Boolean).join(' | ') || '-';
}

async function loadTickets() {
  loading.value = true;
  error.value = '';
  try {
    tickets.value = await listAdminTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load tickets';
  } finally {
    loading.value = false;
  }
}

async function runAction(id: string, action: (id: string) => Promise<AdminTicket>) {
  busyId.value = id;
  error.value = '';
  try {
    await action(id);
    await loadTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ticket update failed';
  } finally {
    busyId.value = null;
  }
}

function activate(id: string) {
  runAction(id, activateAdminTicket);
}

function refunded(id: string) {
  runAction(id, markAdminTicketRefunded);
}

function refundFailed(id: string) {
  runAction(id, markAdminTicketRefundFailed);
}

onMounted(loadTickets);
</script>
