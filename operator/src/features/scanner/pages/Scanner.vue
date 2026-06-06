<template>
  <main class="app-shell bottom-nav-offset bg-surface-dark text-white">
    <AppNav />
    <section class="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-bold text-primary">{{ $t("scanner.title") }}</p>
          <h1 class="text-2xl font-black">{{ displayProfile(profile) }}</h1>
        </div>
        <RouterLink to="/dashboard" class="tap-target rounded-lg border border-white/20 px-3 py-2 text-sm font-bold focus-ring">
          {{ $t("common.dashboard") }}
        </RouterLink>
      </header>

      <section class="relative min-h-[62dvh] overflow-hidden rounded-lg border border-white/20 bg-black shadow-xl">
        <video ref="videoRef" class="h-full min-h-[62dvh] w-full object-cover" muted playsinline />

        <div v-if="status === 'live'" class="pointer-events-none absolute inset-0 scanner-grid">
          <div class="absolute inset-[12%] rounded-lg border-4 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.24)]">
            <span class="absolute -top-12 start-0 rounded-lg bg-black/70 px-3 py-2 text-sm font-bold">
              {{ $t("scanner.empty") }}
            </span>
          </div>
        </div>

        <div v-if="status !== 'live'" class="absolute inset-0 grid place-items-center bg-surface-dark p-6 text-center">
          <div class="max-w-sm">
            <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-lg bg-white/10 text-3xl" aria-hidden="true">
              {{ status === "starting" ? "..." : "!" }}
            </div>
            <h2 class="text-2xl font-black">{{ statusText }}</h2>
            <p v-if="status === 'denied'" class="mt-3 text-white/75">{{ $t("scanner.denied") }}</p>
            <div v-if="status !== 'starting'" class="mt-5 flex flex-wrap justify-center gap-3">
              <AppButton variant="secondary" @click="start">{{ $t("scanner.tryAgain") }}</AppButton>
              <RouterLink to="/camera-help" class="tap-target inline-flex items-center justify-center rounded-lg border border-white/30 px-4 py-2.5 font-bold focus-ring">
                {{ $t("scanner.help") }}
              </RouterLink>
            </div>
          </div>
        </div>

        <div v-if="processing" class="absolute inset-x-5 bottom-5 rounded-lg bg-card px-4 py-3 text-center text-lg font-black text-card-foreground shadow-lg">
          {{ $t("scanner.processing") }}
        </div>

        <div v-if="flash" :class="flashClass" class="absolute inset-0 grid place-items-center text-4xl font-black">
          {{ flash }}
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import AppButton from "@/components/ui/AppButton.vue";
import AppNav from "@/components/shared/AppNav.vue";
import { useCamera } from "@/features/scanner/composables/useCamera";
import { decodeFromVideo } from "@/features/scanner/services/scanFrame";
import { handleDecodedText } from "@/features/scanner/services/scanOrchestrator";
import { getSelectedProfile } from "@/services/session";
import { displayProfile } from "@/services/format";
import type { Outcome } from "@/services/outcome";

const router = useRouter();
const { t } = useI18n();
const profile = getSelectedProfile();
const { videoRef, status, start } = useCamera();
const processing = ref(false);
const flash = ref("");
const lastText = ref("");
const lastScanAt = ref(0);
let rafId = 0;
let lastFrameAt = 0;

const statusText = computed(() => {
  if (status.value === "starting") return t("scanner.loading");
  if (status.value === "denied") return t("scanner.denied");
  if (status.value === "no-camera") return t("scanner.noCamera");
  if (status.value === "error") return t("scanner.error");
  return t("scanner.empty");
});

const flashClass = computed(() => {
  if (flash.value === t("scanner.flashValid")) return "bg-success/90";
  if (flash.value === t("scanner.flashUsed")) return "bg-warning/90";
  if (flash.value === t("scanner.flashOffline")) return "bg-slate-700/90";
  return "bg-destructive/90";
});

function routeForOutcome(kind: Outcome) {
  const routes: Record<Outcome, string> = {
    valid: "/result/valid",
    already_used: "/result/used",
    invalid: "/result/invalid",
    no_match: "/result/no-match",
    ambiguous: "/result/ambiguous",
    unverified: "/result/unverified"
  };
  return routes[kind];
}

function flashForOutcome(kind: Outcome) {
  const labels: Record<Outcome, string> = {
    valid: t("scanner.flashValid"),
    already_used: t("scanner.flashUsed"),
    invalid: t("scanner.flashInvalid"),
    no_match: t("scanner.flashInvalid"),
    ambiguous: t("result.ambiguous.headline"),
    unverified: t("scanner.flashOffline")
  };
  return labels[kind];
}

async function processText(text: string) {
  if (!profile) {
    await router.push({ name: "profile-select" });
    return;
  }

  const now = Date.now();
  if (text === lastText.value && now - lastScanAt.value < 2000) return;
  lastText.value = text;
  lastScanAt.value = now;
  processing.value = true;

  const outcome = await handleDecodedText(text, profile);
  navigator.vibrate?.(outcome.kind === "valid" ? 40 : [30, 40, 30]);
  flash.value = flashForOutcome(outcome.kind);
  window.setTimeout(() => {
    void router.push(routeForOutcome(outcome.kind));
  }, 260);
}

async function tick(now: number) {
  if (status.value === "live" && videoRef.value && !processing.value && now - lastFrameAt > 160) {
    lastFrameAt = now;
    const decoded = await decodeFromVideo(videoRef.value);
    if (decoded) await processText(decoded);
  }
  rafId = window.requestAnimationFrame(tick);
}

onMounted(() => {
  if (!profile) {
    void router.push({ name: "profile-select" });
    return;
  }
  void start();
  rafId = window.requestAnimationFrame(tick);
});

watch(status, () => {
  processing.value = false;
});

onUnmounted(() => {
  window.cancelAnimationFrame(rafId);
});
</script>
