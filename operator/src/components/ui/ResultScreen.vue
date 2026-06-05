<template>
  <main :class="toneClass" class="min-h-dvh px-5 py-6 text-white">
    <div class="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col justify-between">
      <header class="flex items-center justify-between gap-4 text-sm font-semibold uppercase tracking-normal opacity-90">
        <span>{{ $t("common.appName") }}</span>
        <span v-if="tag" class="rounded-full border border-white/35 px-3 py-1">{{ tag }}</span>
      </header>

      <section class="flex flex-1 flex-col items-center justify-center text-center" aria-live="assertive">
        <div class="mb-8 grid h-28 w-28 place-items-center rounded-full border-4 border-white/40 bg-white/15 text-6xl font-black shadow-xl">
          {{ icon }}
        </div>
        <h1 class="max-w-2xl text-balance text-4xl font-black leading-tight sm:text-6xl">
          {{ headline }}
        </h1>
        <p class="mt-5 max-w-xl text-pretty text-lg leading-8 text-white/90 sm:text-2xl">
          {{ support }}
        </p>
        <slot />
      </section>

      <footer class="space-y-4">
        <p v-if="autoAdvanceMs && remainingSeconds > 0" class="text-center text-sm font-semibold text-white/80">
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
    success: "bg-success",
    warning: "bg-warning",
    reject: "bg-destructive",
    neutral: "bg-surface-dark",
    slate: "bg-slate-700"
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
