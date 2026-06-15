<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Total Stops" :value="stops.length" color="#38BDF8" />
      <StatCard label="With Location" :value="locatedStops" color="#00B86B" />
      <StatCard
        label="Missing Location"
        :value="stops.length - locatedStops"
        color="#E63946"
      />
      <StatCard label="Visible" :value="filteredStops.length" color="#FFC107" />
    </div>

    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <Card>
      <div class="p-4 md:p-5 border-b border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative w-full sm:flex-1">
          <Search
            class="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            v-model="search"
            placeholder="Search stops..."
            class="w-full pl-9 pr-4 py-2 border border-white/10 rounded-xl text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#FFC400] bg-[#0F172A]"
          />
        </div>
        <button
          @click="loadStops"
          class="p-2 rounded-xl border border-white/10 text-[#94A3B8] hover:border-[#FFC400] hover:text-[#FFC400] transition-all flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>

      <div
        v-if="loading"
        class="flex items-center justify-center py-16 text-[#94A3B8] text-sm"
      >
        Loading stops...
      </div>

      <div
        v-else-if="filteredStops.length > 0"
        class="bg-[#1E293B] rounded-xl overflow-hidden border border-white/10"
      >
        <!-- Desktop Table Layout -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full min-w-[920px] table-fixed text-left text-sm">
            <colgroup>
              <col class="w-[34%]" />
              <col class="w-[14%]" />
              <col class="w-[14%]" />
              <col class="w-[22%]" />
              <col class="w-[16%]" />
            </colgroup>
            <thead class="sticky top-0 bg-[#111827] border-b border-white/10">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Stop
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Latitude
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Longitude
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  ID
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
                v-for="stop in paginatedStops"
                :key="stopKey(stop)"
                class="hover:bg-[#0F172A] transition-colors"
              >
                <td class="px-4 py-3 font-medium text-white truncate">
                  {{ stop.name || "Unnamed stop" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                  {{ formatCoord(stop.lat) }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                  {{ formatCoord(stop.lng ?? stop.lon) }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate">
                  {{ stop.id || "-" }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="inline-flex h-9 min-w-[112px] items-center justify-center whitespace-nowrap rounded-xl border border-white/10 bg-[#0F172A] px-4 text-sm font-semibold leading-none text-[#FFC400] transition-all hover:border-[#FFC400] hover:bg-[#111827]"
                    :disabled="detailsLoading && selectedStop?.id === stop.id"
                    @click="openStopDetails(stop)"
                  >
                    {{
                      detailsLoading && selectedStop?.id === stop.id
                        ? "Loading..."
                        : "View Details"
                    }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card Layout -->
        <div class="md:hidden divide-y divide-white/10">
          <div
            v-for="stop in paginatedStops"
            :key="stopKey(stop)"
            class="p-4 flex flex-col gap-3 hover:bg-[#0F172A] transition-colors text-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <span class="text-xs font-semibold text-[#9CA3AF]">STOP NAME</span>
                <p class="font-bold text-white text-sm mt-0.5 whitespace-normal break-words">{{ stop.name || "Unnamed stop" }}</p>
              </div>
              <div class="flex-shrink-0 text-right">
                <span class="text-xs font-semibold text-[#9CA3AF]">ID</span>
                <p class="text-xs text-[#94A3B8] mt-0.5 truncate max-w-[120px]">{{ stop.id || "-" }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="font-semibold text-[#9CA3AF]">LATITUDE</span>
                <p class="text-[#94A3B8] mt-0.5">{{ formatCoord(stop.lat) }}</p>
              </div>
              <div>
                <span class="font-semibold text-[#9CA3AF]">LONGITUDE</span>
                <p class="text-[#94A3B8] mt-0.5">{{ formatCoord(stop.lng ?? stop.lon) }}</p>
              </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-white/5">
              <button
                class="w-full sm:w-auto inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl border border-white/10 bg-[#0F172A] px-4 text-sm font-semibold leading-none text-[#FFC400] transition-all hover:border-[#FFC400] hover:bg-[#111827]"
                :disabled="detailsLoading && selectedStop?.id === stop.id"
                @click="openStopDetails(stop)"
              >
                {{ detailsLoading && selectedStop?.id === stop.id ? "Loading..." : "View Details" }}
              </button>
            </div>
          </div>
        </div>

        <AdminPagination v-model:page="page" :total-items="filteredStops.length" :page-size="pageSize" />
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-16 px-4 gap-3"
      >
        <MapPin class="w-10 h-10 text-[#64748B]" />
        <p class="text-base font-bold text-[#F8FAFC]">No stops found</p>
        <p class="text-sm text-[#94A3B8] text-center">
          Start OTP and backend so the startup sync can load transit stops.
        </p>
      </div>
    </Card>

    <Teleport to="body">
      <div
        v-if="selectedStop"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4 backdrop-blur-sm"
        @click.self="selectedStop = null"
      >
        <Card
          className="w-full max-w-5xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] overflow-y-auto shadow-2xl"
        >
          <div
            class="p-4 md:p-5 flex items-start justify-between gap-4 border-b border-white/10"
          >
            <div>
              <h3 class="text-lg font-bold text-[#F8FAFC]">
                {{
                  stopDetails?.stop.name || selectedStop.name || "Stop details"
                }}
              </h3>
            </div>
            <button
              class="rounded-xl border border-white/10 px-3 py-1.5 text-sm font-semibold text-[#F8FAFC] transition-all hover:border-[#FFC400] hover:text-[#FFC400]"
              @click="selectedStop = null"
            >
              Close
            </button>
          </div>
          <div
            v-if="detailsError"
            class="mx-4 mt-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-sm font-medium text-[#B91C1C]"
          >
            {{ detailsError }}
          </div>
          <div class="p-4 md:p-5 grid gap-4 md:grid-cols-2 text-sm">
            <Info
              label="Stop Name"
              :value="stopDetails?.stop.name || selectedStop.name || '-'"
            />
            <Info
              label="Stop Code / ID"
              :value="
                String(
                  stopDetails?.stop.code ||
                    stopDetails?.stop.id ||
                    selectedStop.id ||
                    '-',
                )
              "
            />
            <Info
              label="Latitude"
              :value="formatCoord(stopDetails?.stop.lat ?? selectedStop.lat)"
            />
            <Info
              label="Longitude"
              :value="
                formatCoord(
                  stopDetails?.stop.lng ??
                    stopDetails?.stop.lon ??
                    selectedStop.lng ??
                    selectedStop.lon,
                )
              "
            />
            <Info
              label="Zone ID"
              :value="
                String(stopDetails?.stop.zone_id || selectedStop.zone_id || '-')
              "
            />
            <Info
              label="Source"
              :value="
                String(
                  stopDetails?.source || selectedStop.source || 'OTP / GTFS',
                )
              "
            />
            <Info
              label="Imported At"
              :value="
                formatDate(
                  String(
                    stopDetails?.stop.imported_at ||
                      selectedStop.imported_at ||
                      selectedStop.created_at ||
                      '',
                  ),
                )
              "
            />
            <Info
              label="Related Routes Count"
              :value="
                String(stopDetails?.relatedRoutesCount ?? relatedRoutes.length)
              "
            />
          </div>
          <div class="px-4 pb-4 md:px-5 md:pb-5">
            <div class="rounded-xl border border-white/10 overflow-hidden">
              <div
                class="flex items-center justify-between gap-3 border-b border-white/10 bg-[#111827] px-4 py-3"
              >
                <h4 class="font-bold text-[#F8FAFC]">Related Routes</h4>
                <span
                  class="rounded-full bg-[#111827] px-3 py-1 text-xs font-bold text-[#FFC400]"
                >
                  {{ relatedRoutes.length }}
                </span>
              </div>
              <div v-if="detailsLoading" class="p-4 text-sm text-[#94A3B8]">
                Loading related routes...
              </div>
              <div
                v-else-if="relatedRoutes.length === 0"
                class="p-4 text-sm text-[#94A3B8]"
              >
                No related routes found for this stop.
              </div>
              <div v-else class="max-h-[360px] overflow-auto">
                <!-- Desktop Table Layout -->
                <div class="hidden md:block">
                  <table
                    class="w-full min-w-[760px] table-fixed text-left text-sm"
                  >
                    <colgroup>
                      <col class="w-[18%]" />
                      <col class="w-[36%]" />
                      <col class="w-[16%]" />
                      <col class="w-[20%]" />
                      <col class="w-[10%]" />
                    </colgroup>
                    <thead
                      class="sticky top-0 bg-[#111827] border-b border-[#374151]"
                    >
                      <tr>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                        >
                          Short Name
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                        >
                          Long Name
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                        >
                          Mode
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                        >
                          Route ID
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                        >
                          Trips
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#374151]">
                      <tr
                        v-for="route in relatedRoutes"
                        :key="route.id"
                        class="hover:bg-[#111827] transition-colors"
                      >
                        <td class="px-4 py-4 font-medium text-white truncate">
                          {{ route.short_name || "-" }}
                        </td>
                        <td class="px-4 py-4 text-[#9CA3AF] truncate">
                          {{ route.long_name || "-" }}
                        </td>
                        <td class="px-4 py-4 text-[#9CA3AF] whitespace-nowrap">
                          {{ route.mode || "-" }}
                        </td>
                        <td class="px-4 py-4 text-[#9CA3AF] truncate">
                          {{ route.id || "-" }}
                        </td>
                        <td class="px-4 py-4 text-[#9CA3AF] whitespace-nowrap">
                          {{ route.tripCount ?? "-" }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Mobile Card Layout -->
                <div class="md:hidden divide-y divide-[#374151]">
                  <div
                    v-for="route in relatedRoutes"
                    :key="route.id"
                    class="p-4 flex flex-col gap-2 hover:bg-[#111827] transition-colors text-sm"
                  >
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-semibold text-[#FFC400]">SHORT NAME: {{ route.short_name || "-" }}</span>
                      <span class="text-[#9CA3AF]">Trips: {{ route.tripCount ?? "-" }}</span>
                    </div>
                    <div>
                      <span class="text-xs font-semibold text-[#9CA3AF]">Long Name</span>
                      <p class="font-semibold text-white break-words mt-0.5 whitespace-normal">{{ route.long_name || "-" }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="font-semibold text-[#9CA3AF]">Mode</span>
                        <p class="text-[#9CA3AF] truncate mt-0.5">{{ route.mode || "-" }}</p>
                      </div>
                      <div>
                        <span class="font-semibold text-[#9CA3AF]">Route ID</span>
                        <p class="text-[#9CA3AF] truncate mt-0.5">{{ route.id || "-" }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import { MapPin, RefreshCw, Search } from "@lucide/vue";
import { Card, StatCard } from "../components/AdminShared.vue";
import AdminPagination from "../components/AdminPagination.vue";
import {
  getTransitStopDetails,
  listTransitStops,
  type RelatedRoute,
  type TransitStop,
  type TransitStopDetails,
} from "../services/adminApi";

const stops = ref<TransitStop[]>([]);
const selectedStop = ref<TransitStop | null>(null);
const stopDetails = ref<TransitStopDetails | null>(null);
const search = ref("");
const loading = ref(true);
const detailsLoading = ref(false);
const detailsError = ref("");
const error = ref("");
const page = ref(1);
const pageSize = 10;

const Info = defineComponent({
  props: { label: String, value: [String, Number] },
  setup(props) {
    return () =>
      h("div", { class: "rounded-xl border border-white/10 bg-[#0F172A] p-3" }, [
        h("div", { class: "text-xs text-[#94A3B8]" }, props.label),
        h(
          "div",
          { class: "mt-1 font-semibold text-[#F8FAFC]" },
          String(props.value ?? "-"),
        ),
      ]);
  },
});

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function formatCoord(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : "-";
}

const locatedStops = computed(
  () =>
    stops.value.filter(
      (stop) =>
        stop.lat !== null &&
        stop.lat !== undefined &&
        (stop.lng ?? stop.lon) !== null &&
        (stop.lng ?? stop.lon) !== undefined,
    ).length,
);

const filteredStops = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return stops.value;
  return stops.value.filter((stop) =>
    [stop.id, stop.name, stop.lat, stop.lng ?? stop.lon].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(q),
    ),
  );
});
const paginatedStops = computed(() => filteredStops.value.slice((page.value - 1) * pageSize, page.value * pageSize));

watch(search, () => { page.value = 1; });
watch(() => filteredStops.value.length, () => {
  page.value = Math.min(page.value, Math.max(1, Math.ceil(filteredStops.value.length / pageSize)));
});

function stopKey(stop: TransitStop) {
  return String(stop.id || stop.name || JSON.stringify(stop));
}

function stopId(stop: TransitStop) {
  return String(stop.id || stop.name || "");
}

const relatedRoutes = computed<RelatedRoute[]>(
  () => stopDetails.value?.relatedRoutes || [],
);

async function loadStops() {
  loading.value = true;
  error.value = "";
  try {
    stops.value = await listTransitStops();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load transit stops";
  } finally {
    loading.value = false;
  }
}

async function openStopDetails(stop: TransitStop) {
  selectedStop.value = stop;
  stopDetails.value = null;
  detailsError.value = "";
  detailsLoading.value = true;

  try {
    stopDetails.value = await getTransitStopDetails(stopId(stop));
  } catch (err) {
    detailsError.value =
      err instanceof Error ? err.message : "Failed to load stop details";
  } finally {
    detailsLoading.value = false;
  }
}

onMounted(loadStops);
</script>
