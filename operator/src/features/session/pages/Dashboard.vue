<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-4">
      <header class="rounded-lg bg-surface-dark p-5 text-white shadow-lg">
        <p class="text-sm font-bold text-primary">{{ $t("dashboard.title") }}</p>
        <h1 class="mt-2 text-3xl font-black">{{ displayProfile(profile) }}</h1>
        <p class="mt-2 text-white/75">
          {{ session ? $t("dashboard.startedAt", { time: formatDateTime(session.startedAt) }) : $t("dashboard.empty") }}
        </p>
      </header>

      <RouterLink to="/scan" class="tap-target flex min-h-28 items-center justify-center rounded-lg bg-success p-5 text-center text-3xl font-black text-white shadow-lg focus-ring">
        {{ $t("dashboard.scanCta") }}
      </RouterLink>

      <p v-if="totalScans === 0" class="rounded-lg border border-border bg-card p-4 text-center font-semibold text-muted-foreground">
        {{ $t("dashboard.empty") }}
      </p>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <article v-for="outcome in outcomes" :key="outcome" class="field-panel p-4">
          <p class="text-sm font-bold text-muted-foreground">{{ $t(`dashboard.counts.${outcome}`) }}</p>
          <strong class="mt-2 block text-3xl">{{ session?.tally[outcome] ?? 0 }}</strong>
        </article>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <RouterLink to="/sync" class="field-panel tap-target p-4 focus-ring">
          <span class="text-sm font-bold text-muted-foreground">{{ $t("common.queue") }}</span>
          <strong class="mt-1 block text-2xl">{{ queuedCount }}</strong>
        </RouterLink>
        <RouterLink to="/history" class="field-panel tap-target p-4 focus-ring">
          <span class="text-sm font-bold text-muted-foreground">{{ $t("common.history") }}</span>
          <strong class="mt-1 block text-2xl">{{ totalScans }}</strong>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppNav from "@/components/shared/AppNav.vue";
import { OUTCOMES } from "@/services/outcome";
import { count } from "@/services/queue";
import { getSelectedProfile, getSession, startShift } from "@/services/session";
import { displayProfile, formatDateTime } from "@/services/format";

const outcomes = OUTCOMES;
const profile = getSelectedProfile();
const session = computed(() => getSession() ?? startShift());
const queuedCount = ref(0);
const totalScans = computed(() =>
  outcomes.reduce((total, outcome) => total + (session.value?.tally[outcome] ?? 0), 0)
);

onMounted(async () => {
  queuedCount.value = await count().catch(() => 0);
});
</script>
