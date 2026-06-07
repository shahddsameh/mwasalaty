<template>
  <label class="grid gap-1.5 text-sm font-bold">
    <span>{{ label }}</span>
    <select :value="modelValue" :multiple="multiple" class="focus-ring min-h-11 rounded-md border bg-card px-3 font-normal" v-bind="$attrs" @change="change">
      <slot />
    </select>
    <span v-if="error" class="font-normal text-destructive">{{ error }}</span>
  </label>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{ label: string; modelValue: string | string[]; multiple?: boolean; error?: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string | string[]] }>();
function change(event: Event) {
  const select = event.target as HTMLSelectElement;
  emit("update:modelValue", select.multiple ? [...select.selectedOptions].map((option) => option.value) : select.value);
}
</script>
