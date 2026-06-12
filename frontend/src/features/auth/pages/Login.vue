<template>
  <AuthForm title="Welcome Back" subtitle="Sign in to your Mwasalaty account">
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
        Continue with Google
      </AppButton>

      <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-border"></div>
        <span class="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          or
        </span>
        <div class="h-px flex-1 bg-border"></div>
      </div>

      <AppInput
        v-model="email"
        label="Email Address"
        type="email"
        autocomplete="email"
        placeholder="your@email.com"
        :error="fieldErrors.email"
      >
        <template #icon><Mail class="w-5 h-5" /></template>
      </AppInput>

      <div class="relative">
        <AppInput
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="Enter your password"
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
          <span class="text-sm text-muted-foreground">Remember me</span>
        </label>
        <button
          class="text-sm text-primary"
          type="button"
          @click="router.push('/forgot-password')"
        >
          Forgot password?
        </button>
      </div>

      <AppButton size="lg" class="w-full" type="submit" :disabled="loading">
        {{ loading ? "Signing In..." : "Sign In" }}
      </AppButton>
      <AppButton
        variant="outline"
        class="w-full"
        type="button"
        @click="router.push('/')"
      >
        Continue as Guest
      </AppButton>

      <p class="text-center text-sm text-muted-foreground">
        Don't have an account?
        <button
          class="text-primary"
          type="button"
          @click="router.push({ path: '/signup', query: redirectQuery })"
        >
          Create Account
        </button>
      </p>
    </form>
  </AuthForm>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Eye, EyeOff, Lock, Mail } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AuthForm from "@/components/shared/AuthForm.vue";
import { login, signInWithGoogle } from "@/services/supabaseAuth";
import { setAuthSession } from "@/services/authState";

const router = useRouter();
const route = useRoute();
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
    fieldErrors.value.email = "Email is required.";
  }

  if (!password.value) {
    fieldErrors.value.password = "Password is required.";
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
      error instanceof Error ? error.message : "Could not sign in right now.";
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
