<template>
  <main class="min-h-screen pb-20 bg-background py-8 px-4">
    <section
      class="max-w-2xl w-full mx-auto bg-card rounded-2xl p-6 md:p-8 border-2 border-border"
    >
      <h1 class="font-display text-2xl text-foreground mb-2">Create Account</h1>
      <p class="text-muted-foreground mb-8">
        Join Mwasalaty and start your journey
      </p>

      <div class="space-y-4 mb-6">
        <AppInput label="Full Name" placeholder="Enter your full name"
          ><template #icon><User class="w-5 h-5" /></template
        ></AppInput>
        <AppInput
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          ><template #icon><Mail class="w-5 h-5" /></template
        ></AppInput>
        <AppInput label="Phone Number" type="tel" placeholder="+20 XXX XXX XXXX"
          ><template #icon><Phone class="w-5 h-5" /></template
        ></AppInput>
        <PasswordField
          v-model:show="showPassword"
          label="Password"
          placeholder="Create a password"
        />
        <PasswordField
          v-model:show="showConfirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
        />
      </div>

      <label class="flex items-start gap-3 mb-6 cursor-pointer">
        <input type="checkbox" class="w-4 h-4 mt-1 rounded border-border" />
        <span class="text-sm text-muted-foreground">
          I agree to the
          <button class="text-primary">Terms of Service</button> and
          <button class="text-primary">Privacy Policy</button>
        </span>
      </label>

      <AppButton size="lg" class="w-full mb-6" @click="router.push('/profile')"
        >Create Account</AppButton
      >
      <p class="text-center text-sm text-muted-foreground">
        Already have an account?
        <button class="text-primary" @click="router.push('/login')">
          Sign In
        </button>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";

const router = useRouter();
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const PasswordField = defineComponent({
  props: { show: Boolean, label: String, placeholder: String },
  emits: ["update:show"],
  setup(props, { emit }) {
    return () =>
      h("div", { class: "relative" }, [
        h(
          AppInput,
          {
            label: props.label,
            type: props.show ? "text" : "password",
            placeholder: props.placeholder,
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
</script>
