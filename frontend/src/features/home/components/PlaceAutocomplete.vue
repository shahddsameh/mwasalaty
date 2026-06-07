<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm text-foreground">{{ label }}</label>
    <div class="relative">
      <div
        v-if="$slots.icon"
        class="absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        style="inset-inline-start: 0.75rem;"
      >
        <slot name="icon" />
      </div>
      <input
        ref="inputRef"
        :value="modelValue"
        :class="[
          'w-full px-4 py-2.5 bg-card border border-border bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all',
          $slots.icon ? 'ps-10' : '',
        ]"
        role="combobox"
        autocomplete="off"
        :aria-expanded="showMenu"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        v-bind="$attrs"
        @focus="isFocused = true"
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
        style="inset-inline-start: 0; inset-inline-end: 0;"
        role="listbox"
      >
        <button
          v-for="(suggestion, index) in filteredSuggestions"
          :id="optionId(index)"
          :key="suggestion.label"
          type="button"
          :class="[
            'w-full px-3 py-2.5 text-start transition-colors',
            index === activeIndex
              ? 'bg-secondary text-primary'
              : 'hover:bg-muted text-foreground',
          ]"
          role="option"
          :aria-selected="index === activeIndex"
          @mousedown.prevent="selectSuggestion(suggestion)"
        >
          <span class="block text-sm font-medium">{{ displayLabel(suggestion) }}</span>
          <span class="block text-xs text-muted-foreground">
            {{ displayArea(suggestion) }} · {{ displayCategory(suggestion) }}
          </span>
        </button>
      </div>
    </div>
    <span v-if="error" class="text-sm text-destructive">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { PlaceSuggestion } from "../services/placeSuggestions";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label?: string;
  error?: string;
  modelValue?: string;
  suggestions: PlaceSuggestion[];
}>();

const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const { locale } = useI18n();

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);
const activeIndex = ref(0);
const listboxId = `place-autocomplete-${Math.random().toString(36).slice(2)}`;

const normalizedQuery = computed(() => normalize(props.modelValue ?? ""));

const filteredSuggestions = computed(() => {
  const query = normalizedQuery.value;
  if (!query) return props.suggestions.slice(0, 8);

  const startsWithMatches = props.suggestions.filter((suggestion) =>
    searchableText(suggestion).startsWith(query),
  );
  const containsMatches = props.suggestions.filter((suggestion) => {
    const text = searchableText(suggestion);
    return !text.startsWith(query) && text.includes(query);
  });

  return [...startsWithMatches, ...containsMatches].slice(0, 8);
});

const showMenu = computed(
  () => isFocused.value && filteredSuggestions.value.length > 0,
);

const activeDescendant = computed(() =>
  showMenu.value ? optionId(activeIndex.value) : undefined,
);

watch(filteredSuggestions, () => {
  activeIndex.value = 0;
});

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[،,]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

function isArabic() {
  return locale.value === "ar";
}

function displayLabel(suggestion: PlaceSuggestion) {
  return isArabic() ? suggestion.labelAr ?? suggestion.label : suggestion.label;
}

function displayArea(suggestion: PlaceSuggestion) {
  return isArabic() ? suggestion.areaAr ?? suggestion.area : suggestion.area;
}

function displayCategory(suggestion: PlaceSuggestion) {
  return isArabic()
    ? suggestion.categoryAr ?? suggestion.category
    : suggestion.category;
}

function searchableText(suggestion: PlaceSuggestion) {
  return normalize(
    [
      suggestion.label,
      suggestion.area,
      suggestion.category,
      suggestion.labelAr,
      suggestion.areaAr,
      suggestion.categoryAr,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function optionId(index: number) {
  return `${listboxId}-option-${index}`;
}

function handleInput(event: Event) {
  isFocused.value = true;
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}

function handleBlur() {
  window.setTimeout(() => {
    isFocused.value = false;
  }, 100);
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

  const count = filteredSuggestions.value.length;
  activeIndex.value = (activeIndex.value + direction + count) % count;
}

function selectActive() {
  if (!showMenu.value) return;
  selectSuggestion(filteredSuggestions.value[activeIndex.value]);
}

function selectSuggestion(suggestion: PlaceSuggestion) {
  emit("update:modelValue", displayLabel(suggestion));
  isFocused.value = false;
  inputRef.value?.focus();
}
</script>
