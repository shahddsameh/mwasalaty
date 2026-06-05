<template>
  <ResultScreen
    tone="neutral"
    icon="?"
    :headline="$t('result.noMatch.headline')"
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
import { displayProfile } from "@/services/format";
import { getSelectedProfile } from "@/services/session";

const router = useRouter();
const { t } = useI18n();
const outcome = getLatestOutcome();
const profile = getSelectedProfile();

const support = computed(() => {
  if (!outcome) return t("result.noMatch.partial");
  return t("result.noMatch.support", { profile: displayProfile(profile) });
});

function goNext() {
  void router.push({ name: "scan" });
}
</script>
