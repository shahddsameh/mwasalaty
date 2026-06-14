<script setup lang="ts">
// Shared admin UI components
</script>

<script lang="ts">
import { defineComponent, h } from "vue";

// StatCard component
export const StatCard = defineComponent({
  name: "StatCard",
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    sub: String,
    color: { type: String, default: "#FFC107" },
    className: { type: String, default: "" },
  },
  setup(props) {
    return () =>
      h(
        "div",
        {
          class: `${props.className || "bg-card rounded-2xl p-4 border border-border min-h-[104px] flex flex-col justify-between shadow-sm"}`,
        },
        [
          h("div", { class: "flex items-center justify-between gap-3" }, [
            h(
              "p",
              {
                class:
                  "text-sm font-medium leading-tight text-muted-foreground",
              },
              props.label,
            ),
            h("span", {
              class: "h-2.5 w-2.5 rounded-full flex-shrink-0",
              style: { background: props.color },
            }),
          ]),
          h(
            "p",
            {
              class: "mt-2 text-[28px] font-bold leading-none",
              style: { color: props.color, fontFamily: "DM Sans, sans-serif" },
            },
            props.value,
          ),
          props.sub &&
            h("p", { class: "text-xs text-muted-foreground mt-2" }, props.sub),
        ],
      );
  },
});

// Card component
export const Card = defineComponent({
  name: "Card",
  props: {
    className: String,
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: `bg-card rounded-2xl border border-border overflow-hidden shadow-sm ${props.className || ""}`,
        },
        slots.default?.(),
      );
  },
});

// StatusBadge component
export const StatusBadge = defineComponent({
  name: "StatusBadge",
  props: {
    status: { type: String, required: true },
  },
  setup(props) {
    const isActive = props.status === "Active";
    return () =>
      h(
        "span",
        {
          class:
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
          style: {
            background: isActive
              ? "rgba(16,185,129,0.12)"
              : "rgba(239,68,68,0.12)",
            color: isActive ? "#10B981" : "#EF4444",
          },
        },
        [
          h("span", {
            class: "w-1.5 h-1.5 rounded-full",
            style: { background: isActive ? "#10B981" : "#EF4444" },
          }),
          props.status,
        ],
      );
  },
});

// Field component
export const Field = defineComponent({
  name: "Field",
  props: {
    label: { type: String, required: true },
    hint: String,
  },
  setup(props, { slots }) {
    return () =>
      h("div", { class: "flex flex-col gap-2" }, [
        h(
          "label",
          { class: "text-sm font-semibold text-foreground" },
          props.label,
        ),
        slots.default?.(),
        props.hint &&
          h("p", { class: "text-xs text-muted-foreground" }, props.hint),
      ]);
  },
});

export default {};
</script>

<template>
  <div></div>
</template>
