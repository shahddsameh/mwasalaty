<template>
  <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">
    <Card v-if="error" className="border-red-500/30 bg-red-500/10">
      <div class="p-4 text-sm font-medium text-red-200">{{ error }}</div>
    </Card>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total feedback" :value="feedback.length" color="#38BDF8" />
      <StatCard label="Good feedback" :value="goodCount" color="#10B981" />
      <StatCard label="Bad / issue feedback" :value="badCount" color="#E63946" />
      <StatCard label="Latest feedback" :value="latestFeedbackLabel" color="#FFC400" />
    </div>

    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 md:p-5">
        <div>
          <h2 class="text-lg font-bold text-[#F8FAFC]" style="font-family: &quot;DM Sans&quot;, sans-serif">
            Feedback
          </h2>
          <p class="text-sm text-[#94A3B8]">Journey ratings and rider-reported route issues</p>
        </div>
        <button
          class="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#F8FAFC] hover:border-[#FFC400] hover:text-[#FFC400] disabled:opacity-60"
          :disabled="loading"
          @click="loadFeedback"
        >
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </div>

      <div class="grid gap-3 border-b border-white/10 p-4 md:grid-cols-3">
        <input
          v-model="search"
          type="search"
          placeholder="Search user, origin, destination, or ticket..."
          class="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#FFC400] focus:outline-none md:col-span-2"
        />
        <select
          v-model="ratingFilter"
          class="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] focus:border-[#FFC400] focus:outline-none"
        >
          <option value="all">All ratings</option>
          <option value="good">Good</option>
          <option value="bad">Issue / Bad</option>
        </select>
      </div>

      <div v-if="loading && !feedback.length" class="py-16 text-center text-sm text-[#94A3B8]">
        Loading feedback...
      </div>
      <div v-else-if="!filteredFeedback.length" class="py-16 text-center text-sm text-[#94A3B8]">
        No journey feedback found.
      </div>
      <div v-else class="bg-[#1E293B] rounded-xl overflow-hidden border border-white/10">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1180px] table-fixed text-left text-sm">
            <colgroup>
              <col class="w-[130px]" />
              <col class="w-[150px]" />
              <col class="w-[160px]" />
              <col class="w-[170px]" />
              <col class="w-[130px]" />
              <col class="w-[230px]" />
              <col class="w-[120px]" />
              <col class="w-[160px]" />
            </colgroup>
            <thead class="sticky top-0 bg-[#111827] border-b border-white/10">
              <tr>
                <th class="px-4 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Date</th>
                <th class="px-4 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">User</th>
                <th class="px-4 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Origin</th>
                <th class="px-4 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Destination</th>
                <th class="px-4 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Rating</th>
                <th class="px-4 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Issue preview</th>
                <th class="px-4 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide whitespace-nowrap">Ticket ID</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] uppercase tracking-wide whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr v-for="item in paginatedFeedback" :key="item.id" class="hover:bg-[#0F172A] transition-colors">
                <td class="px-4 py-3 text-[#94A3B8]">
                  <div class="flex flex-col">
                    <span>{{ formatDateParts(item.createdAt)[0] }}</span>
                    <span class="text-xs text-[#64748B]">{{ formatDateParts(item.createdAt)[1] }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate" :title="userLabel(item)">
                  {{ userLabel(item) }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate" :title="item.origin || '-'">
                  {{ item.origin || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate" :title="item.destination || '-'">
                  {{ item.destination || "-" }}
                </td>
                <td class="px-4 py-3">
                  <span :class="ratingBadgeClass(item.rating)">
                    {{ ratingLabel(item.rating) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate" :title="item.issueMessage || '-'">
                  {{ issuePreview(item) }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate" :title="item.ticketId || '-'">
                  {{ item.ticketId || "-" }}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end">
                  <button
                    class="min-w-[118px] whitespace-nowrap rounded-xl border border-white/10 bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-[#FFC400] transition-all hover:border-[#FFC400] hover:bg-[#111827]"
                    @click="selectedFeedback = item"
                  >
                    View details
                  </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <AdminPagination v-model:page="page" :total-items="filteredFeedback.length" :page-size="pageSize" />
      </div>
    </Card>

    <Teleport to="body">
      <div
        v-if="selectedFeedback"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="selectedFeedback = null"
      >
        <div class="bg-[#1E293B] rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-[#111827] px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white">Feedback Details</h2>
              <p class="text-sm text-[#9CA3AF]">ID: {{ selectedFeedback.id }}</p>
            </div>
            <button class="p-2 hover:bg-[#374151] rounded-lg transition-colors" @click="selectedFeedback = null">
              <X class="w-5 h-5 text-[#9CA3AF]" />
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div class="flex flex-wrap items-center gap-3">
              <span :class="ratingBadgeClass(selectedFeedback.rating)">
                {{ ratingLabel(selectedFeedback.rating) }}
              </span>
              <span class="text-sm text-[#94A3B8]">{{ formatDateTime(selectedFeedback.createdAt) }}</span>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <DetailItem label="User" :value="userLabel(selectedFeedback)" />
              <DetailItem label="Ticket ID" :value="selectedFeedback.ticketId || '-'" />
              <DetailItem label="Origin" :value="selectedFeedback.origin || '-'" />
              <DetailItem label="Destination" :value="selectedFeedback.destination || '-'" />
              <DetailItem label="Route ID" :value="selectedFeedback.routeId || '-'" />
              <DetailItem label="Trip ID" :value="selectedFeedback.tripId || '-'" />
            </div>

            <div>
              <h3 class="mb-2 text-sm font-medium text-[#9CA3AF]">Full issue message</h3>
              <div class="rounded-xl bg-[#111827] p-4 text-sm text-[#D1D5DB] whitespace-pre-wrap">
                {{ selectedFeedback.issueMessage || "No issue reported for this feedback." }}
              </div>
            </div>

            <div>
              <h3 class="mb-2 text-sm font-medium text-[#9CA3AF]">Route summary</h3>
              <div class="rounded-xl bg-[#111827] p-4 text-sm text-[#D1D5DB] whitespace-pre-wrap">
                {{ selectedFeedback.routeSummary || "-" }}
              </div>
            </div>

            <div>
              <h3 class="mb-2 text-sm font-medium text-[#9CA3AF]">Transport modes</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="mode in selectedFeedback.transportModes?.length ? selectedFeedback.transportModes : ['-']"
                  :key="mode"
                  class="rounded-full border border-white/10 bg-[#111827] px-3 py-1 text-xs font-semibold text-[#CBD5E1]"
                >
                  {{ mode }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import { X } from "@lucide/vue";
import { Card, StatCard } from "../components/AdminShared.vue";
import AdminPagination from "../components/AdminPagination.vue";
import { listJourneyFeedback, type JourneyFeedback } from "../services/adminApi";

const feedback = ref<JourneyFeedback[]>([]);
const loading = ref(false);
const error = ref("");
const search = ref("");
const ratingFilter = ref<"all" | "good" | "bad">("all");
const page = ref(1);
const pageSize = 10;
const selectedFeedback = ref<JourneyFeedback | null>(null);

const goodCount = computed(() => feedback.value.filter((item) => item.rating === "good").length);
const badCount = computed(() => feedback.value.filter((item) => item.rating === "bad").length);
const latestFeedbackLabel = computed(() => (feedback.value[0]?.createdAt ? formatRelative(feedback.value[0].createdAt) : "-"));

const filteredFeedback = computed(() => {
  const query = search.value.trim().toLowerCase();
  return feedback.value.filter((item) => {
    const searchable = [
      item.id,
      item.user,
      item.userId,
      item.origin,
      item.destination,
      item.ticketId,
      item.issueMessage,
      item.routeSummary,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (ratingFilter.value === "all" || item.rating === ratingFilter.value)
    );
  });
});

const paginatedFeedback = computed(() =>
  filteredFeedback.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);

watch([search, ratingFilter], () => {
  page.value = 1;
});

watch(
  () => filteredFeedback.value.length,
  () => {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(filteredFeedback.value.length / pageSize)));
  },
);

onMounted(loadFeedback);

async function loadFeedback() {
  loading.value = true;
  error.value = "";
  try {
    feedback.value = await listJourneyFeedback();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load feedback";
  } finally {
    loading.value = false;
  }
}

function ratingLabel(rating: string) {
  return rating === "bad" ? "Issue / Bad" : "Good";
}

function ratingBadgeClass(rating: string) {
  return [
    "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
    rating === "bad"
      ? "border border-red-400/30 bg-red-500/10 text-red-300"
      : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  ];
}

function userLabel(item: JourneyFeedback) {
  return item.user || item.userId || "Guest";
}

function issuePreview(item: JourneyFeedback) {
  if (item.rating === "good") return "No issue";
  return item.issueMessage || "-";
}

function formatDateParts(value?: string | null) {
  if (!value) return ["-", ""];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return ["-", ""];
  return [date.toLocaleDateString(), date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })];
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const DetailItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "rounded-xl bg-[#111827] p-4" }, [
        h("div", { class: "mb-1 text-xs font-semibold uppercase tracking-wide text-[#64748B]" }, props.label),
        h("div", { class: "break-words text-sm text-[#F8FAFC]" }, props.value),
      ]);
  },
});
</script>
