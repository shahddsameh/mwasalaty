<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-5">
      <OperatorHeader
        :eyebrow="$t('dashboard.title')"
        :title="displayProfile(profile)"
        :subtitle="
          $t('dashboard.selectedRoute', {
            mode: displayMode(profile?.mode),
            route: profile?.routeShortName || $t('profile.genericRoute'),
          })
        "
        :status="$t('common.synced')"
        :meta="
          session
            ? $t('dashboard.startedAt', {
                time: formatDateTime(session.startedAt),
              })
            : $t('dashboard.empty')
        "
        icon="dashboard"
      />

      <RouterLink
        to="/scan"
        class="group tap-target flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-soft via-warning-soft to-primary text-primary-hover p-5 shadow-sm transition-colors hover:border-primary-hover focus-ring md:min-h-28 md:p-6"
      >
        <span class="flex items-center gap-4 text-start"
          ><span
            class="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft"
            ><AppIcon name="scan" class="h-6 w-6" /></span
          ><span
            ><small class="block text-xs font-medium uppercase opacity-70">{{
              $t("common.appName")
            }}</small
            ><strong class="mt-1 block text-lg font-semibold md:text-2xl">{{
              $t("dashboard.scanCta")
            }}</strong></span
          ></span
        >
        <AppIcon
          name="chevron"
          class="h-6 w-6 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        />
      </RouterLink>

      <p
        v-if="totalScans === 0"
        class="soft-alert border-border bg-card text-muted-foreground"
      >
        <AppIcon name="history" class="h-5 w-5 shrink-0 text-primary" />
        {{ $t("dashboard.empty") }}
      </p>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <OutcomeCard
          v-for="outcome in outcomes"
          :key="outcome"
          :outcome="outcome"
          :label="$t(`dashboard.counts.${outcome}`)"
          :value="session?.tally[outcome] ?? 0"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <RouterLink
          to="/sync"
          class="field-panel group tap-target flex items-center gap-4 p-3 transition-colors hover:border-primary focus-ring"
        >
          <span
            class="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary-hover"
            ><AppIcon name="queueWaiting" class="h-5 w-5" /></span
          ><span
            ><span class="text-sm font-medium text-muted-foreground">{{
              $t("common.queue")
            }}</span
            ><strong class="mt-1 block text-xl font-semibold">{{
              queuedCount
            }}</strong></span
          >
        </RouterLink>
        <RouterLink
          to="/history"
          class="field-panel group tap-target flex items-center gap-4 p-3 transition-colors hover:border-primary focus-ring"
        >
          <span
            class="grid h-11 w-11 place-items-center rounded-xl bg-muted text-foreground"
            ><AppIcon name="recentActivity" class="h-5 w-5" /></span
          ><span
            ><span class="text-sm font-medium text-muted-foreground">{{
              $t("common.history")
            }}</span
            ><strong class="mt-1 block text-xl font-semibold">{{
              totalScans
            }}</strong></span
          >
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppNav from "@/components/shared/AppNav.vue";
import OperatorHeader from "@/components/shared/OperatorHeader.vue";
import OutcomeCard from "@/components/shared/OutcomeCard.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { OUTCOMES } from "@/services/outcome";
import { count } from "@/services/queue";
import { getSelectedProfile, getSession, startShift } from "@/services/session";
import { displayMode, displayProfile, formatDateTime } from "@/services/format";

const outcomes = OUTCOMES;
const profile = getSelectedProfile();
const session = computed(() => getSession() ?? startShift());
const queuedCount = ref(0);
const totalScans = computed(() =>
  outcomes.reduce(
    (total, outcome) => total + (session.value?.tally[outcome] ?? 0),
    0,
  ),
);

onMounted(async () => {
  queuedCount.value = await count().catch(() => 0);
});
</script>
