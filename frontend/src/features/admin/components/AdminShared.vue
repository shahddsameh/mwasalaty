<script setup lang="ts">
// Shared admin UI components
</script>

<script lang="ts">
import { defineComponent, h } from 'vue';

// StatCard component
export const StatCard = defineComponent({
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    sub: String,
    color: { type: String, default: '#2B2A27' },
  },
  setup(props) {
    return () =>
      h('div', { class: 'bg-white rounded-2xl p-4 md:p-5 border-2 border-[#E6DEC8]' }, [
        h('p', { class: 'text-sm text-[#6B7280] mb-1' }, props.label),
        h(
          'p',
          {
            class: 'text-2xl md:text-3xl font-bold',
            style: { color: props.color, fontFamily: 'DM Sans, sans-serif' },
          },
          props.value
        ),
        props.sub && h('p', { class: 'text-xs text-[#9CA3AF] mt-1' }, props.sub),
      ]);
  },
});

// Card component
export const Card = defineComponent({
  name: 'Card',
  props: {
    className: String,
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        {
          class: `bg-white rounded-2xl border-2 border-[#E6DEC8] overflow-hidden ${props.className || ''}`,
        },
        slots.default?.()
      );
  },
});

// StatusBadge component
export const StatusBadge = defineComponent({
  name: 'StatusBadge',
  props: {
    status: { type: String, required: true },
  },
  setup(props) {
    const isActive = props.status === 'Active';
    return () =>
      h(
        'span',
        {
          class: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
          style: {
            background: isActive ? '#ECFDF5' : '#FEF2F2',
            color: isActive ? '#059669' : '#E63946',
          },
        },
        [
          h('span', {
            class: 'w-1.5 h-1.5 rounded-full',
            style: { background: isActive ? '#10B981' : '#E63946' },
          }),
          props.status,
        ]
      );
  },
});

// Field component
export const Field = defineComponent({
  name: 'Field',
  props: {
    label: { type: String, required: true },
    hint: String,
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'flex flex-col gap-2' }, [
        h('label', { class: 'text-sm font-semibold text-[#2B2A27]' }, props.label),
        slots.default?.(),
        props.hint && h('p', { class: 'text-xs text-[#6B7280]' }, props.hint),
      ]);
  },
});

export default {};
</script>

<template>
  <div></div>
</template>
