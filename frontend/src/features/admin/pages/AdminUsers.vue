<template>
  <section class="space-y-4">
    <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <form
      v-if="editing"
      class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4"
      @submit.prevent="save"
    >
      <input v-model="editing.email" class="admin-input" placeholder="Email" />
      <input v-model="editing.name" class="admin-input" placeholder="Name" />
      <input v-model="editing.phone" class="admin-input" placeholder="Phone" />
      <div class="flex gap-2">
        <button class="rounded-lg bg-slate-950 px-4 py-2 text-white">Save</button>
        <button type="button" class="rounded-lg border px-4 py-2" @click="editing = null">Cancel</button>
      </div>
    </form>

    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 class="font-display text-xl">Registered Users</h2>
        <button class="rounded-lg border px-3 py-2 text-sm" @click="load">Refresh</button>
      </div>
      <div v-if="loading" class="p-4 text-slate-500">Loading users...</div>
      <div v-else-if="!users.length" class="p-4 text-slate-500">No users found.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-950 text-left text-yellow-400">
            <tr>
              <th class="p-3">Email</th>
              <th class="p-3">Name</th>
              <th class="p-3">Phone</th>
              <th class="p-3">Created</th>
              <th class="p-3">Last sign in</th>
              <th class="p-3">Status</th>
              <th class="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-t">
              <td class="p-3">{{ user.email }}</td>
              <td class="p-3">{{ user.name || "-" }}</td>
              <td class="p-3">{{ user.phone || "-" }}</td>
              <td class="p-3">{{ formatDate(user.created_at) }}</td>
              <td class="p-3">{{ formatDate(user.last_sign_in_at) }}</td>
              <td class="p-3">{{ user.status }}</td>
              <td class="flex gap-2 p-3">
                <button class="text-blue-700" @click="editing = { ...user }">Edit</button>
                <button v-if="user.status === 'active'" class="text-red-700" @click="block(user.id)">Block</button>
                <button v-else class="text-green-700" @click="unblock(user.id)">Unblock</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  blockUser,
  listUsers,
  unblockUser,
  updateUser,
  type AdminUser,
} from "@/features/admin/services/adminApi";

const users = ref<AdminUser[]>([]);
const editing = ref<AdminUser | null>(null);
const loading = ref(false);
const error = ref("");

onMounted(load);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    users.value = await listUsers();
  } catch (err) {
    error.value = msg(err);
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!editing.value) return;
  try {
    await updateUser(editing.value.id, editing.value);
    editing.value = null;
    await load();
  } catch (err) {
    error.value = msg(err);
  }
}

async function block(id: string) {
  try { await blockUser(id); await load(); } catch (err) { error.value = msg(err); }
}

async function unblock(id: string) {
  try { await unblockUser(id); await load(); } catch (err) { error.value = msg(err); }
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function msg(err: unknown) {
  return err instanceof Error ? err.message : "Admin users request failed.";
}
</script>

<style scoped>
.admin-input {
  border: 1px solid rgb(203 213 225);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
}
</style>
