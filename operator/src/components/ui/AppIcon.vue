<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>

<script setup lang="ts">
export type AppIconName = keyof typeof paths;

defineProps<{ name: AppIconName }>();

const paths = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 13h7v7H4z",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4M12 7v5l3 2",
  sync: "M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M3 20v-4h4",
  summary: "M9 4h6a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v0a1 1 0 0 1 1-1zM7 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M9 13v3M12 11v5M15 14v2",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0",
  bus: "M6 17h12M6 17l-1 3M18 17l1 3M7 4h10a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3zM4 10h16M8 14h.01M16 14h.01",
  metro: "M5 18h14M7 18l-2 3M17 18l2 3M8 3h8a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM4 10h16M8 14h.01M16 14h.01",
  route: "M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 13V8a3 3 0 0 1 3-3h6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  check: "M20 6 9 17l-5-5",
  successBadge: "M12 2.75 14.3 5l3.2-.45.45 3.2L20.25 10 18 12.3l.45 3.2-3.2.45L13 18.25 10.7 16l-3.2.45-.45-3.2L4.75 11 7 8.7l-.45-3.2 3.2-.45L12 2.75zM8.8 10.8l2.1 2.1 4.4-4.4",
  usedTicket: "M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v2a2.5 2.5 0 0 0 0 5v2A1.5 1.5 0 0 1 18 17H6a1.5 1.5 0 0 1-1.5-1.5v-2a2.5 2.5 0 0 0 0-5v-2zM8 8v6M11 11l1.5 1.5L16 9",
  errorCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6",
  routeMismatch: "M5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7.5 15.5 10 13M14 9l2.5-1.5M10 8l4 4M14 8l-4 4",
  helpCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.7 9a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.6 1.1-1.6 2.4M12 17h.01",
  unverifiedStatus: "M12 3 4.5 6v5.5c0 4.6 3.2 7.6 7.5 9.5 4.3-1.9 7.5-4.9 7.5-9.5V6L12 3zM12 8v4M12 16h.01",
  queueWaiting: "M4 6h12M4 10h9M4 14h7M17 13v4l2 1M17 22a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  recentActivity: "M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4M12 7v5l3 2",
  warning: "M12 9v4M12 17h.01M10.3 3.6 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z",
  close: "M18 6 6 18M6 6l12 12",
  question: "M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4M12 18h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  offline: "M1 1l22 22M16.7 11.7A5 5 0 0 0 8.8 8.8M5 12.6A9 9 0 0 0 3 15M19 15a9 9 0 0 0-.8-1.1M8.5 18.5a5 5 0 0 1 7 0M12 22h.01",
  chevron: "m9 18 6-6-6-6",
  camera: "M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  language: "M4 5h7M7.5 3v2M5 9c1.5 3 4 5 7 6M11 9c-1 2.5-3 4.5-6 6M14 20l4-10 4 10M15.5 16h5",
  theme: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
  logout: "M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
} as const;
</script>
