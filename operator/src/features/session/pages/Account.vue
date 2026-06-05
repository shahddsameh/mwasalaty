<template>
  <main class="app-shell">
    <AppNav v-if="!isFallback" />
    <section class="mx-auto grid w-full max-w-5xl gap-4">
      <div v-if="isFallback" class="grid min-h-[70dvh] place-items-center">
        <div class="field-panel max-w-md p-6 text-center">
          <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-lg bg-muted text-3xl" aria-hidden="true">!</div>
          <h1 class="text-2xl font-black">{{ $t("account.fallback") }}</h1>
          <AppButton class="mt-5" size="lg" @click="reload">{{ $t("account.reload") }}</AppButton>
        </div>
      </div>

      <template v-else>
        <header class="field-panel p-5">
          <p class="text-sm font-bold text-muted-foreground">{{ $t("account.title") }}</p>
          <h1 class="mt-2 text-3xl font-black">{{ profile?.operatorId ?? $t("common.dash") }}</h1>
          <p class="mt-2 text-muted-foreground">{{ $t("account.installHint") }}</p>
        </header>

        <dl class="field-panel grid gap-4 p-5">
          <div>
            <dt class="text-sm font-bold text-muted-foreground">{{ $t("account.operator") }}</dt>
            <dd class="mt-1 text-xl font-bold">{{ profile?.operatorId ?? $t("common.dash") }}</dd>
          </div>
          <div>
            <dt class="text-sm font-bold text-muted-foreground">{{ $t("account.selectedScanner") }}</dt>
            <dd class="mt-1 text-xl font-bold">{{ displayProfile(profile) }}</dd>
          </div>
          <div>
            <dt class="text-sm font-bold text-muted-foreground">{{ $t("common.queue") }}</dt>
            <dd class="mt-1 text-xl font-bold">{{ queuedCount }}</dd>
          </div>
          <div>
            <dt class="text-sm font-bold text-muted-foreground">{{ $t("account.appVersion") }}</dt>
            <dd class="mt-1 text-xl font-bold">0.0.1</dd>
          </div>
        </dl>

        <p v-if="!isOnline" class="rounded-lg border border-slate-300 bg-slate-100 p-4 font-semibold text-slate-700">
          {{ $t("account.offline") }}
        </p>

        <AppButton size="lg" variant="danger" @click="signOut">{{ $t("account.signOut") }}</AppButton>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import AppNav from "@/components/shared/AppNav.vue";
import AppButton from "@/components/ui/AppButton.vue";
import { useOnline } from "@/composables/useOnline";
import { count } from "@/services/queue";
import { clearSelectedProfile, clearSessionView, getSelectedProfile } from "@/services/session";
import { displayProfile } from "@/services/format";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { isOnline } = useOnline();
const profile = getSelectedProfile();
const queuedCount = ref(0);
const isFallback = computed(() => route.query.fallback === "error");

function reload() {
  window.location.reload();
}

function signOut() {
  if (queuedCount.value > 0 && !window.confirm(t("account.signOutWarning"))) return;
  clearSessionView();
  clearSelectedProfile();
  void router.push({ name: "profile-select" });
}

onMounted(async () => {
  queuedCount.value = await count().catch(() => 0);
});
</script>
