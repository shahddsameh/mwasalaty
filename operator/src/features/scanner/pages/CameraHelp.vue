<template>
  <main class="app-shell">
    <AppNav />
    <section class="mx-auto grid w-full max-w-3xl gap-4">
      <header class="field-panel p-5">
        <p class="text-sm font-bold text-muted-foreground">{{ $t("cameraHelp.title") }}</p>
        <h1 class="mt-2 text-3xl font-black">{{ $t("cameraHelp.default") }}</h1>
      </header>

      <ol class="grid gap-3">
        <li class="field-panel p-4 font-bold">{{ $t("cameraHelp.step1") }}</li>
        <li class="field-panel p-4 font-bold">{{ $t("cameraHelp.step2") }}</li>
        <li class="field-panel p-4 font-bold">{{ $t("cameraHelp.step3") }}</li>
      </ol>

      <p v-if="!isOnline" class="rounded-lg border border-slate-300 bg-slate-100 p-4 font-semibold text-slate-700">
        {{ $t("cameraHelp.offline") }}
      </p>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppButton size="lg" @click="tryCamera">{{ $t("cameraHelp.enable") }}</AppButton>
        <RouterLink to="/scan" class="tap-target inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-3 font-bold focus-ring">
          {{ $t("common.back") }}
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AppNav from "@/components/shared/AppNav.vue";
import AppButton from "@/components/ui/AppButton.vue";
import { useOnline } from "@/composables/useOnline";

const router = useRouter();
const { isOnline } = useOnline();

async function tryCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((track) => track.stop());
    await router.push({ name: "scan" });
  } catch {
    await router.push({ name: "scan" });
  }
}
</script>
