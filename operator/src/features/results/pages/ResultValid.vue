<template>
  <ResultScreen
    tone="success"
    icon="✓"
    :headline="$t('result.valid.headline')"
    :support="support"
    :primary-action="{ label: $t('common.nextScan') }"
    :auto-advance-ms="4000"
    @primary="goNext"
    @auto-advance="goNext"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ResultScreen from "@/components/ui/ResultScreen.vue";
import { getLatestOutcome } from "@/features/results/resultStore";

const router = useRouter();
const { t } = useI18n();
const outcome = getLatestOutcome();

const support = computed(() => {
  if (!outcome?.ticketLegId) return t("result.valid.partial");
  return t("result.valid.support", {
    leg: outcome.ticketLegId,
    remaining: outcome.detail.remainingLegs ?? t("common.dash")
  });
});

function goNext() {
  void router.push({ name: "scan" });
}
</script>
