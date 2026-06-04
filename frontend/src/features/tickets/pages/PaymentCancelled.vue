<template>
  <main class="min-h-screen bg-background flex items-center justify-center px-4 py-12">
    <section
      class="w-full max-w-md bg-card rounded-2xl border-2 border-border p-8 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center"
      >
        <XCircle class="w-8 h-8 text-destructive" />
      </div>
      <h1 class="font-display text-2xl text-foreground mb-2">Payment cancelled</h1>
      <p class="text-muted-foreground mb-6">
        No charge was made to your card. You can try again whenever you're ready.
      </p>
      <div class="space-y-2">
        <AppButton class="w-full" @click="router.replace('/booking')">
          Try again
        </AppButton>
        <AppButton variant="ghost" class="w-full" @click="router.replace('/')">
          Back to home
        </AppButton>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { XCircle } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";

const router = useRouter();
</script>
