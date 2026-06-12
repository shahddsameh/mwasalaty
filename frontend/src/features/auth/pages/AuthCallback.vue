<template>
  <AuthForm title="Signing you in" subtitle="Completing Google authentication...">
    <div class="space-y-4">
      <p
        v-if="errorMessage"
        class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ errorMessage }}
      </p>

      <p class="text-sm text-muted-foreground">
        {{ statusMessage }}
      </p>
    </div>
  </AuthForm>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthForm from "@/components/shared/AuthForm.vue";
import { exchangeCodeForSession, getCurrentSession } from "@/services/supabaseAuth";
import { setAuthSession } from "@/services/authState";

const router = useRouter();
const route = useRoute();
const statusMessage = ref("Please wait while we finish setting up your session.");
const errorMessage = ref("");

function resolveRedirect() {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect ? redirect : "/profile";
}

function loginRedirect() {
  return { path: "/login", query: { redirect: resolveRedirect() } };
}

onMounted(async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    errorMessage.value = errorDescription ?? error ?? "Google sign-in failed.";
    statusMessage.value = "We could not complete Google sign-in.";
    await router.replace(loginRedirect());
    return;
  }

  if (!code) {
    statusMessage.value = "Checking your session...";
    const session = await getCurrentSession();
    await router.replace(session ? resolveRedirect() : loginRedirect());
    return;
  }

  const result = await exchangeCodeForSession(code);
  if (result.error) {
    errorMessage.value = result.error;
    statusMessage.value = "We could not complete Google sign-in.";
    await router.replace(loginRedirect());
    return;
  }

  if (result.session) {
    setAuthSession(result.session);
  }

  const session = await getCurrentSession();
  await router.replace(session ? resolveRedirect() : loginRedirect());
});
</script>
