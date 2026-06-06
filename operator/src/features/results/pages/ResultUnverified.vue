<template>
  <ResultScreen
    tone="slate"
    icon="!"
    :headline="$t('result.unverified.headline')"
    :support="$t('result.unverified.support')"
    :primary-action="{ label: $t('common.nextScan') }"
    :tag="$t('result.unverified.tag')"
    @primary="goNext"
  />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ResultScreen from "@/components/ui/ResultScreen.vue";

const router = useRouter();

function goNext() {
  void router.push({ name: "scan" });
}
</script>
