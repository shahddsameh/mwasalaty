<template>
  <AuthForm title="Welcome Back" subtitle="Sign in to your Mwasalaty account">
    <AppInput v-model="email" label="Email or Phone" type="email" placeholder="your@email.com">
      <template #icon><Mail class="w-5 h-5" /></template>
    </AppInput>

    <div class="relative">
      <AppInput v-model="password" label="Password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password">
        <template #icon><Lock class="w-5 h-5" /></template>
      </AppInput>
      <button class="absolute right-3 top-10 text-muted-foreground hover:text-foreground" type="button" @click="showPassword = !showPassword">
        <EyeOff v-if="showPassword" class="w-5 h-5" />
        <Eye v-else class="w-5 h-5" />
      </button>
    </div>

    <div class="flex items-center justify-between mb-2">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="w-4 h-4 rounded border-border" />
        <span class="text-sm text-muted-foreground">Remember me</span>
      </label>
      <button class="text-sm text-primary" @click="router.push('/forgot-password')">Forgot password?</button>
    </div>

    <AppButton size="lg" class="w-full" @click="router.push('/profile')">Sign In</AppButton>
    <AppButton variant="outline" class="w-full" @click="router.push('/')">Continue as Guest</AppButton>

    <p class="text-center text-sm text-muted-foreground">
      Don't have an account?
      <button class="text-primary" @click="router.push('/signup')">Create Account</button>
    </p>
  </AuthForm>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Eye, EyeOff, Lock, Mail } from "@lucide/vue";
import AppButton from "../components/AppButton.vue";
import AppInput from "../components/AppInput.vue";
import AuthForm from "./shared/AuthForm.vue";

const router = useRouter();
const showPassword = ref(false);
const email = ref("");
const password = ref("");
</script>
