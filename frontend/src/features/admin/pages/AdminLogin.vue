<template>
  <main class="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
    <section class="w-full max-w-md rounded-xl border border-yellow-400/40 bg-slate-900 p-6">
      <p class="mb-2 text-xs font-bold uppercase tracking-wide text-yellow-400">Restricted Access</p>
      <h1 class="font-display text-3xl mb-3">Admin Portal</h1>
      <p class="mb-6 text-slate-400">Sign in with the backend ADMIN_SECRET.</p>
      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm">Admin secret</span>
          <input v-model="secret" type="password" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
        </label>
        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
        <button class="w-full rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-slate-950" :disabled="loading">
          {{ loading ? "Signing in..." : "Sign in as Admin" }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { adminLogin } from "@/features/admin/services/adminAuth";

const router = useRouter();
const secret = ref("");
const loading = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await adminLogin(secret.value);
    await router.push("/admin/stations");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Admin login failed.";
  } finally {
    loading.value = false;
  }
}
</script>
