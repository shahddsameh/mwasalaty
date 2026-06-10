<template>
  <main class="min-h-screen bg-background pb-20">
    <div class="mx-auto max-w-[720px] px-4 py-6 md:px-6 md:py-8">
      <section class="mb-6">
        <h1 class="font-display text-2xl text-foreground md:text-3xl">
          {{ t("operatorScan.title") }}
        </h1>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t("operatorScan.subtitle") }}
        </p>
      </section>

      <section class="rounded-xl border-2 border-border bg-card p-4 md:p-6">
        <label class="text-sm text-foreground" for="qr-payload">
          {{ t("operatorScan.qrPayload") }}
        </label>
        <textarea
          id="qr-payload"
          v-model="qrPayload"
          class="mt-2 min-h-40 w-full rounded-lg border border-border bg-muted p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          :placeholder="t('operatorScan.qrPlaceholder')"
        />

        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm text-foreground" for="scanner-profile">
              {{ t("operatorScan.scannerProfile") }}
            </label>
            <input
              v-model="profileFilter"
              type="search"
              :placeholder="t('operatorScan.profileFilter')"
              class="mt-2 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              id="scanner-profile"
              v-model="scannerProfileId"
              :disabled="profilesLoading"
              class="mt-2 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <optgroup :label="t('operatorScan.subway')">
                <option
                  v-for="p in filteredSubwayProfiles"
                  :key="p.scannerProfileId"
                  :value="p.scannerProfileId"
                >
                  {{ profileLabel(p) }}
                </option>
              </optgroup>
              <optgroup :label="t('operatorScan.bus')">
                <option
                  v-for="p in filteredBusProfiles"
                  :key="p.scannerProfileId"
                  :value="p.scannerProfileId"
                >
                  {{ profileLabel(p) }}
                </option>
              </optgroup>
            </select>
            <p v-if="profilesError" class="mt-1 text-xs text-destructive">
              {{ profilesError }}
            </p>
          </div>

          <div>
            <label class="text-sm text-foreground" for="stations-traveled">
              {{ t("operatorScan.stationsTraveled") }}
            </label>
            <input
              id="stations-traveled"
              v-model="stationsTraveled"
              type="number"
              min="1"
              inputmode="numeric"
              :placeholder="t('operatorScan.stationsPlaceholder')"
              class="mt-2 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t("operatorScan.stationsHelp") }}
            </p>
          </div>
        </div>

        <button
          class="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          :disabled="loading"
          @click="validateTicket"
        >
          {{ loading ? t("operatorScan.validating") : t("operatorScan.validate") }}
        </button>

        <div
          v-if="message"
          class="mt-4 rounded-lg border border-border bg-secondary p-3 text-sm text-foreground"
        >
          {{ message }}
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ApiRequestError, useApi } from "@/composables/useApi";

type ScannerProfile = {
  scannerProfileId: string;
  label?: string;
  labelAr?: string;
  mode: "BUS" | "SUBWAY";
  routeShortName?: string;
};

const qrPayload = ref("");
const scannerProfileId = ref("");
const stationsTraveled = ref("");
const message = ref("");
const { loading, get, post } = useApi();

const profiles = ref<ScannerProfile[]>([]);
const profilesLoading = ref(false);
const profilesError = ref("");
const profileFilter = ref("");
const { t, locale } = useI18n();

function profileLabel(profile: ScannerProfile) {
  const localized = locale.value === "ar" ? profile.labelAr : profile.label;
  return localized || profile.label || profile.labelAr || profile.scannerProfileId;
}

function matchesFilter(p: ScannerProfile) {
  const q = profileFilter.value.trim().toLowerCase();
  if (!q) return true;
  return (
    (p.label ?? "").toLowerCase().includes(q) ||
    (p.labelAr ?? "").toLowerCase().includes(q) ||
    (p.routeShortName ?? "").toLowerCase().includes(q) ||
    p.scannerProfileId.toLowerCase().includes(q)
  );
}

const filteredSubwayProfiles = computed(() =>
  profiles.value.filter((p) => p.mode === "SUBWAY" && matchesFilter(p)),
);
const filteredBusProfiles = computed(() =>
  profiles.value.filter((p) => p.mode === "BUS" && matchesFilter(p)),
);

onMounted(async () => {
  profilesLoading.value = true;
  profilesError.value = "";
  try {
    const data = await get<{ profiles: ScannerProfile[] }>(
      "/api/scanner-profiles",
    );
    profiles.value = data.profiles ?? [];
    // Default to the first subway profile (the entry/exit metro flow is the
    // common demo); fall back to whatever is first.
    const firstSubway = profiles.value.find((p) => p.mode === "SUBWAY");
    scannerProfileId.value =
      firstSubway?.scannerProfileId ??
      profiles.value[0]?.scannerProfileId ??
      "";
  } catch (error) {
    profilesError.value = t("operatorScan.errors.profiles");
  } finally {
    profilesLoading.value = false;
  }
});

async function validateTicket() {
  message.value = "";

  try {
    const payload = JSON.parse(qrPayload.value);
    // Only send a numeric station count when the operator entered one; an empty
    // field (or a bus scan) leaves the metro station limit unchecked.
    const stations = Number.parseInt(stationsTraveled.value, 10);
    const result = await post<{ status: string; message?: string }>(
      "/api/tickets/scan/validate",
      {
        qrPayload: payload,
        scannerProfileId: scannerProfileId.value,
        ...(Number.isFinite(stations) && stations > 0
          ? { stationsTraversed: stations }
          : {}),
        validatedAt: new Date().toISOString(),
      },
    );
    message.value =
      result.status === "used"
        ? t("operatorScan.results.valid")
        : t("operatorScan.results.status", { status: result.status });
  } catch (error) {
    if (error instanceof SyntaxError) {
      message.value = t("operatorScan.errors.invalidQr");
      return;
    }
    const code =
      error instanceof ApiRequestError
        ? (error.details as { error?: { code?: string } } | null)?.error?.code
        : undefined;
    const keyByCode: Record<string, string> = {
      INVALID_QR_PAYLOAD: "operatorScan.errors.invalidQr",
      TICKET_NOT_FOUND: "operatorScan.errors.ticketNotFound",
      TICKET_EXPIRED: "operatorScan.errors.expired",
      LEG_ALREADY_USED: "operatorScan.errors.alreadyUsed",
      LEG_ALREADY_REFUNDED: "operatorScan.errors.refunded",
      NO_MATCHING_LEG: "operatorScan.errors.noMatch",
      AMBIGUOUS_LEG_MATCH: "operatorScan.errors.ambiguous",
      STATION_LIMIT_EXCEEDED: "operatorScan.errors.stationLimit",
      SCANNER_PROFILE_NOT_FOUND: "operatorScan.errors.profileNotFound",
      VALIDATION_ERROR: "operatorScan.errors.validation",
    };
    message.value =
      code && keyByCode[code]
        ? t(keyByCode[code])
        : error instanceof Error
          ? error.message
          : t("operatorScan.errors.validate");
  }
}
</script>
