<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5 max-w-[1440px] mx-auto">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <button
        v-for="filterOption in filterOptions"
        :key="filterOption.value"
        @click="statusFilter = filterOption.value"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          statusFilter === filterOption.value
            ? 'bg-[#FFC400] text-[#111827]'
            : 'bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:bg-[#111827] hover:text-white',
        ]"
      >
        {{ filterOption.label }}
        <span
          v-if="filterOption.count"
          class="ml-2 px-2 py-0.5 rounded-full text-xs"
          :class="
            statusFilter === filterOption.value
              ? 'bg-[#111827] text-[#FFC400]'
              : 'bg-[#111827] text-[#9CA3AF]'
          "
        >
          {{ filterOption.count }}
        </span>
      </button>
      <button
        @click="loadTickets"
        :disabled="loading || updating"
        class="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:bg-[#111827] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading && tickets.length ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && tickets.length === 0" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-[#FFC400] border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-[#9CA3AF]">Loading support tickets...</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error && tickets.length === 0"
      class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center"
    >
      <p class="text-red-200 mb-4">{{ error }}</p>
      <button
        @click="loadTickets"
        class="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
      >
        Retry
      </button>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      {{ error }}
    </div>

    <div
      v-else-if="loading"
      class="rounded-xl border border-white/10 bg-[#1E293B] px-4 py-3 text-sm text-[#9CA3AF]"
    >
      Refreshing support tickets...
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredTickets.length === 0"
      class="bg-[#1E293B] border border-white/10 rounded-2xl p-12 text-center"
    >
      <MessageSquare class="w-16 h-16 text-[#64748B] mx-auto mb-4" />
      <h3 class="text-xl font-bold text-white mb-2">No support tickets</h3>
      <p class="text-[#9CA3AF]">
        {{
          statusFilter === "all"
            ? "No customer support requests yet."
            : `No ${statusFilter} tickets.`
        }}
      </p>
    </div>

    <!-- Tickets Table -->
    <div v-else class="bg-[#1E293B] rounded-2xl overflow-hidden border border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[920px] table-fixed">
          <colgroup>
            <col class="w-[22%]" />
            <col class="w-[22%]" />
            <col class="w-[25%]" />
            <col class="w-[12%]" />
            <col class="w-[11%]" />
            <col class="w-[8%]" />
          </colgroup>
          <thead class="sticky top-0 bg-[#111827] border-b border-white/10">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                Customer
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                Contact
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                Message
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                Date
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
              >
                Status
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
              <td class="px-4 py-3 align-top">
                <div class="truncate font-medium text-white">{{ ticket.name }}</div>
                <div
                  v-if="ticket.subject"
                  class="truncate text-sm text-[#9CA3AF] mt-0.5"
                >
                  {{ ticket.subject }}
                </div>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="truncate text-sm text-[#9CA3AF]">{{ ticket.email }}</div>
                <div v-if="ticket.phone" class="truncate text-sm text-[#9CA3AF]">
                  {{ ticket.phone }}
                </div>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="truncate text-sm text-[#9CA3AF]">
                  {{ ticket.message }}
                </div>
              </td>
              <td class="px-4 py-3 align-top text-sm text-[#94A3B8] whitespace-nowrap">
                {{ formatDate(ticket.createdAt) }}
              </td>
              <td class="px-4 py-3 align-top">
                <span
                  :class="[
                    'inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium',
                    statusColors[ticket.status],
                  ]"
                >
                  {{ statusLabels[ticket.status] }}
                </span>
              </td>
              <td class="px-4 py-3 align-top text-right">
                <button
                  @click="openTicket(ticket)"
                  class="whitespace-nowrap rounded-xl border border-white/10 bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-[#FFC400] transition-all hover:border-[#FFC400] hover:bg-[#111827]"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AdminPagination v-model:page="page" :total-items="filteredTickets.length" :page-size="pageSize" />
    </div>

    <!-- Ticket Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedTicket"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="closeTicket"
      >
        <div
          class="bg-[#1E293B] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <!-- Modal Header -->
          <div
            class="sticky top-0 bg-[#111827] px-6 py-4 border-b border-white/10 flex items-center justify-between"
          >
            <div>
              <h2 class="text-xl font-bold text-white">Support Ticket</h2>
              <p class="text-sm text-[#9CA3AF]">ID: {{ selectedTicket.id }}</p>
            </div>
            <button
              @click="closeTicket"
              class="p-2 hover:bg-[#374151] rounded-lg transition-colors"
            >
              <X class="w-5 h-5 text-[#9CA3AF]" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-6">
            <!-- Customer Info -->
            <div>
              <h3 class="text-sm font-medium text-[#9CA3AF] mb-3">
                Customer Information
              </h3>
              <div class="bg-[#111827] rounded-lg p-4 space-y-2">
                <div class="flex items-center gap-2">
                  <User class="w-4 h-4 text-[#9CA3AF]" />
                  <span class="text-white">{{ selectedTicket.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4 text-[#9CA3AF]" />
                  <span class="text-[#9CA3AF]">{{ selectedTicket.email }}</span>
                </div>
                <div
                  v-if="selectedTicket.phone"
                  class="flex items-center gap-2"
                >
                  <Phone class="w-4 h-4 text-[#9CA3AF]" />
                  <span class="text-[#9CA3AF]">{{ selectedTicket.phone }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Calendar class="w-4 h-4 text-[#9CA3AF]" />
                  <span class="text-[#9CA3AF]">{{
                    formatDateTime(selectedTicket.createdAt)
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
                      statusColors[selectedTicket.status],
                    ]"
                  >
                    {{ statusLabels[selectedTicket.status] }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Subject -->
            <div v-if="selectedTicket.subject">
              <h3 class="text-sm font-medium text-[#9CA3AF] mb-2">Subject</h3>
              <p class="text-white">{{ selectedTicket.subject }}</p>
            </div>

            <!-- Message -->
            <div>
              <h3 class="text-sm font-medium text-[#9CA3AF] mb-2">Message</h3>
              <div
                class="bg-[#111827] rounded-lg p-4 text-[#9CA3AF] whitespace-pre-wrap"
              >
                {{ selectedTicket.message }}
              </div>
            </div>

            <!-- Reply History -->
            <div>
              <h3 class="text-sm font-medium text-[#9CA3AF] mb-2">
                Reply History
              </h3>
              <div
                v-if="replyHistory.length === 0"
                class="bg-[#111827] rounded-lg p-4 text-sm text-[#9CA3AF]"
              >
                No admin replies have been sent yet.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="reply in replyHistory"
                  :key="reply.id"
                  class="bg-[#111827] rounded-lg p-4"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
                    <span class="truncate">To: {{ reply.to }}</span>
                    <span class="whitespace-nowrap">{{ formatDateTime(reply.sentAt) }}</span>
                  </div>
                  <div class="mt-2 text-sm font-medium text-white">
                    {{ reply.subject }}
                  </div>
                  <div class="mt-2 whitespace-pre-wrap text-sm text-[#D1D5DB]">
                    {{ reply.message }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Status Update -->
            <div>
              <h3 class="text-sm font-medium text-[#9CA3AF] mb-3">
                Update Status
              </h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="status in statusOptions"
                  :key="status.value"
                  @click="updateStatus(status.value)"
                  :disabled="updating"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedTicket.status === status.value
                      ? 'bg-[#FFC400] text-[#111827]'
                      : 'bg-[#374151] text-[#9CA3AF] hover:bg-[#4B5563] hover:text-white',
                    updating && 'opacity-50 cursor-not-allowed',
                  ]"
                >
                  {{ status.label }}
                </button>
              </div>
            </div>

            <!-- Admin Note -->
            <div>
              <h3 class="text-sm font-medium text-[#9CA3AF] mb-2">
                Internal Note
              </h3>
              <textarea
                v-model="adminNoteInput"
                rows="3"
                class="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#FFC400] resize-none"
                placeholder="Add internal note (not visible to customer)..."
              ></textarea>
              <button
                @click="saveAdminNote"
                :disabled="updating || !adminNoteInput.trim()"
                class="mt-2 px-4 py-2 bg-[#FFC400] hover:bg-[#FFD633] text-[#111827] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
              <div
                v-if="selectedTicket.adminNote"
                class="mt-3 p-3 bg-[#111827] rounded-lg text-[#9CA3AF] text-sm"
              >
                <div class="font-medium text-white mb-1">Previous Note:</div>
                {{ selectedTicket.adminNote }}
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-[#9CA3AF] mb-2">
                Reply to Customer
              </h3>
              <textarea
                v-model="replyInput"
                rows="4"
                class="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#FFC400] resize-none"
                placeholder="Write a reply to send by email..."
              ></textarea>
              <p v-if="replyMessage" class="mt-2 text-sm" :class="replyOk ? 'text-green-300' : 'text-red-300'">
                {{ replyMessage }}
              </p>
              <button
                @click="sendReply"
                :disabled="updating || !replyInput.trim()"
                class="mt-2 px-4 py-2 bg-[#FFC400] hover:bg-[#FFD633] text-[#111827] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Reply & Resolve
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import AdminPagination from "../components/AdminPagination.vue";
import { MessageSquare, X, User, Mail, Phone, Calendar } from "@lucide/vue";
import {
  getSupportTickets,
  replySupportTicket,
  updateSupportTicket,
  type SupportTicket,
} from "../services/adminApi";

const loading = ref(false);
const error = ref("");
const tickets = ref<SupportTicket[]>([]);
const statusFilter = ref<string>("all");
const page = ref(1);
const pageSize = 10;
const selectedTicket = ref<SupportTicket | null>(null);
const updating = ref(false);
const adminNoteInput = ref("");
const replyInput = ref("");
const replyMessage = ref("");
const replyOk = ref(false);

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

const statusLabels: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-900/30 text-blue-300",
  in_progress: "bg-yellow-900/30 text-yellow-300",
  resolved:
    "border border-success/30 bg-success-soft text-success dark:border-green-300/20 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-700 text-gray-300",
};

const filterOptions = computed(() => [
  { value: "all", label: "All", count: tickets.value.length },
  {
    value: "new",
    label: "New",
    count: tickets.value.filter((t) => t.status === "new").length,
  },
  {
    value: "in_progress",
    label: "In Progress",
    count: tickets.value.filter((t) => t.status === "in_progress").length,
  },
  {
    value: "resolved",
    label: "Resolved",
    count: tickets.value.filter((t) => t.status === "resolved").length,
  },
  {
    value: "closed",
    label: "Closed",
    count: tickets.value.filter((t) => t.status === "closed").length,
  },
]);

const filteredTickets = computed(() => {
  if (statusFilter.value === "all") return tickets.value;
  return tickets.value.filter((t) => t.status === statusFilter.value);
});
const paginatedTickets = computed(() => filteredTickets.value.slice((page.value - 1) * pageSize, page.value * pageSize));

watch(statusFilter, () => { page.value = 1; });
watch(() => filteredTickets.value.length, () => {
  page.value = Math.min(page.value, Math.max(1, Math.ceil(filteredTickets.value.length / pageSize)));
});

const replyHistory = computed(() => {
  if (!selectedTicket.value) return [];
  const replies = selectedTicket.value.replies || [];
  if (replies.length) return replies;
  if (!selectedTicket.value.adminReply) return [];
  return [
    {
      id: "legacy-admin-reply",
      to: selectedTicket.value.email,
      subject: `Re: ${selectedTicket.value.subject || "Mwasalaty support request"}`,
      message: selectedTicket.value.adminReply,
      sentAt: selectedTicket.value.repliedAt || selectedTicket.value.updatedAt,
    },
  ];
});

onMounted(() => {
  loadTickets();
});

async function loadTickets() {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    console.log("[AdminSupportTickets] Loading support tickets...");
    const nextTickets = await getSupportTickets();
    console.log("[AdminSupportTickets] Loaded tickets:", nextTickets.length);
    // Sort by date, newest first
    nextTickets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    tickets.value = nextTickets;
    if (selectedTicket.value) {
      selectedTicket.value =
        nextTickets.find((ticket) => ticket.id === selectedTicket.value?.id) ??
        selectedTicket.value;
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load support tickets";
    console.error("[AdminSupportTickets] Error loading tickets:", {
      error: err,
      message: error.value,
    });
  } finally {
    loading.value = false;
  }
}

function openTicket(ticket: SupportTicket) {
  selectedTicket.value = ticket;
  adminNoteInput.value = ticket.adminNote || "";
  replyInput.value = "";
  replyMessage.value = "";
}

function closeTicket() {
  selectedTicket.value = null;
  adminNoteInput.value = "";
  replyInput.value = "";
  replyMessage.value = "";
}

async function updateStatus(status: SupportTicket["status"]) {
  if (!selectedTicket.value || updating.value) return;

  updating.value = true;
  try {
    const updated = await updateSupportTicket(selectedTicket.value.id, {
      status,
    });

    // Update in list
    const index = tickets.value.findIndex(
      (t) => t.id === selectedTicket.value!.id,
    );
    if (index !== -1) {
      tickets.value[index] = updated;
    }

    // Update selected ticket
    selectedTicket.value = updated;
    window.dispatchEvent(new CustomEvent("admin-notifications-refresh"));
  } catch (err) {
    alert(err instanceof Error ? err.message : "Failed to update status");
    console.error("Failed to update status:", err);
  } finally {
    updating.value = false;
  }
}

async function saveAdminNote() {
  if (!selectedTicket.value || !adminNoteInput.value.trim() || updating.value)
    return;

  updating.value = true;
  try {
    const updated = await updateSupportTicket(selectedTicket.value.id, {
      adminNote: adminNoteInput.value.trim(),
    });

    // Update in list
    const index = tickets.value.findIndex(
      (t) => t.id === selectedTicket.value!.id,
    );
    if (index !== -1) {
      tickets.value[index] = updated;
    }

    // Update selected ticket
    selectedTicket.value = updated;
    adminNoteInput.value = "";
  } catch (err) {
    alert(err instanceof Error ? err.message : "Failed to save note");
    console.error("Failed to save note:", err);
  } finally {
    updating.value = false;
  }
}

async function sendReply() {
  if (!selectedTicket.value || !replyInput.value.trim() || updating.value) return;

  updating.value = true;
  replyMessage.value = "";
  try {
    const updated = await replySupportTicket(selectedTicket.value.id, replyInput.value.trim());
    const index = tickets.value.findIndex((t) => t.id === selectedTicket.value!.id);
    if (index !== -1) tickets.value[index] = updated;
    selectedTicket.value = updated;
    replyInput.value = "";
    replyOk.value = true;
    replyMessage.value = "Reply sent and ticket resolved.";
    window.dispatchEvent(new CustomEvent("admin-notifications-refresh"));
  } catch (err) {
    const maybeTicket = (err as Error & { ticket?: SupportTicket }).ticket;
    if (maybeTicket) {
      const index = tickets.value.findIndex((t) => t.id === maybeTicket.id);
      if (index !== -1) tickets.value[index] = maybeTicket;
      selectedTicket.value = maybeTicket;
    }
    replyOk.value = false;
    replyMessage.value = err instanceof Error ? err.message : "Failed to send reply";
  } finally {
    updating.value = false;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
</script>
