<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[10000] flex items-center justify-center">
      <button class="absolute inset-0 bg-overlay backdrop-blur-sm" aria-label="Close modal" @click="$emit('close')" />
      <div :class="['relative bg-card rounded-xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-auto', widths[size]]">
        <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 class="font-display text-xl text-foreground">{{ title }}</h3>
          <button class="p-1 rounded-lg hover:bg-muted transition-colors" @click="$emit('close')">
            <X class="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div class="px-6 py-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

withDefaults(defineProps<{ open: boolean; title?: string; size?: 'sm' | 'md' | 'lg' }>(), {
  size: 'md',
})

defineEmits<{ close: [] }>()

const widths = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}
</script>
