<template>
  <main class="app-shell bg-surface-dark text-white">
    <section class="mx-auto grid w-full max-w-4xl gap-4">
      <header class="rounded-lg border border-white/15 bg-white/10 p-5">
        <p class="text-sm font-bold text-primary">{{ $t("result.ambiguous.headline") }}</p>
        <h1 class="mt-2 text-3xl font-black">{{ $t("result.ambiguous.support") }}</h1>
      </header>

      <StateView :state="state" :title="stateTitle" :support="stateSupport">
        <template #action>
          <AppButton class="mt-5" variant="secondary" @click="goNext">{{ $t("common.nextScan") }}</AppButton>
        </template>

        <div class="grid gap-3">
          <button
            v-for="leg in candidates"
            :key="leg.ticketLegId"
            class="tap-target rounded-lg border border-white/20 bg-card p-4 text-start text-card-foreground shadow-lg transition hover:border-primary hover:bg-primary-soft focus-ring"
            :disabled="validating === leg.ticketLegId"
            @click="chooseLeg(leg.ticketLegId)"
          >
            <span class="text-xs font-bold uppercase text-muted-foreground">{{ leg.ticketLegId }}</span>
            <strong class="mt-2 block text-2xl">{{ displayLeg(leg) }}</strong>
            <span class="mt-4 block text-sm font-bold text-primary-hover">
              {{ validating === leg.ticketLegId ? $t("scanner.processing") : $t("result.ambiguous.validate") }}
            </span>
          </button>
        </div>
      </StateView>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import AppButton from "@/components/ui/AppButton.vue";
import StateView from "@/components/shared/StateView.vue";
import { getLatestOutcome, setLatestOutcome } from "@/features/results/resultStore";
import { selectCandidateLegs } from "@/features/results/candidateLegs";
import { ApiError, getTicket, validateLeg, type TicketLeg } from "@/services/api";
import { getSelectedProfile } from "@/services/session";
import { displayLeg } from "@/services/format";
import { mapErrorToOutcome, mapResultToOutcome } from "@/services/outcome";

const router = useRouter();
const { t } = useI18n();
const outcome = getLatestOutcome();
const profile = getSelectedProfile();
const state = ref<"loading" | "empty" | "error" | "ready">("loading");
const candidates = ref<TicketLeg[]>([]);
const validating = ref("");

const stateTitle = computed(() => {
  if (state.value === "loading") return t("result.ambiguous.loading");
  if (state.value === "empty") return t("result.ambiguous.empty");
  if (state.value === "error") return t("result.ambiguous.error");
  return undefined;
});
const stateSupport = computed(() => (state.value === "ready" ? undefined : t("result.ambiguous.support")));

async function loadTicket() {
  if (!outcome?.ticketId || !profile) {
    state.value = "empty";
    return;
  }

  state.value = "loading";
  try {
    const ticket = await getTicket(outcome.ticketId);
    const matchingLegIds = Array.isArray(outcome.detail.matchingLegIds)
      ? outcome.detail.matchingLegIds.filter((id): id is string => typeof id === "string")
      : undefined;
    candidates.value = selectCandidateLegs(ticket, profile, matchingLegIds);
    state.value = candidates.value.length ? "ready" : "empty";
  } catch {
    state.value = "error";
  }
}

async function chooseLeg(legId: string) {
  if (!outcome?.ticketId || !profile) return;
  validating.value = legId;
  try {
    const result = await validateLeg(outcome.ticketId, legId, {
      operatorId: profile.operatorId,
      deviceId: profile.deviceId
    });
    setLatestOutcome(mapResultToOutcome(result));
    await router.push({ name: "result-valid" });
  } catch (error) {
    if (error instanceof ApiError) {
      const next = mapErrorToOutcome(error);
      setLatestOutcome(next);
      await router.push(next.kind === "already_used" ? { name: "result-used" } : { name: "result-invalid" });
    }
  } finally {
    validating.value = "";
  }
}

function goNext() {
  void router.push({ name: "scan" });
}

onMounted(loadTicket);
</script>
