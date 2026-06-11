<template>
  <main
    class="grid min-h-screen place-items-center bg-[#111827] px-4 text-white"
  >
    <section
      class="w-full max-w-md rounded-2xl border border-[#FFC400]/50 bg-[#1F2937] p-6"
    >
      <p class="mb-2 text-xs font-bold uppercase tracking-wide text-[#FFC400]">
        Restricted Access
      </p>
      <h1 class="mb-3 text-3xl font-bold">Admin Portal</h1>
      <p class="mb-6 text-[#9CA3AF]">Sign in with the backend ADMIN_SECRET.</p>
      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm">Admin secret</span>
          <input
            v-model="secret"
            type="password"
            class="w-full rounded-xl border border-[#374151] bg-[#111827] px-3 py-2"
          />
        </label>
        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
        <button
          class="w-full rounded-xl bg-[#FFC400] px-4 py-3 font-semibold text-[#111827]"
          :disabled="loading"
        >
          {{ loading ? "Signing in..." : "Sign in as Admin" }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { adminLogin } from "../services/adminApi";

const router = useRouter();
const secret = ref("");
const loading = ref(false);
const error = ref("");

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await adminLogin(secret.value);
    await router.push("/admin");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Admin login failed.";
  } finally {
    loading.value = false;
  }
}
</script>
