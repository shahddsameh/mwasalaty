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
      <div
        class="flex items-center justify-between gap-3 border-b border-[#E6DEC8] p-4 md:p-5"
      >
        <div>
          <h2
            class="text-lg font-bold text-[#2B2A27]"
            style="font-family: &quot;DM Sans&quot;, sans-serif"
          >
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
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </div>

      <div
        class="bg-[#1F2937] rounded-xl overflow-hidden border border-[#374151]"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="bg-[#111827] border-b border-[#374151]">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Email
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Name
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Phone
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Created
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Last sign in
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] uppercase tracking-wide"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#374151]">
              <tr v-if="!loading && users.length === 0">
                <td class="px-4 py-6 text-[#9CA3AF]" colspan="7">
                  No users found.
                </td>
              </tr>
              <tr
                v-for="user in users"
                :key="user.id"
                class="hover:bg-[#111827] transition-colors"
              >
                <td class="px-4 py-4 font-medium text-white truncate">
                  {{ user.email || "-" }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF]">{{ user.name || "-" }}</td>
                <td class="px-4 py-4 text-[#9CA3AF]">
                  {{ user.phone || "-" }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF]">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-4 py-4 text-[#9CA3AF]">
                  {{ formatDate(user.last_sign_in_at) }}
                </td>
                <td class="px-4 py-4">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="
                      user.status === 'blocked'
                        ? 'bg-[#FEF2F2] text-[#B91C1C]'
                        : 'bg-[#ECFDF5] text-[#047857]'
                    "
                    >{{ user.status }}</span
                  >
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="flex flex-wrap gap-2 justify-end">
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
      </div>
    </Card>
    <!-- View Details removed to simplify actions; Block/Unblock unchanged -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Card } from "../components/AdminShared.vue";
import {
  blockUser,
  listUsers,
  unblockUser,
  type AdminUser,
} from "../services/adminApi";

const users = ref<AdminUser[]>([]);
const loading = ref(false);
const error = ref("");
const busyId = ref<string | null>(null);

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    users.value = await listUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load users";
  } finally {
    loading.value = false;
  }
}

async function block(id: string) {
  busyId.value = id;
  error.value = "";
  try {
    await blockUser(id);
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to block user";
  } finally {
    busyId.value = null;
  }
}

async function unblock(id: string) {
  busyId.value = id;
  error.value = "";
  try {
    await unblockUser(id);
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to unblock user";
  } finally {
    busyId.value = null;
  }
}

onMounted(loadUsers);
</script>
