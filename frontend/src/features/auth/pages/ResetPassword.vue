<template>
  <main
    class="min-h-screen pb-20 bg-background flex items-center justify-center px-4"
  >
    <div class="max-w-md w-full mx-auto py-8 md:py-12">
      <section
        class="bg-card rounded-2xl p-6 md:p-8 border-2 border-border"
        :class="done ? 'text-center' : ''"
      >
        <template v-if="done">
          <div
            class="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check class="w-8 h-8 text-success" />
          </div>
          <h1 class="font-display text-3xl text-foreground mb-3">
            Password Updated
          </h1>
          <p class="text-muted-foreground mb-8">
            Your password has been changed. You can now use it to sign in.
          </p>
          <AppButton class="w-full" @click="router.push('/profile')"
            >Continue</AppButton
          >
        </template>

        <template v-else-if="verifying">
          <h1 class="font-display text-3xl text-foreground mb-2">
            Verifying your link
          </h1>
          <p class="text-muted-foreground">Please wait a moment…</p>
        </template>

        <template v-else-if="linkError">
          <h1 class="font-display text-3xl text-foreground mb-2">
            Link expired or invalid
          </h1>
          <p class="text-muted-foreground mb-8">{{ linkError }}</p>
          <AppButton class="w-full" @click="router.push('/forgot-password')"
            >Request a new link</AppButton
          >
        </template>

        <template v-else>
          <h1 class="font-display text-4xl text-foreground mb-2">
            Set a new password
          </h1>
          <p class="text-muted-foreground mb-8">
            Choose a new password for your account.
          </p>
          <p
            v-if="errorMessage"
            class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4"
          >
            {{ errorMessage }}
          </p>

          <div class="relative mb-4">
            <AppInput
              v-model="newPassword"
              label="New Password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Enter a new password"
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

          <AppInput
            v-model="confirmPassword"
            label="Confirm New Password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Re-enter the new password"
          >
            <template #icon><Lock class="w-5 h-5" /></template>
          </AppInput>

          <AppButton
            size="lg"
            class="w-full mt-6"
            :disabled="saving"
            @click="handleReset"
            >{{ saving ? "Updating..." : "Update Password" }}</AppButton
          >
        </template>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Check, Eye, EyeOff, Lock } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import {
  exchangeCodeForSession,
  getCurrentSession,
  updatePassword,
} from "@/services/supabaseAuth";
import { setAuthSession } from "@/services/authState";

const router = useRouter();
const verifying = ref(true);
const linkError = ref("");
const errorMessage = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const saving = ref(false);
const done = ref(false);

onMounted(async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (error) {
    linkError.value = error;
    verifying.value = false;
    return;
  }

  if (code) {
    const result = await exchangeCodeForSession(code);
    if (result.error) {
      linkError.value = result.error;
      verifying.value = false;
      return;
    }
    if (result.session) setAuthSession(result.session);
  } else {
    // No code in the URL — only valid if a recovery session is already active.
    const session = await getCurrentSession();
    if (!session) {
      linkError.value = "This reset link is missing or has expired.";
      verifying.value = false;
      return;
    }
  }

  verifying.value = false;
});

async function handleReset() {
  errorMessage.value = "";

  if (newPassword.value.length < 6) {
    errorMessage.value = "Password must be at least 6 characters.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Passwords don't match.";
    return;
  }

  saving.value = true;
  try {
    const result = await updatePassword(newPassword.value);
    if (result.error) {
      errorMessage.value = result.error;
      return;
    }
    done.value = true;
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : "Could not update your password.";
  } finally {
    saving.value = false;
  }
}
</script>
