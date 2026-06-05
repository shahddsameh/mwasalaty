<template>
  <main class="app-shell">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-4">
      <header class="field-panel p-5">
        <p class="text-sm font-bold text-muted-foreground">{{ $t("shift.title") }}</p>
        <h1 class="mt-2 text-3xl font-black">{{ displayProfile(profile) }}</h1>
        <p class="mt-2 text-muted-foreground">
          {{ $t("shift.duration") }}: {{ formatDuration(session?.startedAt, session?.endedAt) }}
        </p>
      </header>

      <p v-if="queuedCount > 0" class="rounded-lg border border-warning bg-warning-soft p-4 font-bold text-warning">
        {{ $t("shift.unsyncedWarning", { count: queuedCount }) }}
      </p>

      <p v-if="!session" class="field-panel p-4 text-center text-muted-foreground">{{ $t("shift.empty") }}</p>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <article v-for="outcome in outcomes" :key="outcome" class="field-panel p-4">
          <p class="text-sm font-bold text-muted-foreground">{{ $t(`dashboard.counts.${outcome}`) }}</p>
          <strong class="mt-2 block text-3xl">{{ session?.tally[outcome] ?? 0 }}</strong>
        </article>
      </div>

      <AppButton size="xl" variant="danger" @click="finishShift">
        {{ $t("shift.end") }}
      </AppButton>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppNav from "@/components/shared/AppNav.vue";
import AppButton from "@/components/ui/AppButton.vue";
import { OUTCOMES } from "@/services/outcome";
import { count } from "@/services/queue";
import { clearSelectedProfile, clearSessionView, endShift, getSelectedProfile, getSession } from "@/services/session";
import { displayProfile, formatDuration } from "@/services/format";

const router = useRouter();
const outcomes = OUTCOMES;
const profile = getSelectedProfile();
const session = getSession();
const queuedCount = ref(0);

async function refreshQueue() {
  queuedCount.value = await count().catch(() => 0);
}

function finishShift() {
  endShift();
  clearSessionView();
  clearSelectedProfile();
  void router.push({ name: "profile-select" });
}

onMounted(refreshQueue);
</script>
