<template>
  <div
    class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5"
  >
    <Card v-if="error" className="border-[#FCA5A5] bg-[#FEF2F2]">
      <div class="p-4 text-sm font-medium text-[#B91C1C]">
        {{ error }}
      </div>
    </Card>

    <Card>
      <div
        class="flex items-center justify-between gap-3 border-b border-white/10 p-4 md:p-5"
      >
        <div>
          <h2
            class="text-lg font-bold text-[#F8FAFC]"
            style="font-family: &quot;DM Sans&quot;, sans-serif"
          >
            Registered Users
          </h2>
          <p class="text-sm text-[#94A3B8]">Supabase Auth users</p>
        </div>
        <button
          class="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#F8FAFC] hover:border-[#FFC400] hover:text-[#FFC400]"
          type="button"
          :disabled="loading"
          @click="loadUsers"
        >
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </div>

      <div
        class="bg-[#1E293B] rounded-xl overflow-hidden border border-white/10"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="sticky top-0 bg-[#111827] border-b border-white/10">
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
            <tbody class="divide-y divide-white/10">
              <tr v-if="!loading && users.length === 0">
                <td class="px-4 py-6 text-[#9CA3AF]" colspan="7">
                  No users found.
                </td>
              </tr>
              <tr
                v-for="user in paginatedUsers"
                :key="user.id"
                class="hover:bg-[#0F172A] transition-colors"
              >
                <td class="px-4 py-3 font-medium text-white truncate">
                  {{ user.email || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">{{ user.name || "-" }}</td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ user.phone || "-" }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-4 py-3 text-[#94A3B8]">
                  {{ formatDate(user.last_sign_in_at) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="
                      user.status === 'blocked'
                        ? 'bg-red-500/10 text-[#EF4444]'
                        : 'bg-emerald-500/10 text-[#10B981]'
                    "
                    >{{ user.status }}</span
                  >
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex flex-wrap gap-2 justify-end">
                    <button
                      v-if="user.status !== 'blocked'"
                      class="rounded-xl border border-red-500/30 px-3 py-1.5 font-semibold text-[#EF4444] hover:bg-red-500/10"
                      :disabled="busyId === user.id"
                      @click="block(user.id)"
                    >
                      Block
                    </button>
                    <button
                      v-else
                      class="rounded-xl border border-emerald-500/30 px-3 py-1.5 font-semibold text-[#10B981] hover:bg-emerald-500/10"
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
        <AdminPagination v-model:page="page" :total-items="users.length" :page-size="pageSize" />
      </div>
    </Card>
    <!-- View Details removed to simplify actions; Block/Unblock unchanged -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Card } from "../components/AdminShared.vue";
import AdminPagination from "../components/AdminPagination.vue";
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
const page = ref(1);
const pageSize = 10;
const paginatedUsers = computed(() => users.value.slice((page.value - 1) * pageSize, page.value * pageSize));

watch(() => users.value.length, () => {
  page.value = Math.min(page.value, Math.max(1, Math.ceil(users.value.length / pageSize)));
});

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
