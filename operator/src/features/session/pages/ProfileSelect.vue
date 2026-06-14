<template>
  <main class="app-shell bg-background">
    <section class="mx-auto w-full max-w-6xl">
      <OperatorHeader
        :eyebrow="$t('common.appName')"
        :title="$t('profile.title')"
        :subtitle="$t('profile.subtitle')"
        icon="route"
      >
        <div class="relative mt-6 grid grid-cols-3 gap-2 border-t border-surface-dark-border pt-5 text-center sm:max-w-lg sm:text-start">
          <div><p class="text-[0.65rem] font-medium uppercase text-muted-foreground">{{ $t("profile.total") }}</p><p class="mt-1 text-sm font-semibold text-foreground">{{ profiles.length || $t("common.dash") }}</p></div>
          <div><p class="text-[0.65rem] font-medium uppercase text-muted-foreground">{{ $t("profile.busProfiles") }}</p><p class="mt-1 text-sm font-semibold text-foreground">{{ busCount }}</p></div>
          <div><p class="text-[0.65rem] font-medium uppercase text-muted-foreground">{{ $t("profile.subwayProfiles") }}</p><p class="mt-1 text-sm font-semibold text-foreground">{{ subwayCount }}</p></div>
        </div>
      </OperatorHeader>

      <StateView class="mt-6" :state="state" :partial="partial" :title="stateTitle" :support="stateSupport">
        <template #action>
          <AppButton v-if="state === 'error'" class="mt-5" variant="danger" @click="loadProfiles">
            {{ $t("common.retry") }}
          </AppButton>
        </template>

        <div v-if="partial" class="soft-alert mb-4 border-primary bg-primary-soft text-foreground">
          {{ $t("profile.partial") }}
        </div>

        <div v-if="!isOnline" class="soft-alert mb-4 border-border bg-muted text-muted-foreground">
          {{ $t("profile.offline") }}
        </div>

        <section class="section-card mb-5 grid gap-4">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-foreground">{{ $t("profile.searchLabel") }}</span>
            <input
              v-model="searchQuery"
              type="search"
              class="tap-target w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus-ring"
              :placeholder="$t('profile.searchPlaceholder')"
            />
          </label>

          <div class="grid grid-cols-3 rounded-xl border border-border bg-muted p-1" role="group" :aria-label="$t('profile.filterLabel')">
            <button
              v-for="filter in modeFilters"
              :key="filter"
              type="button"
              class="tap-target rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-ring"
              :class="modeFilter === filter ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted-foreground hover:bg-card hover:text-foreground'"
              :aria-pressed="modeFilter === filter"
              @click="modeFilter = filter"
            >
              {{ filterLabel(filter) }}
              <span class="ms-1 opacity-75">{{ filterCount(filter) }}</span>
            </button>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>{{ $t("profile.results", { shown: pagedProfiles.length, total: filteredProfiles.length }) }}</p>
            <AppButton v-if="hasActiveFilters" size="sm" variant="ghost" @click="clearFilters">
              {{ $t("profile.clearFilters") }}
            </AppButton>
          </div>
        </section>

        <div v-if="filteredProfiles.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="profile in pagedProfiles"
            :key="profile.scannerProfileId"
            class="group tap-target relative overflow-hidden rounded-2xl border bg-card p-5 text-start shadow-sm transition-colors hover:border-primary focus-ring"
            :class="isCurrentProfile(profile) ? 'border-success ring-2 ring-success/20' : 'border-border'"
            @click="selectProfile(profile)"
          >
            <span class="absolute inset-x-0 top-0 h-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
            <div class="flex items-start justify-between gap-3">
              <span :class="profile.mode === 'SUBWAY' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-700'" class="grid h-12 w-12 place-items-center rounded-2xl">
                <AppIcon :name="profile.mode === 'SUBWAY' ? 'metro' : 'bus'" class="h-6 w-6" />
              </span>
              <span v-if="isCurrentProfile(profile)" class="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                <AppIcon name="check" class="h-3.5 w-3.5" />{{ $t("profile.current") }}
              </span>
              <span v-else class="max-w-[65%] truncate rounded-full bg-muted px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase text-muted-foreground">{{ profile.scannerProfileId }}</span>
            </div>
            <strong class="mt-5 block text-xl font-semibold leading-snug text-foreground">{{ displayProfile(profile) }}</strong>
            <p class="mt-1 truncate font-mono text-[0.65rem] text-muted-foreground">{{ profile.scannerProfileId }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">{{ displayMode(profile.mode) }}</span>
              <span class="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-hover">{{ profile.routeShortName || $t("profile.genericRoute") }}</span>
            </div>
            <span class="mt-6 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition-colors group-hover:bg-primary-hover group-hover:text-white">
              {{ isCurrentProfile(profile) ? $t("profile.continue") : $t("profile.select") }}
              <AppIcon name="chevron" class="h-4 w-4 rtl:rotate-180" />
            </span>
          </button>
        </div>

        <div v-else class="empty-state min-h-64">
          <div class="max-w-sm">
            <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary-hover" aria-hidden="true">
              <AppIcon name="route" class="h-9 w-9" />
            </div>
            <h2 class="text-xl font-semibold">{{ $t("profile.noResults") }}</h2>
            <p class="mt-2 text-muted-foreground">{{ $t("profile.noResultsSupport") }}</p>
            <AppButton class="mt-5" variant="outline" @click="clearFilters">{{ $t("profile.clearFilters") }}</AppButton>
          </div>
        </div>

        <nav v-if="totalPages > 1" class="mt-6 flex items-center justify-between gap-3" :aria-label="$t('profile.pagination')">
          <AppButton variant="outline" :disabled="currentPage === 1" @click="currentPage--">
            {{ $t("profile.previous") }}
          </AppButton>
          <p class="text-sm font-semibold text-muted-foreground">{{ $t("profile.page", { current: currentPage, total: totalPages }) }}</p>
          <AppButton variant="outline" :disabled="currentPage === totalPages" @click="currentPage++">
            {{ $t("profile.next") }}
          </AppButton>
        </nav>
      </StateView>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import AppButton from "@/components/ui/AppButton.vue";
import StateView from "@/components/shared/StateView.vue";
import OperatorHeader from "@/components/shared/OperatorHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { useOnline } from "@/composables/useOnline";
import { getScannerProfiles, type ScannerProfile } from "@/services/api";
import { getSelectedProfile, setSelectedProfile, startShift } from "@/services/session";
import { displayMode, displayProfile } from "@/services/format";
import { filterProfiles, paginateProfiles, type ProfileModeFilter } from "@/features/session/profileList";

const PAGE_SIZE = 18;
const modeFilters: ProfileModeFilter[] = ["ALL", "BUS", "SUBWAY"];

const router = useRouter();
const { t } = useI18n();
const { isOnline } = useOnline();
const state = ref<"loading" | "empty" | "error" | "ready">("loading");
const profiles = ref<ScannerProfile[]>([]);
const currentProfile = getSelectedProfile();
const searchQuery = ref("");
const modeFilter = ref<ProfileModeFilter>("ALL");
const currentPage = ref(1);

const partial = computed(() => profiles.value.some((profile) => !profile.label));
const busCount = computed(() => profiles.value.filter((profile) => profile.mode === "BUS").length);
const subwayCount = computed(() => profiles.value.filter((profile) => profile.mode === "SUBWAY").length);
const filteredProfiles = computed(() => filterProfiles(profiles.value, modeFilter.value, searchQuery.value));
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProfiles.value.length / PAGE_SIZE)));
const pagedProfiles = computed(() => paginateProfiles(filteredProfiles.value, currentPage.value, PAGE_SIZE));
const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim()) || modeFilter.value !== "ALL");
const stateTitle = computed(() => {
  if (state.value === "loading") return t("profile.loading");
  if (state.value === "empty") return t("profile.empty");
  if (state.value === "error") return t("profile.error");
  return undefined;
});
const stateSupport = computed(() => (state.value === "ready" ? undefined : t("profile.subtitle")));

watch([searchQuery, modeFilter], () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});

function filterLabel(filter: ProfileModeFilter) {
  if (filter === "BUS") return t("profile.bus");
  if (filter === "SUBWAY") return t("profile.subway");
  return t("profile.all");
}

function filterCount(filter: ProfileModeFilter) {
  if (filter === "BUS") return busCount.value;
  if (filter === "SUBWAY") return subwayCount.value;
  return profiles.value.length;
}

function clearFilters() {
  searchQuery.value = "";
  modeFilter.value = "ALL";
}

function isCurrentProfile(profile: ScannerProfile) {
  return currentProfile?.scannerProfileId === profile.scannerProfileId;
}

async function loadProfiles() {
  state.value = "loading";

  try {
    profiles.value = await getScannerProfiles();
    state.value = profiles.value.length ? "ready" : "empty";
  } catch {
    if (currentProfile) {
      profiles.value = [currentProfile];
      state.value = "ready";
    } else {
      state.value = "error";
    }
  }
}

function selectProfile(profile: ScannerProfile) {
  setSelectedProfile(profile);
  startShift();
  void router.push({ name: "dashboard" });
}

onMounted(loadProfiles);
</script>
