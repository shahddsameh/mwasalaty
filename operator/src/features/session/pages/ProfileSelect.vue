<template>
  <main class="app-shell bg-background">
    <section class="mx-auto w-full max-w-5xl">
      <header class="mb-6 rounded-lg bg-surface-dark p-5 text-white shadow-lg">
        <p class="text-sm font-bold text-primary">{{ $t("common.appName") }}</p>
        <h1 class="mt-2 text-3xl font-black">{{ $t("profile.title") }}</h1>
        <p class="mt-2 text-white/75">{{ $t("profile.subtitle") }}</p>
      </header>

      <StateView :state="state" :partial="partial" :title="stateTitle" :support="stateSupport">
        <template #action>
          <AppButton v-if="state === 'error'" class="mt-5" variant="danger" @click="loadProfiles">
            {{ $t("common.retry") }}
          </AppButton>
        </template>

        <div v-if="partial" class="mb-4 rounded-lg border border-primary bg-primary-soft p-3 text-sm font-semibold text-foreground">
          {{ $t("profile.partial") }}
        </div>

        <div v-if="!isOnline" class="mb-4 rounded-lg border border-border bg-muted p-3 text-sm font-semibold text-muted-foreground">
          {{ $t("profile.offline") }}
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="profile in profiles"
            :key="profile.scannerProfileId"
            class="tap-target rounded-lg border border-border bg-card p-4 text-start shadow-sm transition hover:border-primary hover:bg-primary-soft focus-ring"
            @click="selectProfile(profile)"
          >
            <span class="text-xs font-bold uppercase text-muted-foreground">{{ profile.scannerProfileId }}</span>
            <strong class="mt-2 block text-2xl">{{ profile.label || profile.scannerProfileId }}</strong>
            <span class="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-sm font-bold">
              {{ displayMode(profile.mode) }} / {{ profile.routeShortName || $t("profile.genericRoute") }}
            </span>
            <span class="mt-4 block text-sm font-bold text-primary-hover">{{ $t("profile.select") }}</span>
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
import { useOnline } from "@/composables/useOnline";
import { getScannerProfiles, type ScannerProfile } from "@/services/api";
import { getSelectedProfile, setSelectedProfile, startShift } from "@/services/session";
import { displayMode } from "@/services/format";

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
