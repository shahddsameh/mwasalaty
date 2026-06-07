<template>
  <section class="space-y-4">
    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <div class="grid gap-4 sm:grid-cols-3">
      <Card label="Stops" :value="dashboard?.totals.stops ?? 0" />
      <Card label="Stations" :value="dashboard?.totals.stations ?? 0" />
      <Card label="Total Places" :value="dashboard?.totals.total ?? 0" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from "vue";
import { getDashboard, type Dashboard } from "@/features/admin/services/adminApi";

const dashboard = ref<Dashboard | null>(null);
const error = ref("");
onMounted(async () => {
  try {
    dashboard.value = await getDashboard();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Dashboard could not load.";
  }
});

const Card = defineComponent({
  props: { label: String, value: Number },
  setup: (props) => () =>
    h("div", { class: "rounded-xl border border-slate-200 bg-white p-5" }, [
      h("div", { class: "text-sm text-slate-500" }, props.label),
      h("div", { class: "font-display text-4xl" }, props.value),
    ]),
});
</script>
