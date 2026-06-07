<template>
  <section class="rounded-xl border border-slate-200 bg-white p-6">
    <h2 class="font-display text-2xl text-slate-950">{{ title }}</h2>
    <p class="mt-2 text-slate-500">This admin page is ready for implementation.</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
