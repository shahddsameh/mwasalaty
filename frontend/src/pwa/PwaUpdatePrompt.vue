<template></template>

<script setup lang="ts">
import { watch } from "vue";
import { useRegisterSW } from "virtual:pwa-register/vue";

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
});

watch(needRefresh, (refreshAvailable) => {
  if (refreshAvailable) void updateServiceWorker(true);
});
</script>
