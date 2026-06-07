<template>
  <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-surface-dark/70 p-4" @click.self="$emit('cancel')">
    <section class="admin-panel w-full max-w-md p-6">
      <h2 class="text-2xl font-bold">{{ title }}</h2>
      <p class="mt-3 text-muted-foreground">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <AppButton variant="secondary" @click="$emit('cancel')">{{ $t("common.cancel") }}</AppButton>
        <AppButton variant="danger" @click="$emit('confirm')">{{ $t("common.confirm") }}</AppButton>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import AppButton from "@/components/ui/AppButton.vue";
defineProps<{ open: boolean; title: string; message: string }>();
defineEmits<{ confirm: []; cancel: [] }>();
</script>
