<template>
  <ResultScreen
    tone="warning"
    icon="!"
    :headline="$t('result.alreadyUsed.headline')"
    :support="support"
    :primary-action="{ label: $t('common.nextScan') }"
    @primary="goNext"
  >
    <p class="mt-6 rounded-lg bg-white/20 px-4 py-3 text-lg font-black">
      {{ $t("result.alreadyUsed.guidance") }}
    </p>
  </ResultScreen>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ResultScreen from "@/components/ui/ResultScreen.vue";
import { getLatestOutcome } from "@/features/results/resultStore";
import { formatDateTime } from "@/services/format";
import { getCurrentLocale } from "@/i18n";

const router = useRouter();
const { t } = useI18n();
const outcome = getLatestOutcome();

const support = computed(() => {
  const validatedBy = outcome?.detail.validatedBy as Record<string, unknown> | undefined;
  const localizedLabel = getCurrentLocale() === "ar" ? validatedBy?.labelAr : validatedBy?.label;
  const fallbackLabel = typeof validatedBy?.label === "string" ? validatedBy.label : undefined;
  const scanner = typeof localizedLabel === "string"
    ? localizedLabel
    : fallbackLabel
      ? fallbackLabel
    : typeof validatedBy?.scannerProfileId === "string"
      ? validatedBy.scannerProfileId
      : t("common.unknown");
  const time = formatDateTime(outcome?.detail.validatedAt as string | undefined);

  if (!outcome?.detail.validatedAt) return t("result.alreadyUsed.partial");
  return t("result.alreadyUsed.support", { time, scanner });
});

function goNext() {
  void router.push({ name: "scan" });
}
</script>
