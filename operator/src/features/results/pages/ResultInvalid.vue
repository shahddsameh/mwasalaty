<template>
  <ResultScreen
    tone="reject"
    icon="X"
    :headline="$t('result.invalid.headline')"
    :support="support"
    :primary-action="{ label: $t('common.nextScan') }"
    @primary="goNext"
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
  const reason = outcome?.detail.reason;
  if (typeof reason !== "string" || !reason) return t("result.invalid.fallback");
  return t("result.invalid.support", { reason });
});

function goNext() {
  void router.push({ name: "scan" });
}
</script>
