<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-5 md:py-8 flex flex-col gap-4 md:gap-6"
  >
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">
        {{ error }}
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between gap-3 border-b border-[#E6DEC8] p-4 md:p-5">
        <div>
          <h2 class="text-lg font-bold text-[#2B2A27]" style="font-family: 'DM Sans', sans-serif">
            Registered Users
          </h2>
          <p class="text-sm text-[#6B7280]">Supabase Auth users</p>
        </div>
        <button
          class="rounded-xl border border-[#E6DEC8] px-4 py-2 text-sm font-semibold hover:bg-[#FFF7D6]"
          type="button"
          :disabled="loading"
          @click="loadUsers"
        >
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead class="bg-[#111827] text-[#FFC400] uppercase text-xs tracking-wide">
            <tr>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Phone</th>
              <th class="px-4 py-3">Created</th>
              <th class="px-4 py-3">Last sign in</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && users.length === 0">
              <td class="px-4 py-6 text-[#6B7280]" colspan="7">No users found.</td>
            </tr>
            <tr v-for="user in users" :key="user.id" class="border-b border-[#E6DEC8]">
              <td class="px-4 py-3 font-semibold text-[#111827]">{{ user.email || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ user.name || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ user.phone || '-' }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ formatDate(user.created_at) }}</td>
              <td class="px-4 py-3 text-[#4B5563]">{{ formatDate(user.last_sign_in_at) }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="user.status === 'blocked' ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#ECFDF5] text-[#047857]'"
                >
                  {{ user.status }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                  <button class="rounded-lg border px-3 py-1.5 font-semibold" @click="selectedUser = user">
                    View Details
                  </button>
                  <button
                    v-if="user.status !== 'blocked'"
                    class="rounded-lg border border-[#FCA5A5] px-3 py-1.5 font-semibold text-[#B91C1C]"
                    :disabled="busyId === user.id"
                    @click="block(user.id)"
                  >
                    Block
                  </button>
                  <button
                    v-else
                    class="rounded-lg border border-[#A7F3D0] px-3 py-1.5 font-semibold text-[#047857]"
                    :disabled="busyId === user.id"
                    @click="unblock(user.id)"
                  >
                    Unblock
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Card v-if="selectedUser">
      <div class="p-4 md:p-5 border-b border-[#E6DEC8] flex items-center justify-between gap-4">
        <h3 class="text-lg font-bold text-[#2B2A27]">User Details</h3>
        <button class="rounded-lg border border-[#E6DEC8] px-3 py-1.5 text-sm font-semibold" @click="selectedUser = null">Close</button>
      </div>
      <div class="p-4 md:p-5 grid gap-4 md:grid-cols-2 text-sm">
        <div class="rounded-xl border border-[#E6DEC8] p-3"><span class="text-[#6B7280]">Email</span><p class="font-semibold">{{ selectedUser.email || '-' }}</p></div>
        <div class="rounded-xl border border-[#E6DEC8] p-3"><span class="text-[#6B7280]">Name</span><p class="font-semibold">{{ selectedUser.name || '-' }}</p></div>
        <div class="rounded-xl border border-[#E6DEC8] p-3"><span class="text-[#6B7280]">Phone</span><p class="font-semibold">{{ selectedUser.phone || '-' }}</p></div>
        <div class="rounded-xl border border-[#E6DEC8] p-3"><span class="text-[#6B7280]">Status</span><p class="font-semibold">{{ selectedUser.status }}</p></div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Card } from '../components/AdminShared.vue';
import {
  blockUser,
  listUsers,
  unblockUser,
  type AdminUser,
} from '../services/adminApi';

const users = ref<AdminUser[]>([]);
const loading = ref(false);
const error = ref('');
const busyId = ref<string | null>(null);
const selectedUser = ref<AdminUser | null>(null);

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

async function loadUsers() {
  loading.value = true;
  error.value = '';
  try {
    users.value = await listUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load users';
  } finally {
    loading.value = false;
  }
}

async function block(id: string) {
  busyId.value = id;
  error.value = '';
  try {
    await blockUser(id);
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to block user';
  } finally {
    busyId.value = null;
  }
}

async function unblock(id: string) {
  busyId.value = id;
  error.value = '';
  try {
    await unblockUser(id);
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to unblock user';
  } finally {
    busyId.value = null;
  }
}

onMounted(loadUsers);
</script>
