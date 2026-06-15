<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard label="Transit Routes" :value="routes.length" color="#38BDF8" />
      <StatCard
        label="Route Searches"
        :value="searches.length"
        color="#7C3AED"
      />
      <StatCard label="Metro" :value="countByMode('metro')" color="#2563EB" />
      <StatCard label="Bus" :value="countByMode('bus')" color="#00B86B" />
    </div>

    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">{{ error }}</div>
    </Card>

    <Card>
      <div class="p-4 md:p-5 border-b border-white/10 flex flex-col gap-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in routeTabs"
            :key="tab.value"
            class="rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
            :class="
              activeTab === tab.value
                ? 'border-[#FFC400] bg-[#FFC400] text-[#ffffff]'
                : 'border-white/10 bg-[#0F172A] text-[#94A3B8] hover:border-[#FFC400] hover:text-[#F8FAFC]'
            "
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div v-if="activeTab === 'transit'" class="flex flex-wrap gap-2">
            <button
              v-for="option in modeFilters"
              :key="option.value"
              class="rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
              :class="
                selectedMode === option.value
                  ? 'border-[#111827] bg-[#111827] text-white'
                  : 'border-white/10 bg-[#0F172A] text-[#94A3B8] hover:border-[#FFC400] hover:text-[#F8FAFC]'
              "
              @click="selectedMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="relative min-w-0 flex-1 basis-full sm:basis-[220px]">
            <Search
              class="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              v-model="search"
              :placeholder="
                activeTab === 'transit'
                  ? 'Search transit routes...'
                  : 'Search route searches...'
              "
              class="w-full pl-9 pr-4 py-2 border border-white/10 rounded-xl text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#FFC400] bg-[#0F172A]"
            />
          </div>
          <button
            @click="loadData"
            class="p-2 rounded-xl border border-white/10 text-[#94A3B8] hover:border-[#FFC400] hover:text-[#FFC400] transition-all flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        v-if="loading"
        class="flex items-center justify-center py-16 text-[#94A3B8] text-sm"
      >
        Loading routes...
      </div>

      <div
        v-else-if="activeTab === 'transit' && filteredRoutes.length > 0"
        class="bg-[#1E293B] rounded-xl overflow-hidden border border-white/10"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[920px] table-fixed text-left text-sm">
            <colgroup>
              <col class="w-[16%]" />
              <col class="w-[44%]" />
              <col class="w-[16%]" />
              <col class="w-[24%]" />
            </colgroup>
            <thead class="sticky top-0 bg-[#111827] border-b border-white/10">
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
                  class="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr
                v-for="route in paginatedRoutes"
                :key="routeKey(route)"
                class="hover:bg-[#0F172A] transition-colors"
              >
                <td class="px-4 py-3 font-medium text-white truncate">
                  {{ route.short_name || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] truncate">
                  {{ route.long_name || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                  {{ normalizeMode(route) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="whitespace-nowrap rounded-xl border border-white/10 bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-[#FFC400] transition-all hover:border-[#FFC400] hover:bg-[#111827]"
                    :disabled="detailsLoading && selectedRoute?.id === route.id"
                    @click="openRouteDetails(route)"
                  >
                    {{
                      detailsLoading && selectedRoute?.id === route.id
                        ? "Loading..."
                        : "View Details"
                    }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <AdminPagination
          v-model:page="routePage"
          :total-items="filteredRoutes.length"
          :page-size="pageSize"
        />
      </div>

      <div
        v-else-if="activeTab === 'searches' && filteredSearches.length > 0"
        class="bg-[#1E293B] rounded-xl overflow-hidden border border-white/10"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[960px] text-left text-sm">
            <thead class="sticky top-0 bg-[#111827] border-b border-white/10">
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
                  Date
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Time
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Optimized For
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Total Routes
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Search Count
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Latest Created
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
                v-for="item in paginatedSearches"
                :key="searchKey(item)"
                class="hover:bg-[#0F172A] transition-colors"
              >
                <td class="px-4 py-3 font-medium text-white">
                  {{ item.from_label || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ item.to_label || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">{{ item.date || "-" }}</td>
                <td class="px-4 py-3 text-[#94A3B8]">{{ item.time || "-" }}</td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ item.optimized_for || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ item.total_routes ?? "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ item.search_count ?? 1 }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ formatDate(item.latest_created_at || item.created_at) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="rounded-xl border border-white/10 bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-[#FFC400] transition-all hover:border-[#FFC400] hover:bg-[#111827]"
                    @click="selectedSearch = item"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <AdminPagination
          v-model:page="searchPage"
          :total-items="filteredSearches.length"
          :page-size="pageSize"
        />
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-16 px-4 gap-3"
      >
        <RouteIcon class="w-10 h-10 text-[#64748B]" />
        <p class="text-base font-bold text-[#F8FAFC]">No routes found</p>
        <p class="text-sm text-[#94A3B8] text-center">
          {{
            activeTab === "transit"
              ? "No transit routes match this filter."
              : "No user route searches match this filter."
          }}
        </p>
      </div>
    </Card>

    <Teleport to="body">
      <div
        v-if="selectedRoute"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4 backdrop-blur-sm"
        @click.self="selectedRoute = null"
      >
        <Card
          className="w-full max-w-5xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] overflow-y-auto shadow-2xl"
        >
          <DetailsHeader
            title="Transit Route Details"
            @close="selectedRoute = null"
          />
          <div
            v-if="detailsError"
            class="mx-4 mt-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-sm font-medium text-[#B91C1C]"
          >
            {{ detailsError }}
          </div>
          <div class="p-4 md:p-5 grid gap-4 md:grid-cols-2 text-sm">
            <Info
              label="Short Name"
              :value="
                routeDetails?.route.short_name ||
                selectedRoute.short_name ||
                '-'
              "
            />
            <Info
              label="Long Name"
              :value="
                routeDetails?.route.long_name || selectedRoute.long_name || '-'
              "
            />
            <Info
              label="Mode"
              :value="normalizeMode(routeDetails?.route || selectedRoute)"
            />
            <Info
              label="Source"
              :value="
                String(
                  routeDetails?.source || selectedRoute.source || 'OTP / GTFS',
                )
              "
            />
            <Info
              label="Imported At"
              :value="
                formatDate(
                  String(
                    routeDetails?.route.imported_at ||
                      selectedRoute.imported_at ||
                      selectedRoute.created_at ||
                      '',
                  ),
                )
              "
            />
            <Info
              label="Related Stops Count"
              :value="
                String(routeDetails?.relatedStopsCount ?? relatedStops.length)
              "
            />
            <Info
              label="Related Route Searches"
              :value="String(relatedSearchCount(selectedRoute))"
            />
          </div>
          <div class="px-4 pb-4 md:px-5 md:pb-5">
            <div class="rounded-xl border border-white/10 overflow-hidden">
              <div
                class="flex items-center justify-between gap-3 border-b border-white/10 bg-[#111827] px-4 py-3"
              >
                <h4 class="font-bold text-[#F8FAFC]">Related Stops</h4>
                <span
                  class="rounded-full bg-[#111827] px-3 py-1 text-xs font-bold text-[#FFC400]"
                >
                  {{ relatedStops.length }}
                </span>
              </div>
              <div v-if="detailsLoading" class="p-4 text-sm text-[#94A3B8]">
                Loading related stops...
              </div>
              <div
                v-else-if="relatedStops.length === 0"
                class="p-4 text-sm text-[#94A3B8]"
              >
                No related stops found for this route.
              </div>
              <div v-else class="max-h-[360px] overflow-auto">
                <table
                  class="w-full min-w-[760px] table-fixed text-left text-sm"
                >
                  <colgroup>
                    <col class="w-[10%]" />
                    <col class="w-[34%]" />
                    <col class="w-[20%]" />
                    <col class="w-[18%]" />
                    <col class="w-[18%]" />
                  </colgroup>
                  <thead
                    class="sticky top-0 bg-[#111827] border-b border-[#374151]"
                  >
                    <tr>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                      >
                        Order
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                      >
                        Stop Name
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                      >
                        Stop Code / ID
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                      >
                        Direction
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
                      v-for="stop in relatedStops"
                      :key="stop.id"
                      class="hover:bg-[#111827] transition-colors"
                    >
                      <td
                        class="px-4 py-4 font-medium text-white whitespace-nowrap"
                      >
                        {{ stop.stopOrder ?? "-" }}
                      </td>
                      <td class="px-4 py-4 text-[#9CA3AF] truncate">
                        {{ stop.name || "-" }}
                      </td>
                      <td class="px-4 py-4 text-[#9CA3AF] truncate">
                        {{ stop.code || stop.id || "-" }}
                      </td>
                      <td class="px-4 py-4 text-[#9CA3AF] truncate">
                        {{ formatList(stop.directionIds) }}
                      </td>
                      <td class="px-4 py-4 text-[#9CA3AF] whitespace-nowrap">
                        {{ stop.tripCount ?? stop.patternCodes?.length ?? "-" }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="selectedSearch"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4 backdrop-blur-sm"
        @click.self="selectedSearch = null"
      >
        <Card
          className="w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] overflow-y-auto shadow-2xl"
        >
          <DetailsHeader
            title="Route Search Details"
            @close="selectedSearch = null"
          />
          <div class="p-4 md:p-5 space-y-5">
            <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
              <Info label="From" :value="selectedSearch.from_label || '-'" />
              <Info label="To" :value="selectedSearch.to_label || '-'" />
              <Info
                label="When"
                :value="
                  [selectedSearch.date, selectedSearch.time]
                    .filter(Boolean)
                    .join(' at ') || '-'
                "
              />
              <Info
                label="Optimized For"
                :value="String(selectedSearch.optimized_for || '-')"
              />
              <Info
                label="Search Count"
                :value="String(selectedSearch.search_count ?? 1)"
              />
              <Info
                label="Latest Created"
                :value="
                  formatDate(
                    selectedSearch.latest_created_at ||
                      selectedSearch.created_at,
                  )
                "
              />
              <Info
                label="Routes Returned"
                :value="
                  String(
                    selectedSearchItineraries.length ||
                      selectedSearch.total_routes ||
                      0,
                  )
                "
              />
              <Info
                label="Route Names"
                :value="formatList(selectedSearchRouteNames)"
              />
            </div>

            <div class="rounded-xl border border-white/10 overflow-hidden">
              <div
                class="flex items-center justify-between gap-3 border-b border-white/10 bg-[#111827] px-4 py-3"
              >
                <h4 class="font-bold text-[#F8FAFC]">Returned Route Options</h4>
                <span
                  class="rounded-full bg-[#111827] px-3 py-1 text-xs font-bold text-[#FFC400]"
                >
                  {{ selectedSearchItineraries.length }}
                </span>
              </div>
              <div
                v-if="selectedSearchItineraries.length === 0"
                class="p-4 text-sm text-[#94A3B8]"
              >
                No readable itinerary details are available for this search.
              </div>
              <div v-else class="max-h-[520px] overflow-auto">
                <div
                  v-for="(itinerary, index) in selectedSearchItineraries"
                  :key="itinerary.itineraryId || index"
                  class="border-b border-white/10 p-4 last:border-b-0"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div class="text-sm font-bold text-[#F8FAFC]">
                        Option {{ index + 1
                        }}{{
                          itinerary.summary ? `: ${itinerary.summary}` : ""
                        }}
                      </div>
                      <div
                        class="mt-1 flex flex-wrap gap-2 text-xs text-[#94A3B8]"
                      >
                        <span class="rounded-full bg-[#0F172A] px-2.5 py-1"
                          >{{ itinerary.durationMinutes ?? "-" }} min</span
                        >
                        <span class="rounded-full bg-[#0F172A] px-2.5 py-1"
                          >{{ itinerary.transfers ?? 0 }} transfers</span
                        >
                        <span class="rounded-full bg-[#0F172A] px-2.5 py-1">{{
                          moneyLabel(itinerary.totalFare)
                        }}</span>
                        <span
                          v-if="itinerary.totalDistanceMeters"
                          class="rounded-full bg-[#0F172A] px-2.5 py-1"
                        >
                          {{ distanceLabel(itinerary.totalDistanceMeters) }}
                        </span>
                      </div>
                    </div>
                    <span
                      class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[#FFC400]"
                    >
                      {{ itinerary.itineraryId || `route-${index + 1}` }}
                    </span>
                  </div>

                  <div class="mt-4 overflow-x-auto">
                    <table
                      class="w-full min-w-[760px] table-fixed text-left text-sm"
                    >
                      <colgroup>
                        <col class="w-[8%]" />
                        <col class="w-[14%]" />
                        <col class="w-[24%]" />
                        <col class="w-[24%]" />
                        <col class="w-[16%]" />
                        <col class="w-[14%]" />
                      </colgroup>
                      <thead class="bg-[#111827] border-b border-[#374151]">
                        <tr>
                          <th
                            class="px-3 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                          >
                            Step
                          </th>
                          <th
                            class="px-3 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                          >
                            Mode
                          </th>
                          <th
                            class="px-3 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                          >
                            Route
                          </th>
                          <th
                            class="px-3 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                          >
                            From / To
                          </th>
                          <th
                            class="px-3 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                          >
                            Duration
                          </th>
                          <th
                            class="px-3 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                          >
                            Fare
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-[#374151]">
                        <tr
                          v-for="(leg, legIndex) in itinerary.legs || []"
                          :key="leg.legId || legIndex"
                          class="hover:bg-[#111827] transition-colors last:border-b-0"
                        >
                          <td class="px-3 py-2 font-medium text-white">
                            {{ legIndex + 1 }}
                          </td>
                          <td class="px-3 py-2 text-[#9CA3AF]">
                            {{ modeLabel(leg.mode) }}
                          </td>
                          <td class="px-3 py-2 text-[#9CA3AF] truncate">
                            {{ routeLabel(leg.route) }}
                          </td>
                          <td class="px-3 py-2 text-[#9CA3AF] truncate">
                            {{ placePairLabel(leg) }}
                          </td>
                          <td
                            class="px-3 py-2 text-[#9CA3AF] whitespace-nowrap"
                          >
                            {{ leg.durationMinutes ?? "-" }} min
                          </td>
                          <td
                            class="px-3 py-2 text-[#9CA3AF] whitespace-nowrap"
                          >
                            {{ moneyLabel(leg.fare) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
import { RefreshCw, Route as RouteIcon, Search } from "@lucide/vue";
import { Card, StatCard } from "../components/AdminShared.vue";
import AdminPagination from "../components/AdminPagination.vue";
import {
  getTransitRouteDetails,
  listRouteSearches,
  listTransitRoutes,
  type RelatedStop,
  type RouteSearch,
  type TransitRoute,
  type TransitRouteDetails,
} from "../services/adminApi";

type SearchFare = {
  amount?: number;
  currency?: string;
};

type SearchLeg = {
  legId?: string;
  mode?: string;
  from?: { name?: string } | string;
  to?: { name?: string } | string;
  durationMinutes?: number;
  distanceMeters?: number;
  route?: {
    shortName?: string;
    longName?: string;
    id?: string;
    gtfsId?: string;
  } | null;
  fare?: SearchFare;
};

type SearchItinerary = {
  itineraryId?: string;
  summary?: string;
  durationMinutes?: number;
  totalDistanceMeters?: number;
  transfers?: number;
  totalFare?: SearchFare;
  legs?: SearchLeg[];
};

const routes = ref<TransitRoute[]>([]);
const searches = ref<RouteSearch[]>([]);
const selectedRoute = ref<TransitRoute | null>(null);
const routeDetails = ref<TransitRouteDetails | null>(null);
const selectedSearch = ref<RouteSearch | null>(null);
const activeTab = ref<"transit" | "searches">("transit");
const search = ref("");
const selectedMode = ref("all");
const loading = ref(true);
const detailsLoading = ref(false);
const detailsError = ref("");
const error = ref("");
const routePage = ref(1);
const searchPage = ref(1);
const pageSize = 10;

const routeTabs = [
  { value: "transit", label: "Transit Routes" },
  { value: "searches", label: "User Route Searches" },
] as const;

const modeFilters = [
  { value: "all", label: "All" },
  { value: "bus", label: "Bus" },
  { value: "metro", label: "Metro" },
];

const DetailsHeader = defineComponent({
  props: { title: { type: String, required: true } },
  emits: ["close"],
  setup(props, { emit }) {
    return () =>
      h(
        "div",
        {
          class:
            "p-4 md:p-5 border-b border-white/10 flex items-start justify-between gap-4",
        },
        [
          h("h3", { class: "min-w-0 text-lg font-bold text-[#F8FAFC]" }, props.title),
          h(
            "button",
            {
              class:
                "rounded-xl border border-white/10 px-3 py-1.5 text-sm font-semibold text-[#F8FAFC] transition-all hover:border-[#FFC400] hover:text-[#FFC400]",
              onClick: () => emit("close"),
            },
            "Close",
          ),
        ],
      );
  },
});

const Info = defineComponent({
  props: { label: String, value: [String, Number] },
  setup(props) {
    return () =>
      h(
        "div",
        { class: "rounded-xl border border-white/10 bg-[#0F172A] p-3" },
        [
          h("div", { class: "text-xs text-[#94A3B8]" }, props.label),
          h(
            "div",
            { class: "mt-1 font-semibold text-[#F8FAFC]" },
            String(props.value ?? "-"),
          ),
        ],
      );
  },
});

function routeKey(route: TransitRoute) {
  return String(
    route.id || route.short_name || route.long_name || JSON.stringify(route),
  );
}

function routeId(route: TransitRoute) {
  return String(route.id || route.short_name || route.long_name || "");
}

function searchKey(item: RouteSearch) {
  return String(
    [
      item.from_label,
      item.to_label,
      item.date,
      item.time,
      item.optimized_for,
    ].join("|") ||
      item.id ||
      item.plan_id ||
      item.latest_created_at ||
      JSON.stringify(item),
  );
}

function looksLikeMetro(route: TransitRoute) {
  const name =
    `${route.short_name || ""} ${route.long_name || ""} ${route.id || ""}`.toLowerCase();
  return (
    name.includes("metro") ||
    /^m\d+\b/i.test(String(route.short_name || route.id || ""))
  );
}

function normalizeMode(route: TransitRoute) {
  const value = String(route.mode || "").toLowerCase();
  if (value === "bus") return "Bus";
  if (
    value === "subway" ||
    value === "metro" ||
    value === "rail" ||
    looksLikeMetro(route)
  )
    return "Metro";
  return route.mode ? String(route.mode) : "Unknown";
}

function matchesMode(route: TransitRoute, mode: string) {
  if (mode === "all") return true;
  return normalizeMode(route).toLowerCase() === mode.toLowerCase();
}

function countByMode(mode: string) {
  return routes.value.filter((route) => matchesMode(route, mode)).length;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function formatList(values?: string[]) {
  return values?.length ? values.join(", ") : "-";
}

const relatedStops = computed<RelatedStop[]>(
  () => routeDetails.value?.relatedStops || [],
);

function parseItineraries(value: unknown): SearchItinerary[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as SearchItinerary[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as SearchItinerary[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

const selectedSearchItineraries = computed<SearchItinerary[]>(() => {
  if (!selectedSearch.value) return [];
  return parseItineraries(
    selectedSearch.value.latest_itineraries || selectedSearch.value.itineraries,
  );
});

const selectedSearchRouteNames = computed<string[]>(() => {
  const names = new Set<string>();
  for (const itinerary of selectedSearchItineraries.value) {
    for (const leg of itinerary.legs || []) {
      const route = routeLabel(leg.route);
      if (route !== "-") names.add(route);
    }
  }
  return Array.from(names);
});

function modeLabel(mode?: string) {
  if (!mode) return "-";
  if (mode === "WALK") return "Walk";
  if (mode === "SUBWAY") return "Metro";
  return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
}

function placeName(value: SearchLeg["from"]) {
  if (!value) return "-";
  return typeof value === "string" ? value : value.name || "-";
}

function routeLabel(route: SearchLeg["route"]) {
  if (!route) return "-";
  return (
    [route.shortName, route.longName].filter(Boolean).join(" - ") ||
    route.id ||
    route.gtfsId ||
    "-"
  );
}

function placePairLabel(leg: SearchLeg) {
  return `${placeName(leg.from)} -> ${placeName(leg.to)}`;
}

function moneyLabel(fare?: SearchFare) {
  if (!fare || typeof fare.amount !== "number") return "-";
  return `${fare.amount} ${fare.currency || "EGP"}`;
}

function distanceLabel(meters?: number) {
  if (typeof meters !== "number") return "-";
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function normalizeRouteMatchValue(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function routeSearchValues(item: RouteSearch) {
  const values = [
    ...(item.route_short_names || []),
    ...(item.route_long_names || []),
    ...(item.route_ids || []),
    ...(item.latest_route_short_names || []),
    ...(item.latest_route_long_names || []),
    ...(item.latest_route_ids || []),
  ];
  const itinerarySources = [item.itineraries, item.latest_itineraries];
  for (const source of itinerarySources) {
    const itineraries = Array.isArray(source) ? source : [];
    for (const itinerary of itineraries) {
      const legs = Array.isArray((itinerary as { legs?: unknown }).legs)
        ? (itinerary as { legs: unknown[] }).legs
        : [];
      for (const leg of legs) {
        const route = (
          leg as {
            route?: {
              shortName?: string;
              longName?: string;
              id?: string;
              gtfsId?: string;
            };
          }
        ).route;
        if (route?.shortName) values.push(route.shortName);
        if (route?.longName) values.push(route.longName);
        if (route?.id) values.push(route.id);
        if (route?.gtfsId) values.push(route.gtfsId);
      }
    }
  }
  return values.map(normalizeRouteMatchValue).filter(Boolean);
}

function relatedSearchCount(route: TransitRoute) {
  const candidates = [route.id, route.short_name, route.long_name]
    .map(normalizeRouteMatchValue)
    .filter(Boolean);
  if (!candidates.length) return 0;
  return searches.value.filter((item) => {
    const values = routeSearchValues(item);
    return candidates.some((candidate) =>
      values.some(
        (value) =>
          value === candidate ||
          value.includes(candidate) ||
          candidate.includes(value),
      ),
    );
  }).length;
}

const filteredRoutes = computed(() => {
  const q = search.value.trim().toLowerCase();
  return routes.value.filter((route) => {
    if (!matchesMode(route, selectedMode.value)) return false;
    if (!q) return true;
    return [
      route.id,
      route.short_name,
      route.long_name,
      route.mode,
      normalizeMode(route),
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(q),
    );
  });
});

const filteredSearches = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return searches.value;
  return searches.value.filter((item) =>
    [
      item.from_label,
      item.to_label,
      item.date,
      item.time,
      item.optimized_for,
      item.total_routes,
      item.search_count,
      item.latest_created_at || item.created_at,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(q),
    ),
  );
});
const paginatedRoutes = computed(() =>
  filteredRoutes.value.slice(
    (routePage.value - 1) * pageSize,
    routePage.value * pageSize,
  ),
);
const paginatedSearches = computed(() =>
  filteredSearches.value.slice(
    (searchPage.value - 1) * pageSize,
    searchPage.value * pageSize,
  ),
);

watch([search, selectedMode], () => {
  routePage.value = 1;
  searchPage.value = 1;
});
watch(activeTab, () => {
  routePage.value = 1;
  searchPage.value = 1;
});

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [transitRoutes, routeSearches] = await Promise.all([
      listTransitRoutes(),
      listRouteSearches(),
    ]);
    routes.value = transitRoutes;
    searches.value = routeSearches;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load routes";
  } finally {
    loading.value = false;
  }
}

async function openRouteDetails(route: TransitRoute) {
  selectedRoute.value = route;
  selectedSearch.value = null;
  routeDetails.value = null;
  detailsError.value = "";
  detailsLoading.value = true;

  try {
    routeDetails.value = await getTransitRouteDetails(routeId(route));
  } catch (err) {
    detailsError.value =
      err instanceof Error ? err.message : "Failed to load route details";
  } finally {
    detailsLoading.value = false;
  }
}

onMounted(loadData);
</script>
