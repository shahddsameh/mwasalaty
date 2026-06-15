<template>
  <div
    v-if="totalPages > 1"
    class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3"
  >
    <p class="text-xs text-[#94A3B8]">
      Showing {{ startItem }}-{{ endItem }} of {{ totalItems }}
    </p>
    <div class="flex items-center gap-1.5">
      <button
        :disabled="page <= 1"
        :class="buttonClass"
        @click="$emit('update:page', page - 1)"
      >
        Previous
      </button>
      <button
        v-for="pageNumber in visiblePages"
        :key="pageNumber"
        :class="pageNumber === page ? activeClass : buttonClass"
        @click="$emit('update:page', pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button
        :disabled="page >= totalPages"
        :class="buttonClass"
        @click="$emit('update:page', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  page: number;
  totalItems: number;
  pageSize?: number;
}>();
defineEmits<{ "update:page": [page: number] }>();

const pageSize = computed(() => props.pageSize ?? 10);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / pageSize.value)),
);
const startItem = computed(() =>
  props.totalItems ? (props.page - 1) * pageSize.value + 1 : 0,
);
const endItem = computed(() =>
  Math.min(props.page * pageSize.value, props.totalItems),
);
const visiblePages = computed(() => {
  const start = Math.max(1, Math.min(props.page - 1, totalPages.value - 2));
  const end = Math.min(totalPages.value, start + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

const buttonClass =
  "min-h-[44px] sm:min-h-9 rounded-lg border border-white/10 bg-[#0F172A] px-3 text-xs font-semibold text-[#CBD5E1] transition hover:border-[#FFC400] hover:text-[#FFC400] disabled:cursor-not-allowed disabled:opacity-40";
const activeClass =
  "min-h-[44px] sm:min-h-9 rounded-lg border border-[#FFC400] bg-[#FFC400] px-3 text-xs font-bold text-[#ffffff]";
</script>
