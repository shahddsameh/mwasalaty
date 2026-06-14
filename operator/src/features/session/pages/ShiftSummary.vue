<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav />
    <section class="mx-auto grid w-full max-w-5xl gap-5">
      <OperatorHeader
        :eyebrow="$t('shift.title')"
        :title="displayProfile(profile)"
        :subtitle="$t('shift.success')"
        :status="$t('shift.duration')"
        :meta="formatDuration(session?.startedAt, session?.endedAt)"
        icon="summary"
      />

      <p v-if="queuedCount > 0" class="soft-alert border-warning bg-warning-soft text-warning">
        <AppIcon name="warning" class="h-5 w-5 shrink-0" />{{ $t("shift.unsyncedWarning", { count: queuedCount }) }}
      </p>

      <p v-if="!session" class="soft-alert border-border bg-card text-muted-foreground"><AppIcon name="history" class="h-5 w-5 shrink-0" />{{ $t("shift.empty") }}</p>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <OutcomeCard v-for="outcome in outcomes" :key="outcome" :outcome="outcome" :label="$t(`dashboard.counts.${outcome}`)" :value="session?.tally[outcome] ?? 0" />
      </div>

      <section class="section-card border-destructive/20">
        <h2 class="section-heading">{{ $t("shift.end") }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ $t("shift.offline") }}</p>
        <AppButton class="mt-5 w-full gap-2" size="lg" variant="danger" @click="finishShift"><AppIcon name="logout" class="h-5 w-5" />{{ $t("shift.end") }}</AppButton>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppNav from "@/components/shared/AppNav.vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import OperatorHeader from "@/components/shared/OperatorHeader.vue";
import OutcomeCard from "@/components/shared/OutcomeCard.vue";
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
