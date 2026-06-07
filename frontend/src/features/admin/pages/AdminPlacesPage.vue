<template>
  <section class="space-y-4">
    <form class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-6" @submit.prevent="save">
      <input v-model="form.name" class="admin-input md:col-span-2" placeholder="Name" />
      <input v-if="type === 'station'" v-model="form.line" class="admin-input" placeholder="Line" />
      <input v-model.number="form.location.lat" class="admin-input" placeholder="Lat" />
      <input v-model.number="form.location.lng" class="admin-input" placeholder="Lng" />
      <input v-model="routeIdsText" class="admin-input md:col-span-2" placeholder="Route IDs comma separated" />
      <select v-model="form.status" class="admin-input">
        <option value="active">active</option>
        <option value="inactive">inactive</option>
      </select>
      <button class="rounded-lg bg-slate-950 px-4 py-2 text-white md:col-span-1">
        {{ editingId ? "Update" : "Create" }}
      </button>
      <button v-if="editingId" type="button" class="rounded-lg border px-4 py-2" @click="reset">Cancel</button>
    </form>

    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <div class="rounded-xl border border-slate-200 bg-white">
      <table class="w-full text-sm">
        <thead class="bg-slate-950 text-left text-yellow-400">
          <tr><th class="p-3">Name</th><th class="p-3">Line</th><th class="p-3">Status</th><th class="p-3">Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="place in places" :key="place.id" class="border-t">
            <td class="p-3">{{ place.name }}</td>
            <td class="p-3">{{ place.line || "-" }}</td>
            <td class="p-3">{{ place.status }}</td>
            <td class="flex gap-2 p-3">
              <button class="text-blue-700" @click="edit(place)">Edit</button>
              <button class="text-red-700" @click="remove(place.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { createPlace, deletePlace, listPlaces, updatePlace, type AdminPlace } from "@/features/admin/services/adminApi";

const props = defineProps<{ type: "stop" | "station" }>();
const places = ref<AdminPlace[]>([]);
const error = ref("");
const editingId = ref("");
const routeIdsText = ref("");
const form = reactive({
  type: props.type,
  name: "",
  line: "",
  location: { lat: 30.0444, lng: 31.2357 },
  routeIds: [] as string[],
  status: "active" as "active" | "inactive",
});

onMounted(load);
watch(() => props.type, () => { reset(); void load(); });

async function load() {
  error.value = "";
  try { places.value = await listPlaces(props.type); } catch (err) { error.value = msg(err); }
}
async function save() {
  error.value = "";
  form.type = props.type;
  form.routeIds = routeIdsText.value.split(",").map((id) => id.trim()).filter(Boolean);
  try {
    if (editingId.value) await updatePlace(editingId.value, form);
    else await createPlace(form);
    reset();
    await load();
  } catch (err) { error.value = msg(err); }
}
function edit(place: AdminPlace) {
  editingId.value = place.id;
  form.name = place.name;
  form.line = place.line ?? "";
  form.location = { ...place.location };
  form.status = place.status;
  routeIdsText.value = place.routeIds.join(", ");
}
async function remove(id: string) {
  try { await deletePlace(id); await load(); } catch (err) { error.value = msg(err); }
}
function reset() {
  editingId.value = "";
  form.name = "";
  form.line = "";
  routeIdsText.value = "";
  form.status = "active";
}
function msg(err: unknown) {
  return err instanceof Error ? err.message : "Admin request failed.";
}
</script>

<style scoped>
.admin-input {
  border: 1px solid rgb(203 213 225);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
}
</style>
