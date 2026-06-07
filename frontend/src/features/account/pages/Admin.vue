<template>
  <main class="min-h-screen bg-background pb-20">
    <div class="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
      <h1 class="font-display text-3xl text-foreground mb-2">Admin</h1>
      <p class="text-muted-foreground mb-6">
        Stops and stations catalog dashboard.
      </p>

      <section v-if="!token" class="max-w-md rounded-xl border-2 border-border bg-card p-5">
        <h2 class="font-display text-xl text-foreground mb-4">Admin Login</h2>
        <form class="space-y-4" @submit.prevent="login">
          <label class="block">
            <span class="mb-1 block text-sm text-muted-foreground">Admin secret</span>
            <input
              v-model="secret"
              type="password"
              class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              autocomplete="current-password"
            />
          </label>
          <p v-if="message" class="text-sm text-destructive">{{ message }}</p>
          <AppButton class="w-full" :disabled="loading">
            {{ loading ? "Signing in..." : "Sign in" }}
          </AppButton>
        </form>
      </section>

      <section v-else class="space-y-6">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-muted-foreground">Signed in to admin console.</p>
          <AppButton variant="outline" @click="logout">Logout</AppButton>
        </div>

        <p v-if="message" class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {{ message }}
        </p>

        <div v-if="dashboard" class="grid gap-3 sm:grid-cols-3">
          <Stat label="Stops" :value="dashboard.totals.stops" />
          <Stat label="Stations" :value="dashboard.totals.stations" />
          <Stat label="Total places" :value="dashboard.totals.total" />
        </div>

        <div class="rounded-xl border-2 border-border bg-card p-5">
          <h2 class="font-display text-xl text-foreground mb-4">Stops & Stations</h2>
          <div v-if="loading" class="text-muted-foreground">Loading...</div>
          <div v-else-if="!places.length" class="text-muted-foreground">No places found.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-muted-foreground">
                <tr>
                  <th class="py-2 pe-3">Name</th>
                  <th class="py-2 pe-3">Type</th>
                  <th class="py-2 pe-3">Line</th>
                  <th class="py-2 pe-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="place in places" :key="place.id" class="border-t border-border">
                  <td class="py-2 pe-3 text-foreground">{{ place.name }}</td>
                  <td class="py-2 pe-3 text-muted-foreground">{{ place.type }}</td>
                  <td class="py-2 pe-3 text-muted-foreground">{{ place.line || "-" }}</td>
                  <td class="py-2 pe-3 text-muted-foreground">{{ place.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from "vue";
import AppButton from "@/components/ui/AppButton.vue";

type AdminPlace = {
  id: string;
  name: string;
  type: "stop" | "station";
  line?: string;
  status: string;
};
type Dashboard = {
  totals: { stops: number; stations: number; total: number };
};

const TOKEN_KEY = "mwasalaty:admin-token";
const token = ref(localStorage.getItem(TOKEN_KEY) ?? "");
const secret = ref("");
const loading = ref(false);
const message = ref("");
const places = ref<AdminPlace[]>([]);
const dashboard = ref<Dashboard | null>(null);

onMounted(() => {
  if (token.value) void loadAdminData();
});

async function login() {
  message.value = "";
  loading.value = true;
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secret.value }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      message.value =
        res.status === 401
          ? "Admin login failed. Check ADMIN_SECRET in backend/.env and the secret you entered."
          : data?.error?.message ?? data?.message ?? "Admin login failed.";
      return;
    }
    token.value = data.token;
    localStorage.setItem(TOKEN_KEY, data.token);
    secret.value = "";
    await loadAdminData();
  } finally {
    loading.value = false;
  }
}

async function loadAdminData() {
  message.value = "";
  loading.value = true;
  try {
    const [dashboardRes, placesRes] = await Promise.all([
      adminFetch("/api/admin/dashboard"),
      adminFetch("/api/admin/places"),
    ]);
    dashboard.value = await dashboardRes.json();
    places.value = ((await placesRes.json()).places ?? []) as AdminPlace[];
  } catch (error) {
    message.value = error instanceof Error ? error.message : "Admin data could not load.";
  } finally {
    loading.value = false;
  }
}

async function adminFetch(url: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.value}` },
  });
  if (res.status === 401) {
    token.value = "";
    localStorage.removeItem(TOKEN_KEY);
    throw new Error("Admin session is invalid. Sign in with the ADMIN_SECRET from backend/.env.");
  }
  if (!res.ok) throw new Error(`Admin request failed (${res.status}).`);
  return res;
}

async function logout() {
  if (token.value) {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token.value}` },
    }).catch(() => null);
  }
  token.value = "";
  localStorage.removeItem(TOKEN_KEY);
  dashboard.value = null;
  places.value = [];
}

const Stat = defineComponent({
  props: { label: String, value: Number },
  setup: (props) => () =>
    h("div", { class: "rounded-xl border-2 border-border bg-card p-4" }, [
      h("div", { class: "text-sm text-muted-foreground" }, props.label),
      h("div", { class: "font-display text-3xl text-foreground" }, props.value),
    ]),
});
</script>
