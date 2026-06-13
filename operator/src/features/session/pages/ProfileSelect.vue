<template>
  <main class="app-shell bg-background">
    <section class="mx-auto w-full max-w-5xl">
      <OperatorHeader
        :eyebrow="$t('common.appName')"
        :title="$t('profile.title')"
        :subtitle="$t('profile.subtitle')"
        icon="route"
      >
        <div class="relative mt-6 grid grid-cols-3 gap-2 border-t border-surface-dark-border pt-5 text-center sm:max-w-md sm:text-start">
          <div><p class="text-[0.65rem] font-medium uppercase text-muted-foreground">{{ $t("common.mode") }}</p><p class="mt-1 text-sm font-semibold text-foreground">{{ $t("profile.genericRoute") }}</p></div>
          <div><p class="text-[0.65rem] font-medium uppercase text-muted-foreground">{{ $t("common.profile") }}</p><p class="mt-1 text-sm font-semibold text-foreground">{{ profiles.length || $t("common.dash") }}</p></div>
          <div><p class="text-[0.65rem] font-medium uppercase text-muted-foreground">{{ $t("common.queue") }}</p><p class="mt-1 text-sm font-semibold text-success">{{ isOnline ? $t("common.synced") : $t("common.pending") }}</p></div>
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

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="profile in profiles"
            :key="profile.scannerProfileId"
            class="group tap-target relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-start shadow-sm transition-colors hover:border-primary focus-ring"
            @click="selectProfile(profile)"
          >
            <span class="absolute inset-x-0 top-0 h-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
            <div class="flex items-start justify-between gap-3">
              <span :class="profile.mode === 'SUBWAY' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-700'" class="grid h-12 w-12 place-items-center rounded-2xl">
                <AppIcon :name="profile.mode === 'SUBWAY' ? 'metro' : 'bus'" class="h-6 w-6" />
              </span>
              <span class="rounded-full bg-muted px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase text-muted-foreground">{{ profile.scannerProfileId }}</span>
            </div>
            <strong class="mt-5 block text-xl font-semibold leading-snug text-foreground">{{ displayProfile(profile) }}</strong>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">{{ displayMode(profile.mode) }}</span>
              <span class="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-hover">{{ profile.routeShortName || $t("profile.genericRoute") }}</span>
            </div>
            <span class="mt-6 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition-colors group-hover:bg-primary-hover group-hover:text-white">
              {{ $t("profile.select") }}
              <AppIcon name="chevron" class="h-4 w-4 rtl:rotate-180" />
            </span>
          </button>
        </div>
      </StateView>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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

const router = useRouter();
const { t } = useI18n();
const { isOnline } = useOnline();
const state = ref<"loading" | "empty" | "error" | "ready">("loading");
const profiles = ref<ScannerProfile[]>([]);

const partial = computed(() => profiles.value.some((profile) => !profile.label));
const stateTitle = computed(() => {
  if (state.value === "loading") return t("profile.loading");
  if (state.value === "empty") return t("profile.empty");
  if (state.value === "error") return t("profile.error");
  return undefined;
});
const stateSupport = computed(() => (state.value === "ready" ? undefined : t("profile.subtitle")));

async function loadProfiles() {
  state.value = "loading";
  const cached = getSelectedProfile();

  try {
    profiles.value = await getScannerProfiles();
    state.value = profiles.value.length ? "ready" : "empty";
  } catch {
    if (cached) {
      profiles.value = [cached];
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
