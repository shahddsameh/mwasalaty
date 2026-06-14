<template>
  <main class="app-shell bottom-nav-offset">
    <AppNav v-if="!isFallback" />
    <section class="mx-auto grid w-full max-w-5xl gap-5">
      <div v-if="isFallback" class="grid min-h-[70dvh] place-items-center">
        <div class="field-panel max-w-md p-7 text-center">
          <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-danger-soft text-destructive" aria-hidden="true"><AppIcon name="warning" class="h-8 w-8" /></div>
          <h1 class="text-2xl font-semibold">{{ $t("account.fallback") }}</h1>
          <AppButton class="mt-5" size="lg" @click="reload">{{ $t("account.reload") }}</AppButton>
        </div>
      </div>

      <template v-else>
        <OperatorHeader
          :eyebrow="$t('account.title')"
          :title="profile?.operatorId ?? $t('common.dash')"
          :subtitle="$t('account.installHint')"
          :status="isOnline ? $t('common.synced') : $t('common.pending')"
          icon="account"
        />

        <dl class="grid gap-4 md:grid-cols-2">
          <div class="section-card">
            <dt class="text-sm font-medium text-muted-foreground">{{ $t("account.operator") }}</dt>
            <dd class="mt-1 text-xl font-semibold">{{ profile?.operatorId ?? $t("common.dash") }}</dd>
          </div>
          <div class="section-card">
            <dt class="text-sm font-medium text-muted-foreground">{{ $t("account.selectedScanner") }}</dt>
            <dd class="mt-1 text-xl font-semibold">{{ displayProfile(profile) }}</dd>
          </div>
          <div class="section-card">
            <dt class="flex items-center gap-2 text-sm font-medium text-muted-foreground"><AppIcon name="language" class="h-5 w-5 text-primary-hover" />{{ $t("account.language") }}</dt>
            <dd class="mt-3 grid grid-cols-2 rounded-xl border border-border bg-muted p-1">
              <button
                type="button"
                class="tap-target rounded-lg px-3 py-2 text-base font-medium transition-colors focus-ring"
                :class="locale === 'ar' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'"
                :aria-pressed="locale === 'ar'"
                @click="selectLocale('ar')"
              >
                {{ $t("account.arabic") }}
              </button>
              <button
                type="button"
                class="tap-target rounded-lg px-3 py-2 text-base font-medium transition-colors focus-ring"
                :class="locale === 'en' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'"
                :aria-pressed="locale === 'en'"
                @click="selectLocale('en')"
              >
                {{ $t("account.english") }}
              </button>
            </dd>
          </div>
          <div class="section-card">
            <dt class="flex items-center gap-2 text-sm font-medium text-muted-foreground"><AppIcon name="theme" class="h-5 w-5 text-primary-hover" />{{ $t("account.theme") }}</dt>
            <dd class="mt-3 grid grid-cols-2 rounded-xl border border-border bg-muted p-1">
              <button
                type="button"
                class="tap-target rounded-lg px-3 py-2 text-base font-medium transition-colors focus-ring"
                :class="theme === 'light' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'"
                :aria-pressed="theme === 'light'"
                @click="selectTheme('light')"
              >
                {{ $t("account.light") }}
              </button>
              <button
                type="button"
                class="tap-target rounded-lg px-3 py-2 text-base font-medium transition-colors focus-ring"
                :class="theme === 'dark' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'"
                :aria-pressed="theme === 'dark'"
                @click="selectTheme('dark')"
              >
                {{ $t("account.dark") }}
              </button>
            </dd>
          </div>
          <div class="section-card">
            <dt class="text-sm font-medium text-muted-foreground">{{ $t("common.queue") }}</dt>
            <dd class="mt-1 text-3xl font-semibold">{{ queuedCount }}</dd>
          </div>
          <div class="section-card">
            <dt class="text-sm font-medium text-muted-foreground">{{ $t("account.appVersion") }}</dt>
            <dd class="mt-1 font-mono text-xl font-medium">0.0.1</dd>
          </div>
        </dl>

        <p v-if="!isOnline" class="soft-alert border-border bg-muted text-muted-foreground">
          <AppIcon name="offline" class="h-5 w-5 shrink-0" />{{ $t("account.offline") }}
        </p>

        <section class="section-card grid gap-3 sm:grid-cols-2">
          <AppButton class="w-full gap-2" size="lg" variant="outline" @click="changeScanner"><AppIcon name="route" class="h-5 w-5" />{{ $t("account.changeScanner") }}</AppButton>
          <AppButton class="w-full gap-2" size="lg" variant="danger" @click="signOut"><AppIcon name="logout" class="h-5 w-5" />{{ $t("account.signOut") }}</AppButton>
        </section>
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
import AppIcon from "@/components/ui/AppIcon.vue";
import OperatorHeader from "@/components/shared/OperatorHeader.vue";
import { useOnline } from "@/composables/useOnline";
import { count } from "@/services/queue";
import { clearSelectedProfile, clearSessionView, getSelectedProfile } from "@/services/session";
import { displayProfile } from "@/services/format";
import { getCurrentLocale, setLocale, type Locale } from "@/i18n";
import { getCurrentTheme, setTheme, type Theme } from "@/services/theme";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { isOnline } = useOnline();
const profile = getSelectedProfile();
const queuedCount = ref(0);
const locale = ref<Locale>(getCurrentLocale());
const theme = ref<Theme>(getCurrentTheme());
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

function changeScanner() {
  void router.push({ name: "profile-select", query: { change: "1" } });
}

function selectLocale(nextLocale: Locale) {
  locale.value = nextLocale;
  setLocale(nextLocale);
}

function selectTheme(nextTheme: Theme) {
  theme.value = nextTheme;
  setTheme(nextTheme);
}

onMounted(async () => {
  queuedCount.value = await count().catch(() => 0);
});
</script>
