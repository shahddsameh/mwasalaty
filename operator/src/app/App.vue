<template>
  <RouterView v-slot="{ Component }">
    <OfflineBanner />
    <component :is="Component" />
  </RouterView>
</template>

<script setup lang="ts">
import { onErrorCaptured } from "vue";
import { useRouter } from "vue-router";
import OfflineBanner from "@/components/shared/OfflineBanner.vue";

const router = useRouter();

onErrorCaptured(() => {
  void router.push({ name: "account", query: { fallback: "error" } });
  return false;
});
</script>
