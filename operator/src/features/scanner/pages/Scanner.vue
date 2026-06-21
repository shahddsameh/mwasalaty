<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav />
    <section class="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <OperatorHeader
        :eyebrow="$t('scanner.title')"
        :title="displayProfile(profile)"
        :subtitle="$t('scanner.empty')"
        :status="status === 'live' ? $t('common.scan') : statusText"
        icon="scan"
      />

      <section
        class="relative min-h-[52dvh] overflow-hidden rounded-2xl border border-border bg-surface-dark shadow-sm md:min-h-[60dvh]"
      >
        <video
          ref="videoRef"
          class="h-full min-h-[52dvh] w-full object-cover md:min-h-[60dvh]"
          muted
          playsinline
        />

        <div
          v-if="status === 'live'"
          class="pointer-events-none absolute inset-0 scanner-grid"
        >
          <div
            class="absolute inset-[10%] rounded-2xl border-2 border-primary shadow-[0_0_0_999px_rgba(2,6,23,0.48)] sm:inset-[14%]"
          >
            <span
              class="absolute -top-14 start-0 rounded-xl bg-surface-dark/90 px-3 py-2 text-sm font-medium text-surface-dark-foreground shadow-sm backdrop-blur"
            >
              {{ $t("scanner.empty") }}
            </span>
            <span
              class="absolute -left-1 -top-1 h-8 w-8 rounded-tl-3xl border-l-4 border-t-4 border-primary"
            />
            <span
              class="absolute -right-1 -top-1 h-8 w-8 rounded-tr-3xl border-r-4 border-t-4 border-primary"
            />
            <span
              class="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-3xl border-b-4 border-l-4 border-primary"
            />
            <span
              class="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-3xl border-b-4 border-r-4 border-primary"
            />
          </div>
        </div>

        <div
          v-if="status !== 'live'"
          class="absolute inset-0 grid place-items-center bg-surface-dark p-6 text-center text-surface-dark-foreground"
        >
          <div class="max-w-md">
            <div
              class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-surface-dark-border bg-surface-dark-foreground/10 text-primary shadow-sm"
              aria-hidden="true"
            >
              <div
                v-if="status === 'starting'"
                class="h-9 w-9 animate-spin rounded-full border-4 border-surface-dark-foreground/20 border-t-primary"
              />
              <AppIcon v-else name="camera" class="h-9 w-9" />
            </div>
            <p
              class="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-primary"
            >
              {{ $t("common.appName") }}
            </p>
            <h2 class="text-xl font-semibold sm:text-2xl">{{ statusText }}</h2>
            <p
              v-if="status !== 'starting'"
              class="mx-auto mt-3 max-w-sm text-sm leading-6 text-surface-dark-foreground/70"
            >
              {{
                status === "denied" ? $t("scanner.denied") : $t("scanner.empty")
              }}
            </p>
            <div
              v-if="status !== 'starting'"
              class="mt-5 flex flex-wrap justify-center gap-3"
            >
              <AppButton @click="start"
                ><AppIcon name="camera" class="me-2 h-5 w-5" />{{
                  $t("scanner.tryAgain")
                }}</AppButton
              >
              <RouterLink
                to="/camera-help"
                class="tap-target inline-flex items-center justify-center rounded-xl border border-surface-dark-border bg-surface-dark-foreground/10 px-4 py-2.5 font-medium text-surface-dark-foreground transition hover:bg-surface-dark-foreground/15 focus-ring"
              >
                {{ $t("scanner.help") }}
              </RouterLink>
              <RouterLink
                to="/dashboard"
                class="tap-target inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-medium text-surface-dark-foreground/70 transition hover:text-surface-dark-foreground focus-ring"
                >{{ $t("common.dashboard") }}</RouterLink
              >
            </div>
          </div>
        </div>

        <div
          v-if="processing"
          class="absolute inset-x-5 bottom-5 rounded-2xl border border-surface-dark-border bg-surface-dark/90 px-4 py-4 text-center text-lg font-semibold text-surface-dark-foreground shadow-sm backdrop-blur"
        >
          {{ $t("scanner.processing") }}
        </div>

        <div
          v-if="flash"
          :class="flashClass"
          class="absolute inset-0 grid place-items-center text-4xl font-semibold"
        >
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
import OperatorHeader from "@/components/shared/OperatorHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
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
  if (flash.value === t("scanner.flashUsed")) return "bg-warning/90 text-white";
  if (flash.value === t("scanner.flashOffline"))
    return "bg-surface-dark-muted/90 text-surface-dark-foreground";
  return "bg-destructive/90";
});

function routeForOutcome(kind: Outcome) {
  const routes: Record<Outcome, string> = {
    valid: "/result/valid",
    already_used: "/result/used",
    invalid: "/result/invalid",
    no_match: "/result/no-match",
    ambiguous: "/result/ambiguous",
    unverified: "/result/unverified",
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
    unverified: t("scanner.flashOffline"),
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
  if (
    status.value === "live" &&
    videoRef.value &&
    !processing.value &&
    now - lastFrameAt > 160
  ) {
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
