<template>
  <section>
    <div class="mb-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <div><p class="text-xs font-bold uppercase tracking-[0.3em] text-accent">Live catalog</p><h1 class="mt-2 text-5xl font-bold">{{ $t("dashboard.title") }}</h1><p class="mt-3 max-w-2xl text-lg text-muted-foreground">{{ $t("dashboard.subtitle") }}</p></div>
      <div class="admin-panel flex items-center justify-around bg-surface-dark p-6 text-white"><div><span class="block text-sm text-white/55">{{ $t("dashboard.total") }}</span><strong class="text-5xl text-primary">{{ summary?.totals.total ?? "-" }}</strong></div><div class="h-16 w-px bg-white/15"></div><div class="text-sm text-white/65"><p>{{ $t("dashboard.active") }}: <strong class="text-white">{{ summary?.activeInactive.active ?? "-" }}</strong></p><p class="mt-2">{{ $t("dashboard.inactive") }}: <strong class="text-white">{{ summary?.activeInactive.inactive ?? "-" }}</strong></p></div></div>
    </div>
    <StateView :state="state">
      <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <article v-for="card in cards" :key="card.label" class="admin-panel p-5"><span class="text-sm text-muted-foreground">{{ card.label }}</span><strong class="mt-3 block text-4xl">{{ card.value }}</strong></article>
      </div>
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <section class="admin-panel p-6"><h2 class="text-2xl font-bold">{{ $t("dashboard.byLine") }}</h2><div class="mt-5 grid gap-3"><div v-for="(count, line) in summary?.byLine" :key="line" class="flex items-center justify-between border-b border-border pb-3"><span>{{ line }}</span><strong class="rounded-full bg-primary-soft px-3 py-1">{{ count }}</strong></div></div></section>
        <section class="admin-panel p-6"><h2 class="text-2xl font-bold">{{ $t("dashboard.recent") }}</h2><div class="mt-5 grid gap-3"><RouterLink v-for="place in summary?.recent" :key="place.id" :to="`/${place.type === 'stop' ? 'stops' : 'stations'}/${place.id}`" class="flex items-center justify-between rounded-md bg-muted p-3 hover:bg-secondary"><span><strong class="block">{{ place.name }}</strong><small class="text-muted-foreground">{{ place.type }} · {{ new Date(place.updatedAt).toLocaleString() }}</small></span><span>→</span></RouterLink></div></section>
      </div>
      <div class="mt-6 flex flex-wrap gap-3"><RouterLink to="/stops/new"><AppButton>{{ $t("places.newStop") }}</AppButton></RouterLink><RouterLink to="/stations/new"><AppButton variant="secondary">{{ $t("places.newStation") }}</AppButton></RouterLink></div>
      <template #action><AppButton class="mt-5" @click="load">{{ $t("common.retry") }}</AppButton></template>
    </StateView>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppButton from "@/components/ui/AppButton.vue";
import StateView from "@/components/shared/StateView.vue";
import * as api from "@/services/api";
import type { DashboardSummary } from "@/services/api";
const { t } = useI18n();
const summary = ref<DashboardSummary | null>(null);
const state = ref<"loading" | "error" | "ready">("loading");
const cards = computed(() => [
  { label: t("dashboard.stops"), value: summary.value?.totals.stops ?? "-" },
  { label: t("dashboard.stations"), value: summary.value?.totals.stations ?? "-" },
  { label: t("dashboard.active"), value: summary.value?.activeInactive.active ?? "-" },
  { label: t("dashboard.inactive"), value: summary.value?.activeInactive.inactive ?? "-" }
]);
async function load() { state.value = "loading"; try { summary.value = await api.getDashboard(); state.value = "ready"; } catch { state.value = "error"; } }
onMounted(load);
</script>
