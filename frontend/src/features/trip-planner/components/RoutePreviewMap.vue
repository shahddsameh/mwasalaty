<template>
  <div ref="mapEl" class="h-full w-full" />
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import type { RouteDetailStep } from "@/services/api";
import { useNavMap } from "@/composables/useNavMap";

const props = defineProps<{ steps?: RouteDetailStep[] }>();

const mapEl = ref<HTMLElement | null>(null);
const { initMap, fitFullRoute } = useNavMap(mapEl, props.steps ?? []);

onMounted(async () => {
  await initMap();
  // Wait a frame so the container has its final size before fitting bounds.
  await nextTick();
  fitFullRoute();
});
</script>
