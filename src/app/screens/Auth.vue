<template>
  <main
    class="min-h-screen pb-20 bg-background flex items-center justify-center px-4"
  >
    <div class="max-w-6xl w-full mx-auto py-8 md:py-12">
      <div class="text-center mb-12">
        <h1 class="font-display text-4xl text-foreground mb-4">
          Welcome to Mwasalaty
        </h1>
        <p class="text-lg md:text-xl text-muted-foreground">
          Login or create an account to unlock all features
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
        <AuthCard
          title="Login"
          copy="Already have an account? Sign in to access your saved routes, tickets, and travel history."
          cta="Sign In"
          :icon="LogIn"
          color="var(--primary)"
          soft-color="var(--primary-soft)"
          @click="router.push('/login')"
        />
        <AuthCard
          title="Sign Up"
          copy="New to Mwasalaty? Create a free account to save routes, book tickets, and plan trips with AI."
          cta="Create Account"
          :icon="UserPlus"
          color="var(--success)"
          soft-color="var(--success-soft)"
          @click="router.push('/signup')"
        />
      </div>

      <div class="text-center">
        <div
          class="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-3 bg-card rounded-lg border-2 border-border"
        >
          <span class="text-muted-foreground">Just browsing?</span>
          <AppButton variant="outline" @click="router.push('/')"
            >Continue as Guest</AppButton
          >
        </div>
      </div>

      <div class="mt-12 text-center">
        <button
          class="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
          @click="router.push('/support')"
        >
          <HelpCircle class="w-5 h-5" /> Need help? Contact Support
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";
import { useRouter } from "vue-router";
import { ArrowRight, HelpCircle, LogIn, UserPlus } from "@lucide/vue";
import AppButton from "../components/AppButton.vue";

const router = useRouter();
const AuthCard = defineComponent({
  props: {
    title: String,
    copy: String,
    cta: String,
    icon: { type: [Object, Function], required: true },
    color: String,
    softColor: String,
  },
  emits: ["click"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          class:
            "bg-card rounded-2xl p-8 border-2 border-border hover:border-primary transition-all cursor-pointer group text-left",
          onClick: () => emit("click"),
        },
        [
          h(
            "div",
            {
              class:
                "w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all",
              style: { backgroundColor: props.softColor },
            },
            [
              h(props.icon as any, {
                class: "w-8 h-8",
                style: { color: props.color },
              }),
            ],
          ),
          h(
            "h2",
            { class: "font-display text-3xl text-foreground mb-3" },
            props.title,
          ),
          h("p", { class: "text-muted-foreground mb-6" }, props.copy),
          h(
            "div",
            {
              class: "flex items-center gap-2 transition-all",
              style: { color: props.color },
            },
            [props.cta, h(ArrowRight, { class: "w-5 h-5" })],
          ),
        ],
      );
  },
});
</script>
