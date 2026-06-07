<template>
  <div class="min-h-screen bg-slate-100 text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
    <aside class="bg-slate-950 text-white lg:min-h-screen">
      <div class="border-b border-white/10 p-5">
        <div class="font-display text-xl">Mwaslaty</div>
        <div class="text-sm text-slate-400">Admin Panel</div>
      </div>
      <nav class="grid gap-1 p-3">
        <div class="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Management
        </div>
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" :class="linkClass(link.to)">
          {{ link.label }}
        </RouterLink>
        <button class="mt-3 rounded-lg px-4 py-3 text-start text-slate-300 hover:bg-white/10" @click="logout">
          Logout
        </button>
      </nav>
    </aside>
    <div class="min-w-0">
      <header class="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h1 class="font-display text-2xl">{{ route.meta.title ?? "Admin" }}</h1>
          <p class="text-sm text-slate-500">Admin session active</p>
        </div>
      </header>
      <main class="p-4 md:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { adminLogout } from "@/features/admin/services/adminAuth";

const route = useRoute();
const router = useRouter();
const links = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/routes", label: "Routes" },
  { to: "/admin/stops", label: "Stops" },
  { to: "/admin/stations", label: "Stations" },
  { to: "/admin/tickets", label: "Tickets" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/settings", label: "Settings" },
];

function linkClass(path: string) {
  return [
    "rounded-lg px-4 py-3 text-slate-300 hover:bg-white/10",
    route.path === path ? "bg-yellow-400 text-slate-950 hover:bg-yellow-400" : "",
  ];
}

async function logout() {
  await adminLogout();
  await router.push("/admin/login");
}
</script>
