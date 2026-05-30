<template>
  <main class="min-h-screen pb-20 bg-background flex items-center justify-center px-4">
    <div class="max-w-md w-full mx-auto py-8 md:py-12">
      <button v-if="!sent" class="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6" @click="router.push('/login')">
        <ArrowLeft class="w-5 h-5" /> Back to Login
      </button>
      <section class="bg-card rounded-2xl p-6 md:p-8 border-2 border-border" :class="sent ? 'text-center' : ''">
        <template v-if="sent">
          <div class="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <Check class="w-8 h-8 text-success" />
          </div>
          <h1 class="font-display text-3xl text-foreground mb-3">Check Your Email</h1>
          <p class="text-muted-foreground mb-8">We've sent a password reset link to <strong>{{ email }}</strong>.</p>
          <AppButton class="w-full" @click="router.push('/login')">Back to Login</AppButton>
        </template>
        <template v-else>
          <h1 class="font-display text-4xl text-foreground mb-2">Forgot Password?</h1>
          <p class="text-muted-foreground mb-8">Enter your email address and we'll send you a link to reset your password.</p>
          <AppInput v-model="email" label="Email or Phone" type="email" placeholder="your@email.com">
            <template #icon><Mail class="w-5 h-5" /></template>
          </AppInput>
          <AppButton size="lg" class="w-full mt-6 mb-4" @click="sent = true">Send Reset Link</AppButton>
          <AppButton variant="outline" class="w-full" @click="router.push('/login')">Cancel</AppButton>
        </template>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, Check, Mail } from "@lucide/vue";
import AppButton from "../components/AppButton.vue";
import AppInput from "../components/AppInput.vue";

const router = useRouter();
const email = ref("");
const sent = ref(false);
</script>
