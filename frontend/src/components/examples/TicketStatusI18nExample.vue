<template>
  <section class="rounded-lg border border-border bg-card p-4">
    <div class="flex items-start">
      <TicketCheck class="me-3 mt-1 h-5 w-5 shrink-0 text-primary" />
      <div class="min-w-0">
        <h2 class="font-display text-foreground">
          {{ t("example.ticketStatusTitle") }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t("example.ticketStatusDescription") }}
        </p>
        <span
          class="mt-3 inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-sm text-success ms-0"
        >
          {{ ticketStatusLabel }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { TicketCheck } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    status?:
      | "active"
      | "used"
      | "refunded"
      | "partially_refunded"
      | "expired"
      | "pending";
  }>(),
  {
    status: "active",
  },
);

const { t } = useI18n();
const ticketStatusLabel = computed(() => t(`ticket.status.${props.status}`));
</script>
