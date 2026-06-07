<template>
  <section class="mx-auto grid min-h-[70vh] max-w-5xl place-items-center">
    <div class="admin-panel grid w-full overflow-hidden md:grid-cols-[1.1fr_0.9fr]">
      <div class="bg-surface-dark p-10 text-white">
        <p class="text-xs uppercase tracking-[0.35em] text-primary">Authorized staff only</p>
        <h1 class="mt-5 max-w-lg text-5xl font-bold leading-tight">{{ $t("auth.title") }}</h1>
        <p class="mt-5 max-w-md text-lg text-white/65">{{ $t("auth.subtitle") }}</p>
      </div>
      <form class="p-8 md:p-10" @submit.prevent="submit">
        <div v-if="message" class="mb-5 rounded-md bg-warning-soft p-3 text-sm">{{ message }}</div>
        <AppInput v-model="secret" type="password" autocomplete="current-password" :label="$t('auth.secret')" />
        <p v-if="error" class="mt-3 text-sm text-destructive">{{ error }}</p>
        <AppButton class="mt-6 w-full" type="submit" :disabled="loading">{{ loading ? $t("common.loading") : $t("auth.submit") }}</AppButton>
      </form>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import * as api from "@/services/api";
import { setSession } from "@/services/session";
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const secret = ref("");
const error = ref("");
const loading = ref(false);
const message = computed(() => route.query.message ? t(`auth.${String(route.query.message)}`) : "");
async function submit() {
  error.value = ""; loading.value = true;
  try { setSession(await api.login(secret.value)); await router.push({ name: "dashboard" }); }
  catch { error.value = t("auth.error"); }
  finally { loading.value = false; }
}
</script>
