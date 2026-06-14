<template>
  <main
    class="admin-theme relative grid min-h-screen place-items-center bg-background px-4 text-foreground"
  >
    <button
      type="button"
      class="absolute end-4 top-4 rounded-xl border border-border bg-card p-2.5 text-muted-foreground shadow-sm transition-colors hover:bg-surface-hover hover:text-foreground"
      :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleTheme"
    >
      <Sun v-if="theme === 'dark'" class="h-5 w-5" />
      <Moon v-else class="h-5 w-5" />
    </button>

    <section
      class="w-full max-w-md rounded-2xl border border-primary/50 bg-card p-6 shadow-xl"
    >
      <p class="mb-2 text-xs font-bold uppercase tracking-wide text-[#FFC400]">
        Restricted Access
      </p>
      <h1 class="mb-3 text-3xl font-bold">Admin Portal</h1>
      <p class="mb-6 text-muted-foreground">Sign in with the backend ADMIN_SECRET.</p>
      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm">Admin Password</span>
          <input
            v-model="secret"
            type="password"
            class="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
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
import { Moon, Sun } from "@lucide/vue";
import { adminLogin } from "../services/adminApi";
import { applyTheme, getSavedTheme, type AppTheme } from "../../../services/theme";
import "../styles/admin-theme.css";

const router = useRouter();
const theme = ref<AppTheme>(getSavedTheme());
const secret = ref("");
const loading = ref(false);
const error = ref("");

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
}

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
