<template>
  <main class="min-h-dvh bg-background px-5 py-6 text-foreground">
    <div class="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col justify-between">
      <header class="flex items-center justify-between gap-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
        <span>{{ $t("common.appName") }}</span>
        <span v-if="tag" class="rounded-full border border-border bg-card px-3 py-1">{{ tag }}</span>
      </header>

      <section class="flex flex-1 flex-col items-center justify-center text-center" aria-live="assertive">
        <div :class="toneClass" class="mb-8 grid h-24 w-24 place-items-center rounded-full text-5xl font-semibold shadow-sm sm:h-28 sm:w-28 sm:text-6xl">
          {{ icon }}
        </div>
        <h1 class="max-w-2xl text-balance text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
          {{ headline }}
        </h1>
        <p class="mt-5 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:text-2xl">
          {{ support }}
        </p>
        <slot />
      </section>

      <footer class="space-y-4">
        <p v-if="autoAdvanceMs && remainingSeconds > 0" class="text-center text-sm font-semibold text-muted-foreground">
          {{ countdownText }}
        </p>
        <AppButton class="w-full justify-center" size="xl" variant="secondary" @click="$emit('primary')">
          {{ primaryAction.label }}
        </AppButton>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppButton from "@/components/ui/AppButton.vue";

const props = withDefaults(
  defineProps<{
    tone: "success" | "warning" | "reject" | "neutral" | "slate";
    icon: string;
    headline: string;
    support: string;
    primaryAction: { label: string };
    autoAdvanceMs?: number;
    tag?: string;
  }>(),
  { autoAdvanceMs: undefined, tag: undefined }
);

const emit = defineEmits<{
  primary: [];
  autoAdvance: [];
}>();

const { t } = useI18n();
const remainingSeconds = ref(props.autoAdvanceMs ? Math.ceil(props.autoAdvanceMs / 1000) : 0);
let intervalId: number | undefined;
let timeoutId: number | undefined;

const toneClass = computed(() => {
  const tones = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    reject: "bg-danger-soft text-destructive",
    neutral: "bg-muted text-foreground",
    slate: "bg-muted text-muted-foreground"
  };
  return tones[props.tone];
});

const countdownText = computed(() =>
  t("result.valid.countdown", { seconds: remainingSeconds.value })
);

onMounted(() => {
  if (!props.autoAdvanceMs) return;
  intervalId = window.setInterval(() => {
    remainingSeconds.value = Math.max(0, remainingSeconds.value - 1);
  }, 1000);
  timeoutId = window.setTimeout(() => emit("autoAdvance"), props.autoAdvanceMs);
});

onUnmounted(() => {
  if (intervalId) window.clearInterval(intervalId);
  if (timeoutId) window.clearTimeout(timeoutId);
});
</script>
