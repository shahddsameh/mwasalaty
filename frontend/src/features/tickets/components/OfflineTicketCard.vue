<template>
  <article
    v-if="ticket"
    class="rounded-xl border-2 border-border bg-card p-4 text-foreground"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="font-display text-lg">Offline Ticket</h2>
        <p class="mt-1 font-mono text-sm text-muted-foreground">
          {{ ticket.ticketId }}
        </p>
      </div>
      <span class="rounded-full bg-success-soft px-3 py-1 text-sm text-success">
        {{ ticket.status }}
      </span>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <div class="text-xs text-muted-foreground">Fare</div>
        <div class="font-display">
          {{ ticket.payment.amount }} {{ ticket.payment.currency }}
        </div>
      </div>
      <div>
        <div class="text-xs text-muted-foreground">Valid until</div>
        <div class="font-display">{{ validUntil }}</div>
      </div>
    </div>

    <ol class="mt-4 space-y-2 text-sm">
      <li
        v-for="leg in ticket.legs"
        :key="leg.ticketLegId"
        class="rounded-lg bg-muted p-3"
      >
        {{ leg.mode }}: {{ leg.from?.name ?? "Start" }} to
        {{ leg.to?.name ?? "Destination" }}
      </li>
    </ol>
  </article>
  <p v-else class="rounded-lg border border-border bg-card p-4 text-muted-foreground">
    This ticket is not saved for offline use yet.
  </p>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTickets } from "@/composables/useTickets";

const props = defineProps<{ ticketId: string }>();
const { tickets } = useTickets(props.ticketId);

const ticket = computed(() => tickets.value[0]);
const validUntil = computed(() =>
  ticket.value?.expiresAt
    ? new Date(ticket.value.expiresAt).toLocaleString()
    : "24h from booking",
);
</script>
