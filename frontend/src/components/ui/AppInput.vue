<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm text-foreground">{{ label }}</label>
    <div class="relative">
      <div
        v-if="$slots.icon"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        <slot name="icon" />
      </div>
      <input
        :value="modelValue"
        :class="[
          'w-full px-4 py-2.5 bg-card border border-border bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all',
          $slots.icon ? 'pl-10' : '',
        ]"
        v-bind="$attrs"
        @input="
          $emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
    <span v-if="error" class="text-sm text-destructive">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string; error?: string; modelValue?: string | number }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>
