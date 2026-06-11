<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6"
  >
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total Tickets" :value="tickets.length" color="#2B2A27" />
      <StatCard
        label="Active"
        :value="tickets.filter((t) => t.status === 'active').length"
        color="#00B86B"
      />
      <StatCard
        label="Refunded"
        :value="tickets.filter((t) => t.status === 'refunded').length"
        color="#7C3AED"
      />
      <StatCard
        label="Refund Issues"
        :value="
          tickets.filter((t) => t.refundStatus === 'refund_failed').length
        "
        color="#E63946"
      />
    </div>

    <Card>
      <div
        class="flex items-center justify-between gap-3 border-b border-[#E6DEC8] p-4 md:p-5"
      >
        <div>
          <h2
            class="text-lg font-bold text-[#2B2A27]"
            style="font-family: &quot;DM Sans&quot;, sans-serif"
          >
            Tickets
          </h2>
          <p class="text-sm text-[#6B7280]">User bookings and payment status</p>
        </div>
        <button
          class="rounded-xl border border-[#E6DEC8] px-4 py-2 text-sm font-semibold hover:bg-[#FFF7D6]"
          :disabled="loading"
          @click="loadTickets"
        >
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </div>
      <div v-if="loading" class="py-16 text-center text-sm text-[#6B7280]">
        Loading tickets...
      </div>
      <div
        v-else-if="!tickets.length"
        class="py-16 text-center text-sm text-[#6B7280]"
      >
        No tickets yet.
      </div>
      <div
        v-else
        class="bg-[#1F2937] rounded-xl overflow-hidden border border-[#374151]"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] table-fixed text-left text-sm">
            <colgroup>
              <col class="w-[16%]" />
              <col class="w-[12%]" />
              <col class="w-[28%]" />
              <col class="w-[8%]" />
              <col class="w-[8%]" />
              <col class="w-[10%]" />
              <col class="w-[10%]" />
              <col class="w-[8%]" />
            </colgroup>
            <thead class="bg-[#111827] border-b border-[#374151]">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Ticket ID
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  User
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Route
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Payment
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Created
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Valid Until
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#374151]">
              <tr
                v-for="ticket in tickets"
                :key="ticket.id"
                class="hover:bg-[#111827] transition-colors"
              >
                <td
                  class="px-4 py-4 font-medium text-white truncate max-w-[220px]"
                >
                  {{ ticket.ticketId }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF] truncate max-w-[160px]">
                  {{ ticket.userName || ticket.userId || "-" }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF] truncate max-w-[420px]">
                  {{ routeText(ticket) }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF] whitespace-nowrap">
                  {{ ticket.status || "-" }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF] whitespace-nowrap">
                  {{ ticket.paymentStatus || "-" }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF]">
                  <div class="flex flex-col">
                    <span class="whitespace-normal">{{
                      formatDateParts(ticket.created_at)[0]
                    }}</span>
                    <span class="text-xs text-[#9CA3AF]">{{
                      formatDateParts(ticket.created_at)[1]
                    }}</span>
                  </div>
                </td>
                <td class="px-4 py-4 text-[#9CA3AF]">
                  <div class="flex flex-col">
                    <span class="whitespace-normal">{{
                      formatDateParts(ticket.valid_until)[0]
                    }}</span>
                    <span class="text-xs text-[#9CA3AF]">{{
                      formatDateParts(ticket.valid_until)[1]
                    }}</span>
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="flex justify-end">
                    <button
                      class="rounded-lg border border-[#0F766E] bg-[#ECFDF5] px-3 py-1.5 font-semibold text-[#0F766E] transition-all hover:bg-[#D1FAE5] active:bg-[#A7F3D0] disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="busyId === ticket.id"
                      @click="activate(ticket.id)"
                    >
                      {{ busyId === ticket.id ? "Updating..." : "Active" }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>

    <!-- Details modal removed: View Details button no longer present -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Card, StatCard } from "../components/AdminShared.vue";
import {
  activateAdminTicket,
  listAdminTickets,
  type AdminTicket,
} from "../services/adminApi";

const tickets = ref<AdminTicket[]>([]);
const loading = ref(false);
const error = ref("");
const busyId = ref<string | null>(null);

function formatDateParts(value?: string) {
  if (!value) return ["-", ""];
  const d = new Date(value);
  return [d.toLocaleDateString(), d.toLocaleTimeString()];
}

function routeText(ticket: AdminTicket) {
  return (
    [ticket.route, ticket.from, ticket.to].filter(Boolean).join(" | ") || "-"
  );
}

async function loadTickets() {
  loading.value = true;
  error.value = "";
  try {
    tickets.value = await listAdminTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load tickets";
  } finally {
    loading.value = false;
  }
}

async function runAction(
  id: string,
  action: (id: string) => Promise<AdminTicket>,
) {
  busyId.value = id;
  error.value = "";
  try {
    await action(id);
    await loadTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Ticket update failed";
  } finally {
    busyId.value = null;
  }
}

function activate(id: string) {
  runAction(id, activateAdminTicket);
}

onMounted(loadTickets);
</script>
