<template>
  <section>
    <div class="mb-7">
      <RouterLink :to="listPath" class="text-sm font-bold text-accent">{{ $t("common.back") }}</RouterLink>
      <h1 class="mt-3 text-4xl font-bold">{{ title }}</h1>
      <p class="mt-2 text-muted-foreground">{{ $t("places.formIntro") }}</p>
    </div>
    <StateView :state="state">
      <form class="admin-panel grid gap-7 p-6 lg:grid-cols-[1fr_0.8fr]" @submit.prevent="submit">
        <div class="grid content-start gap-5">
          <AppInput v-model="form.name" :label="$t('common.name')" :error="errors.name" />
          <div class="grid gap-3">
            <div><strong>{{ $t("common.aliases") }}</strong><p class="text-sm text-muted-foreground">{{ $t("places.aliasesHelp") }}</p></div>
            <div v-for="(_, index) in form.aliases" :key="index" class="flex gap-2"><input v-model="form.aliases[index]" class="focus-ring min-h-11 flex-1 rounded-md border bg-card px-3" /><AppButton type="button" variant="ghost" @click="form.aliases.splice(index, 1)">{{ $t("places.removeAlias") }}</AppButton></div>
            <AppButton type="button" variant="secondary" @click="form.aliases.push('')">{{ $t("places.addAlias") }}</AppButton>
          </div>
          <AppInput v-if="type === 'station'" v-model="form.line" :label="$t('common.line')" :error="errors.line" />
          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput v-model="form.lat" type="number" step="any" :label="$t('common.latitude')" :error="errors.location" />
            <AppInput v-model="form.lng" type="number" step="any" :label="$t('common.longitude')" />
          </div>
        </div>
        <aside class="grid content-start gap-5 rounded-lg bg-secondary/60 p-5">
          <AppSelect v-model="form.routeIds" multiple size="7" :label="$t('places.routeCount')" :error="errors.routes">
            <option v-for="route in routes" :key="route.routeId" :value="route.routeId">{{ route.shortName }} - {{ route.longName }}</option>
          </AppSelect>
          <p class="-mt-3 text-sm text-muted-foreground">{{ $t("places.routesHelp") }}</p>
          <AppSelect v-model="form.status" :label="$t('common.status')"><option value="active">{{ $t("common.active") }}</option><option value="inactive">{{ $t("common.inactive") }}</option></AppSelect>
          <p v-if="serverError" class="rounded-md bg-danger-soft p-3 text-sm text-destructive">{{ serverError }}</p>
          <div class="flex gap-3"><AppButton type="submit" :disabled="saving">{{ saving ? $t("common.loading") : $t("common.save") }}</AppButton><RouterLink :to="listPath"><AppButton type="button" variant="secondary">{{ $t("common.cancel") }}</AppButton></RouterLink></div>
        </aside>
      </form>
      <template #action><AppButton class="mt-5" @click="load">{{ $t("common.retry") }}</AppButton></template>
    </StateView>
  </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppSelect from "@/components/ui/AppSelect.vue";
import StateView from "@/components/shared/StateView.vue";
import * as api from "@/services/api";
import type { PlaceInput, PlaceStatus, PlaceType, Route } from "@/services/api";
const props = defineProps<{ type: PlaceType }>();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const id = computed(() => typeof route.params.id === "string" ? route.params.id : "");
const listPath = computed(() => props.type === "stop" ? "/stops" : "/stations");
const title = computed(() => t(id.value ? (props.type === "stop" ? "places.editStop" : "places.editStation") : (props.type === "stop" ? "places.newStop" : "places.newStation")));
const form = reactive({ name: "", aliases: [] as string[], line: "", lat: "" as string | number, lng: "" as string | number, routeIds: [] as string[], status: "active" as PlaceStatus });
const routes = ref<Route[]>([]);
const state = ref<"loading" | "error" | "ready">("loading");
const saving = ref(false);
const dirty = ref(false);
const serverError = ref("");
const errors = reactive({ name: "", location: "", routes: "", line: "" });
async function load() {
  state.value = "loading";
  try {
    routes.value = (await api.getRoutes()).routes;
    if (id.value) {
      const place = (await api.getPlace(id.value)).place;
      Object.assign(form, { name: place.name, aliases: [...place.aliases], line: place.line ?? "", lat: place.location.lat, lng: place.location.lng, routeIds: [...place.routeIds], status: place.status });
    }
    state.value = "ready"; setTimeout(() => { dirty.value = false; }, 0);
  } catch { state.value = "error"; }
}
function validate() {
  errors.name = form.name.trim() ? "" : t("places.requiredName");
  errors.location = Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lng)) ? "" : t("places.requiredLocation");
  errors.routes = form.routeIds.length ? "" : t("places.requiredRoutes");
  errors.line = props.type === "station" && !form.line.trim() ? t("places.requiredLine") : "";
  return !Object.values(errors).some(Boolean);
}
async function submit() {
  if (!validate()) return;
  saving.value = true; serverError.value = "";
  const payload: PlaceInput = {
    type: props.type, name: form.name, aliases: form.aliases, location: { lat: Number(form.lat), lng: Number(form.lng) },
    routeIds: form.routeIds, status: form.status, ...(props.type === "station" ? { line: form.line } : {})
  };
  try {
    const result = id.value ? await api.updatePlace(id.value, payload) : await api.createPlace(payload);
    dirty.value = false;
    if (result.warnings.length) window.alert(`${t("places.warningTitle")}\n${result.warnings.map((warning) => t(warning.code === "POSSIBLE_DUPLICATE" ? "places.duplicate" : "places.outOfCoverage")).join("\n")}`);
    await router.push(listPath.value);
  } catch (error) { serverError.value = error instanceof Error ? error.message : String(error); }
  finally { saving.value = false; }
}
function beforeUnload(event: BeforeUnloadEvent) { if (dirty.value) event.preventDefault(); }
watch(form, () => { dirty.value = true; }, { deep: true });
onBeforeRouteLeave(() => !dirty.value || window.confirm(t("places.unsaved")));
onMounted(() => { window.addEventListener("beforeunload", beforeUnload); void load(); });
onBeforeUnmount(() => window.removeEventListener("beforeunload", beforeUnload));
</script>
