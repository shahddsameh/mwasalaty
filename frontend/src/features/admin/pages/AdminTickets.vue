<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5"
  >
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total Tickets" :value="tickets.length" color="#38BDF8" />
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
        class="flex flex-col gap-3 border-b border-white/10 p-4 md:p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2
            class="text-lg font-bold text-[#F8FAFC]"
            style="font-family: &quot;DM Sans&quot;, sans-serif"
          >
            Tickets
          </h2>
          <p class="text-sm text-[#94A3B8]">User bookings and payment status</p>
        </div>
        <button
          class="w-full rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#F8FAFC] hover:border-[#FFC400] hover:text-[#FFC400] sm:w-auto"
          :disabled="loading"
          @click="loadTickets"
        >
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </div>
      <div
        class="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          v-model="search"
          type="search"
          placeholder="Search ticket, user, or route..."
          class="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#FFC400] focus:outline-none"
        />
        <select
          v-model="statusFilter"
          class="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] focus:border-[#FFC400] focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
        <select
          v-model="paymentMethodFilter"
          class="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] focus:border-[#FFC400] focus:outline-none"
        >
          <option value="all">All payment methods</option>
          <option
            v-for="method in paymentMethodOptions"
            :key="method"
            :value="method"
          >
            {{ method }}
          </option>
        </select>
        <input
          v-model="dateFilter"
          type="date"
          class="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] focus:border-[#FFC400] focus:outline-none"
        />
      </div>
      <div v-if="loading" class="py-16 text-center text-sm text-[#94A3B8]">
        Loading tickets...
      </div>
      <div
        v-else-if="!filteredTickets.length"
        class="py-16 text-center text-sm text-[#94A3B8]"
      >
        No matching transactions.
      </div>
      <div
        v-else
        class="bg-[#1E293B] rounded-xl overflow-hidden border border-white/10"
      >
        <!-- Desktop Table Layout -->
        <div class="hidden md:block overflow-x-auto">
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
            <thead class="sticky top-0 bg-[#111827] border-b border-white/10">
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
            <tbody class="divide-y divide-white/10">
              <tr
                v-for="ticket in paginatedTickets"
                :key="ticket.id"
                class="hover:bg-[#0F172A] transition-colors"
              >
                <td
                  class="px-4 py-3 font-medium text-white truncate max-w-[220px]"
                >
                  {{ ticket.ticketId }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate max-w-[160px]">
                  {{ ticket.userName || ticket.userId || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate max-w-[420px]">
                  {{ routeText(ticket) }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  <div class="w-full truncate" :title="ticket.status || '-'">
                    {{ ticket.status || "-" }}
                  </div>
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  <div
                    class="w-full truncate"
                    :title="ticket.paymentStatus || '-'"
                  >
                    {{ ticket.paymentStatus || "-" }}
                  </div>
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  <div class="flex flex-col">
                    <span class="whitespace-normal">{{
                      formatDateParts(ticket.created_at)[0]
                    }}</span>
                    <span class="text-xs text-[#64748B]">{{
                      formatDateParts(ticket.created_at)[1]
                    }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  <div class="flex flex-col">
                    <span class="whitespace-normal">{{
                      formatDateParts(ticket.valid_until)[0]
                    }}</span>
                    <span class="text-xs text-[#64748B]">{{
                      formatDateParts(ticket.valid_until)[1]
                    }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end">
                    <button
                      class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-semibold text-[#10B981] transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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

        <!-- Mobile Card Layout -->
        <div class="md:hidden divide-y divide-white/10">
          <div
            v-for="ticket in paginatedTickets"
            :key="ticket.id"
            class="p-4 flex flex-col gap-3 hover:bg-[#0F172A] transition-colors text-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <span class="text-xs font-semibold text-[#9CA3AF]">TICKET ID</span>
                <p class="font-semibold text-white break-all mt-0.5">{{ ticket.ticketId }}</p>
              </div>
              <div class="flex-shrink-0 text-right">
                <span class="text-xs font-semibold text-[#9CA3AF]">STATUS</span>
                <div class="mt-0.5">
                  <span class="inline-block rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white">{{ ticket.status || "-" }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="font-semibold text-[#9CA3AF]">USER</span>
                <p class="text-[#94A3B8] truncate mt-0.5">{{ ticket.userName || ticket.userId || "-" }}</p>
              </div>
              <div>
                <span class="font-semibold text-[#9CA3AF]">PAYMENT</span>
                <p class="text-[#94A3B8] truncate mt-0.5">{{ ticket.paymentStatus || "-" }}</p>
              </div>
            </div>

            <div class="text-xs">
              <span class="font-semibold text-[#9CA3AF]">ROUTE</span>
              <p class="text-[#94A3B8] break-words mt-0.5 whitespace-normal">{{ routeText(ticket) }}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="font-semibold text-[#9CA3AF]">CREATED</span>
                <p class="text-[#94A3B8] mt-0.5 flex flex-col">
                  <span class="whitespace-normal">{{ formatDateParts(ticket.created_at)[0] }}</span>
                  <span class="text-[10px] text-[#64748B]">{{ formatDateParts(ticket.created_at)[1] }}</span>
                </p>
              </div>
              <div>
                <span class="font-semibold text-[#9CA3AF]">VALID UNTIL</span>
                <p class="text-[#94A3B8] mt-0.5 flex flex-col">
                  <span class="whitespace-normal">{{ formatDateParts(ticket.valid_until)[0] }}</span>
                  <span class="text-[10px] text-[#64748B]">{{ formatDateParts(ticket.valid_until)[1] }}</span>
                </p>
              </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-white/5">
              <button
                class="w-full sm:w-auto rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-semibold text-[#10B981] transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="busyId === ticket.id"
                @click="activate(ticket.id)"
              >
                {{ busyId === ticket.id ? "Updating..." : "Active" }}
              </button>
            </div>
          </div>
        </div>

        <AdminPagination
          v-model:page="page"
          :total-items="filteredTickets.length"
          :page-size="pageSize"
        />
      </div>
    </Card>

    <!-- Details modal removed: View Details button no longer present -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Card, StatCard } from "../components/AdminShared.vue";
import AdminPagination from "../components/AdminPagination.vue";
import {
  activateAdminTicket,
  listAdminTickets,
  type AdminTicket,
} from "../services/adminApi";

const tickets = ref<AdminTicket[]>([]);
const loading = ref(false);
const error = ref("");
const busyId = ref<string | null>(null);
const search = ref("");
const statusFilter = ref("all");
const paymentMethodFilter = ref("all");
const dateFilter = ref("");
const page = ref(1);
const pageSize = 10;

function paymentMethod(ticket: AdminTicket) {
  const direct = ticket["paymentMethod"];
  const raw = ticket.raw as { payment?: { method?: unknown } } | undefined;
  return String(direct || raw?.payment?.method || "Unknown");
}

function transactionStatus(ticket: AdminTicket) {
  return String(ticket.paymentStatus || ticket.status || "Unknown");
}

function createdDate(ticket: AdminTicket) {
  if (!ticket.created_at) return "";
  const date = new Date(ticket.created_at);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

const statusOptions = computed(() =>
  [...new Set(tickets.value.map(transactionStatus))].sort(),
);
const paymentMethodOptions = computed(() =>
  [...new Set(tickets.value.map(paymentMethod))].sort(),
);
const filteredTickets = computed(() => {
  const query = search.value.trim().toLowerCase();
  return tickets.value.filter((ticket) => {
    const status = transactionStatus(ticket);
    const searchable = [
      ticket.ticketId,
      ticket.userName,
      ticket.userId,
      ticket.route,
      ticket.from,
      ticket.to,
      ticket.status,
      ticket.paymentStatus,
      paymentMethod(ticket),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (statusFilter.value === "all" || status === statusFilter.value) &&
      (paymentMethodFilter.value === "all" ||
        paymentMethod(ticket) === paymentMethodFilter.value) &&
      (!dateFilter.value || createdDate(ticket) === dateFilter.value)
    );
  });
});
const paginatedTickets = computed(() =>
  filteredTickets.value.slice(
    (page.value - 1) * pageSize,
    page.value * pageSize,
  ),
);

watch([search, statusFilter, paymentMethodFilter, dateFilter], () => {
  page.value = 1;
});
watch(
  () => filteredTickets.value.length,
  () => {
    page.value = Math.min(
      page.value,
      Math.max(1, Math.ceil(filteredTickets.value.length / pageSize)),
    );
  },
);

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
    const ticket = await action(id);
    console.log("reactivated ticket response", ticket);
    console.log("expiresAt", ticket.expires_at || ticket.valid_until);
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
