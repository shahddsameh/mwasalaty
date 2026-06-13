<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm text-foreground">{{ label }}</label>
    <div class="relative">
      <div
        v-if="$slots.icon"
        class="absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        style="inset-inline-start: 0.75rem"
      >
        <slot name="icon" />
      </div>
      <input
        ref="inputRef"
        :value="modelValue"
        :class="[
          'w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all',
          $slots.icon ? 'ps-10' : '',
        ]"
        role="combobox"
        autocomplete="off"
        :aria-expanded="showMenu"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        v-bind="$attrs"
        @focus="onFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
        @keydown.enter.prevent="selectActive"
        @keydown.esc="closeMenu"
      />

      <div
        v-if="showMenu"
        :id="listboxId"
        class="absolute top-full z-30 mt-2 max-h-72 overflow-auto rounded-lg border border-border bg-card shadow-lg"
        style="inset-inline-start: 0; inset-inline-end: 0"
        role="listbox"
      >
        <button
          v-for="(place, index) in results"
          :id="optionId(index)"
          :key="`${place.label}-${place.lat}-${place.lng}`"
          type="button"
          :class="[
            'flex w-full items-center gap-2.5 px-3 py-2.5 text-start transition-colors',
            index === activeIndex
              ? 'bg-secondary text-primary'
              : 'hover:bg-muted text-foreground',
          ]"
          role="option"
          :aria-selected="index === activeIndex"
          @mousedown.prevent="choose(place)"
        >
          <MapPin class="w-4 h-4 shrink-0 text-muted-foreground" />
          <span class="block text-sm font-medium truncate">{{ displayLabel(place) }}</span>
        </button>
      </div>
    </div>
    <span v-if="error" class="text-sm text-destructive">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { MapPin } from "@lucide/vue";
import { usePlacesSearch } from "@/composables/usePlacesSearch";
import type { PlaceResult } from "@/services/api";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label?: string;
  error?: string;
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  select: [place: PlaceResult];
}>();

const { results, search, clear } = usePlacesSearch();
const { locale } = useI18n();

function displayLabel(place: PlaceResult) {
  return locale.value === "ar" ? (place.arLabel ?? place.label) : place.label;
}

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);
const activeIndex = ref(0);
const listboxId = `place-search-${Math.random().toString(36).slice(2)}`;

const showMenu = computed(() => isFocused.value && results.value.length > 0);
const activeDescendant = computed(() =>
  showMenu.value ? optionId(activeIndex.value) : undefined,
);

function optionId(index: number) {
  return `${listboxId}-option-${index}`;
}

function onFocus() {
  isFocused.value = true;
  if ((props.modelValue ?? "").trim()) search(props.modelValue ?? "");
}

function handleInput(event: Event) {
  isFocused.value = true;
  activeIndex.value = 0;
  const value = (event.target as HTMLInputElement).value;
  emit("update:modelValue", value);
  if (value.trim()) search(value);
  else clear();
}

function handleBlur() {
  window.setTimeout(() => {
    isFocused.value = false;
  }, 120);
}

function closeMenu() {
  isFocused.value = false;
  inputRef.value?.blur();
}

function moveActive(direction: number) {
  if (!showMenu.value) {
    isFocused.value = true;
    return;
  }
  const count = results.value.length;
  activeIndex.value = (activeIndex.value + direction + count) % count;
}

function selectActive() {
  if (!showMenu.value) return;
  choose(results.value[activeIndex.value]);
}

function choose(place: PlaceResult) {
  emit("update:modelValue", displayLabel(place));
  emit("select", place);
  isFocused.value = false;
  clear();
  inputRef.value?.focus();
}
</script>
