<template>
  <section>
    <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.3em] text-accent">{{ type === "stop" ? $t("nav.stops") : $t("nav.stations") }}</p>
        <h1 class="mt-2 text-4xl font-bold">{{ type === "stop" ? $t("places.newStop").replace($t("common.new"), "").trim() || $t("nav.stops") : $t("nav.stations") }}</h1>
        <p class="mt-2 text-muted-foreground">{{ $t("places.formIntro") }}</p>
      </div>
      <RouterLink :to="`/${type === 'stop' ? 'stops' : 'stations'}/new`"><AppButton>{{ type === "stop" ? $t("places.newStop") : $t("places.newStation") }}</AppButton></RouterLink>
    </div>

    <StateView :state="state">
      <div class="admin-panel overflow-x-auto">
        <table class="w-full border-collapse text-start">
          <thead class="bg-surface-dark text-start text-xs uppercase tracking-wider text-white/70">
            <tr><th class="p-4">{{ $t("common.name") }}</th><th v-if="type === 'station'" class="p-4">{{ $t("common.line") }}</th><th class="p-4">{{ $t("places.aliasCount") }}</th><th class="p-4">{{ $t("places.routeCount") }}</th><th class="p-4">{{ $t("common.status") }}</th><th class="p-4"></th></tr>
          </thead>
          <tbody>
            <tr v-for="place in places" :key="place.id" class="border-t border-border transition hover:bg-secondary/50">
              <td class="p-4"><strong>{{ place.name }}</strong><span class="mt-1 block font-mono text-xs text-muted-foreground">{{ place.id }}</span></td>
              <td v-if="type === 'station'" class="p-4">{{ place.line }}</td>
              <td class="p-4">{{ place.aliases.length }}</td><td class="p-4">{{ place.routeIds.length }}</td>
              <td class="p-4"><span :class="place.status === 'active' ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'" class="rounded-full px-3 py-1 text-xs font-bold">{{ $t(`common.${place.status}`) }}</span></td>
              <td class="p-4"><div class="flex justify-end gap-2"><RouterLink :to="`/${type === 'stop' ? 'stops' : 'stations'}/${place.id}`"><AppButton variant="secondary">{{ $t("common.edit") }}</AppButton></RouterLink><AppButton variant="danger" @click="pendingDelete = place">{{ $t("common.delete") }}</AppButton></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #action><AppButton class="mt-5" @click="load">{{ $t("common.retry") }}</AppButton></template>
    </StateView>
    <ConfirmDialog :open="Boolean(pendingDelete)" :title="$t('places.deleteTitle')" :message="$t('places.deleteMessage')" @cancel="pendingDelete = null" @confirm="remove" />
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppButton from "@/components/ui/AppButton.vue";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import StateView from "@/components/shared/StateView.vue";
import * as api from "@/services/api";
import type { CatalogPlace, PlaceType } from "@/services/api";
const props = defineProps<{ type: PlaceType }>();
const places = ref<CatalogPlace[]>([]);
const state = ref<"loading" | "empty" | "error" | "ready">("loading");
const pendingDelete = ref<CatalogPlace | null>(null);
async function load() {
  state.value = "loading";
  try { places.value = (await api.listPlaces({ type: props.type, includeInactive: true })).places; state.value = places.value.length ? "ready" : "empty"; }
  catch { state.value = "error"; }
}
async function remove() {
  if (!pendingDelete.value) return;
  await api.deletePlace(pendingDelete.value.id);
  pendingDelete.value = null;
  await load();
}
onMounted(load);
</script>
