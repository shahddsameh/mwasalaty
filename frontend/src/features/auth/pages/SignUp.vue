<template>
  <AuthForm
    :title="t('auth.signup.title')"
    :subtitle="t('auth.signup.subtitle')"
  >
    <form class="space-y-4" @submit.prevent="handleSignUp">
      <p
        v-if="errorMessage"
        class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ errorMessage }}
      </p>

      <p
        v-if="successMessage"
        class="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
      >
        {{ successMessage }}
      </p>

      <AppButton
        variant="outline"
        class="w-full mb-6 flex items-center justify-center gap-2"
        type="button"
        :disabled="loading"
        @click="handleGoogleSignUp"
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
        v-model="fullName"
        :label="t('auth.signup.fullName')"
        :placeholder="t('auth.signup.fullNamePlaceholder')"
        autocomplete="name"
        :error="fieldErrors.fullName"
      >
        <template #icon><User class="w-5 h-5" /></template>
      </AppInput>

      <AppInput
        v-model="email"
        :label="t('auth.common.emailAddress')"
        type="email"
        :placeholder="t('auth.common.emailPlaceholder')"
        autocomplete="email"
        :error="fieldErrors.email"
      >
        <template #icon><Mail class="w-5 h-5" /></template>
      </AppInput>

      <AppInput
        v-model="phone"
        :label="t('auth.signup.phoneNumber')"
        type="tel"
        :placeholder="t('auth.signup.phonePlaceholder')"
        autocomplete="tel"
      >
        <template #icon><Phone class="w-5 h-5" /></template>
      </AppInput>

      <PasswordField
        v-model:show="showPassword"
        v-model="password"
        :label="t('auth.common.password')"
        :placeholder="t('auth.signup.passwordPlaceholder')"
        :error="fieldErrors.password"
      />

      <PasswordField
        v-model:show="showConfirmPassword"
        v-model="confirmPassword"
        :label="t('auth.signup.confirmPassword')"
        :placeholder="t('auth.signup.confirmPasswordPlaceholder')"
        :error="fieldErrors.confirmPassword"
      />

      <label class="flex items-start gap-3 mb-2 cursor-pointer">
        <input
          v-model="agreedToTerms"
          type="checkbox"
          class="w-4 h-4 mt-1 rounded border-border"
        />
        <span class="text-sm text-muted-foreground">
          {{ t("auth.signup.agreePrefix") }}
          <button class="text-primary" type="button">
            {{ t("auth.signup.termsOfService") }}
          </button>
          {{ t("auth.signup.and") }}
          <button class="text-primary" type="button">
            {{ t("auth.signup.privacyPolicy") }}
          </button>
        </span>
      </label>

      <AppButton
        size="lg"
        class="w-full mb-6"
        type="submit"
        :disabled="loading"
      >
        {{
          loading
            ? t("auth.signup.creatingAccount")
            : t("auth.signup.createAccount")
        }}
      </AppButton>
      <p class="text-center text-sm text-muted-foreground">
        {{ t("auth.signup.haveAccount") }}
        <button
          class="text-primary"
          type="button"
          @click="router.push({ path: '/login', query: redirectQuery })"
        >
          {{ t("auth.signup.signIn") }}
        </button>
      </p>
    </form>
  </AuthForm>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AuthForm from "@/components/shared/AuthForm.vue";
import { signInWithGoogle, signUp } from "@/services/supabaseAuth";
import { setAuthSession } from "@/services/authState";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const fullName = ref("");
const email = ref("");
const phone = ref("");
const password = ref("");
const confirmPassword = ref("");
const agreedToTerms = ref(true);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const fieldErrors = ref<{
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}>({});

function resolveRedirect() {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect ? redirect : "/profile";
}

const redirectQuery = computed(() => ({ redirect: resolveRedirect() }));

function googleCallbackPath() {
  return `/auth/callback?redirect=${encodeURIComponent(resolveRedirect())}`;
}

const PasswordField = defineComponent({
  props: {
    show: Boolean,
    label: String,
    placeholder: String,
    modelValue: String,
    error: String,
  },
  emits: ["update:show", "update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("div", { class: "relative" }, [
        h(
          AppInput,
          {
            label: props.label,
            type: props.show ? "text" : "password",
            placeholder: props.placeholder,
            modelValue: props.modelValue,
            error: props.error,
            "onUpdate:modelValue": (value: string) =>
              emit("update:modelValue", value),
          },
          { icon: () => h(Lock, { class: "w-5 h-5" }) },
        ),
        h(
          "button",
          {
            class:
              "absolute right-3 top-10 text-muted-foreground hover:text-foreground",
            type: "button",
            onClick: () => emit("update:show", !props.show),
          },
          [h(props.show ? EyeOff : Eye, { class: "w-5 h-5" })],
        ),
      ]);
  },
});

async function handleSignUp() {
  errorMessage.value = "";
  successMessage.value = "";
  fieldErrors.value = {};

  if (!fullName.value.trim()) {
    fieldErrors.value.fullName = t("auth.errors.fullNameRequired");
  }

  if (!email.value.trim()) {
    fieldErrors.value.email = t("auth.errors.emailRequired");
  }

  if (!password.value) {
    fieldErrors.value.password = t("auth.errors.passwordRequired");
  }

  if (password.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = t("auth.errors.passwordMismatch");
  }

  if (!agreedToTerms.value) {
    errorMessage.value = t("auth.errors.agreeRequired");
  }

  if (Object.keys(fieldErrors.value).length || errorMessage.value) return;

  loading.value = true;
  try {
    const result = await signUp(email.value.trim(), password.value, {
      full_name: fullName.value.trim(),
      phone: phone.value.trim(),
    });

    if (result.error) {
      errorMessage.value = result.error;
      return;
    }

    if (result.session) {
      setAuthSession(result.session);
      await router.push(resolveRedirect());
      return;
    }

    successMessage.value = t("auth.success.accountCreated");
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t("auth.errors.signUpFailed");
  } finally {
    loading.value = false;
  }
}

async function handleGoogleSignUp() {
  errorMessage.value = "";
  const result = await signInWithGoogle(googleCallbackPath());
  if (result.error) {
    errorMessage.value = result.error;
  }
}
</script>
