<template>
  <label class="grid gap-1.5 text-sm font-bold">
    <span>{{ label }}</span>
    <input :value="modelValue" class="focus-ring min-h-11 rounded-md border bg-card px-3 font-normal" v-bind="$attrs" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
    <span v-if="error" class="font-normal text-destructive">{{ error }}</span>
  </label>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{ label: string; modelValue: string | number; error?: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>
