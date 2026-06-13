<template>
  <AuthForm :title="t('auth.login.title')" :subtitle="t('auth.login.subtitle')">
    <form class="space-y-4" @submit.prevent="handleLogin">
      <p
        v-if="errorMessage"
        class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ errorMessage }}
      </p>

      <AppButton
        variant="outline"
        class="w-full mb-6 flex items-center justify-center gap-2"
        type="button"
        :disabled="loading"
        @click="handleGoogleLogin"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          class="w-5 h-5"
        />
        {{ t("auth.common.continueWithGoogle") }}
      </AppButton>

      <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-border"></div>
        <span class="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {{ t("auth.common.or") }}
        </span>
        <div class="h-px flex-1 bg-border"></div>
      </div>

      <AppInput
        v-model="email"
        :label="t('auth.common.emailAddress')"
        type="email"
        autocomplete="email"
        :placeholder="t('auth.common.emailPlaceholder')"
        :error="fieldErrors.email"
      >
        <template #icon><Mail class="w-5 h-5" /></template>
      </AppInput>

      <div class="relative">
        <AppInput
          v-model="password"
          :label="t('auth.common.password')"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          :placeholder="t('auth.login.passwordPlaceholder')"
          :error="fieldErrors.password"
        >
          <template #icon><Lock class="w-5 h-5" /></template>
        </AppInput>
        <button
          class="absolute right-3 top-10 text-muted-foreground hover:text-foreground"
          type="button"
          @click="showPassword = !showPassword"
        >
          <EyeOff v-if="showPassword" class="w-5 h-5" />
          <Eye v-else class="w-5 h-5" />
        </button>
      </div>

      <div class="flex items-center justify-between mb-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="rememberMe"
            type="checkbox"
            class="w-4 h-4 rounded border-border"
          />
          <span class="text-sm text-muted-foreground">{{
            t("auth.login.rememberMe")
          }}</span>
        </label>
        <button
          class="text-sm text-primary"
          type="button"
          @click="router.push('/forgot-password')"
        >
          {{ t("auth.login.forgotPassword") }}
        </button>
      </div>

      <AppButton size="lg" class="w-full" type="submit" :disabled="loading">
        {{ loading ? t("auth.login.signingIn") : t("auth.login.signIn") }}
      </AppButton>
      <AppButton
        variant="outline"
        class="w-full"
        type="button"
        @click="router.push('/')"
      >
        {{ t("auth.login.continueAsGuest") }}
      </AppButton>

      <p class="text-center text-sm text-muted-foreground">
        {{ t("auth.login.noAccount") }}
        <button
          class="text-primary"
          type="button"
          @click="router.push({ path: '/signup', query: redirectQuery })"
        >
          {{ t("auth.login.createAccount") }}
        </button>
      </p>
    </form>
  </AuthForm>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Eye, EyeOff, Lock, Mail } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AuthForm from "@/components/shared/AuthForm.vue";
import { login, signInWithGoogle } from "@/services/supabaseAuth";
import { setAuthSession } from "@/services/authState";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const showPassword = ref(false);
const email = ref("");
const password = ref("");
const rememberMe = ref(true);
const loading = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<{ email?: string; password?: string }>({});

function resolveRedirect() {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect ? redirect : "/profile";
}

const redirectQuery = computed(() => ({ redirect: resolveRedirect() }));

function googleCallbackPath() {
  return `/auth/callback?redirect=${encodeURIComponent(resolveRedirect())}`;
}

async function handleLogin() {
  errorMessage.value = "";
  fieldErrors.value = {};

  if (!email.value.trim()) {
    fieldErrors.value.email = t("auth.errors.emailRequired");
  }

  if (!password.value) {
    fieldErrors.value.password = t("auth.errors.passwordRequired");
  }

  if (Object.keys(fieldErrors.value).length) return;

  loading.value = true;
  try {
    const result = await login(email.value.trim(), password.value);
    if (result.error) {
      errorMessage.value = result.error;
      return;
    }

    if (result.session) {
      setAuthSession(result.session);
    }

    await router.push(resolveRedirect());
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t("auth.errors.signInFailed");
  } finally {
    loading.value = false;
  }
}

async function handleGoogleLogin() {
  errorMessage.value = "";
  const result = await signInWithGoogle(googleCallbackPath());
  if (result.error) {
    errorMessage.value = result.error;
  }
}
</script>
