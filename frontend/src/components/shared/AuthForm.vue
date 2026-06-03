<template>
  <main
    class="min-h-screen pb-20 bg-background flex items-center justify-center px-4"
  >
    <div class="max-w-md w-full mx-auto py-8 md:py-12">
      <section class="bg-card rounded-2xl p-6 md:p-8 border-2 border-border">
        <h1 class="font-display text-2xl text-foreground mb-2">
          {{ title }}
        </h1>
        <p class="text-muted-foreground mb-8">{{ subtitle }}</p>
        <div class="space-y-4"><slot /></div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle: string }>();
</script>
