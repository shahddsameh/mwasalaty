<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <PageTitle
        title="All Tickets"
        subtitle="Your tickets and booking history"
      >
        <template #icon><Ticket class="w-10 h-10 text-primary" /></template>
      </PageTitle>

      <section class="space-y-8">
        <div>
          <h2 class="font-display text-2xl text-foreground mb-6">
            Active Tickets ({{ validTickets.length }})
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article
              v-for="ticket in validTickets"
              :key="ticket.id"
              class="bg-card rounded-xl border-2 border-border shadow-md overflow-hidden"
            >
              <div
                class="bg-secondary px-5 py-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <Ticket class="w-6 h-6 text-foreground" />
                  <div>
                    <div class="font-display text-lg text-foreground">
                      Digital Ticket
                    </div>
                    <div class="text-sm text-foreground font-mono">
                      {{ ticket.id }}
                    </div>
                  </div>
                </div>
                <span
                  class="px-3 py-1 rounded-full bg-success text-success-foreground flex items-center gap-1 text-sm"
                >
                  <Check class="w-4 h-4" /> Valid
                </span>
              </div>
              <div class="p-5">
                <div
                  class="text-sm text-muted-foreground flex items-center gap-2 mb-2"
                >
                  <MapPin class="w-4 h-4" /> Route
                </div>
                <div class="font-display text-lg text-foreground mb-3">
                  {{ ticket.route.from }} -> {{ ticket.route.to }}
                </div>
                <div class="flex flex-wrap gap-2 mb-4">
                  <span
                    v-for="mode in ticket.route.modes"
                    :key="mode"
                    class="px-2.5 py-1 bg-muted border border-border rounded-full text-xs"
                  >
                    {{ mode }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-3 mb-4">
                  <SmallStat label="Cost" :value="ticket.cost" />
                  <SmallStat label="Valid Until" :value="ticket.validUntil" />
                </div>
                <div
                  class="p-3 bg-secondary border border-primary/20 rounded-lg mb-4 text-foreground text-sm"
                >
                  Expires {{ ticket.expiry }}
                </div>
                <AppButton
                  class="w-full flex items-center justify-center gap-2"
                  @click="router.push('/ticket')"
                >
                  <Ticket class="w-5 h-5" /> View Ticket Details
                </AppButton>
              </div>
            </article>
          </div>
        </div>

        <div>
          <h2 class="font-display text-2xl text-foreground mb-6">
            Booking History ({{ bookingHistory.length }})
          </h2>
          <div class="space-y-4">
            <article
              v-for="ticket in bookingHistory"
              :key="ticket.id"
              class="bg-card rounded-xl p-5 border-2 border-border"
            >
              <div class="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="font-mono text-sm text-muted-foreground">{{
                      ticket.id
                    }}</span>
                    <span :class="statusClass(ticket.status)">{{
                      ticket.status
                    }}</span>
                  </div>
                  <div class="font-display text-lg text-foreground mb-2">
                    {{ ticket.route.from }} -> {{ ticket.route.to }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ ticket.cost }} - {{ ticket.bookingTime }}
                  </div>
                </div>
                <AppButton
                  variant="outline"
                  size="sm"
                  @click="
                    router.push({
                      path: '/route-results',
                      state: {
                        start: ticket.route.from,
                        destination: ticket.route.to,
                      },
                    })
                  "
                >
                  Book Again
                </AppButton>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";
import { useRouter } from "vue-router";
import { Check, MapPin, Ticket } from "@lucide/vue";
import AppButton from "../components/AppButton.vue";
import PageTitle from "./shared/PageTitle.vue";

const router = useRouter();
const validTickets = [
  {
    id: "MWS-24122801-4K9L",
    route: {
      from: "Tahrir Square",
      to: "Cairo Airport",
      modes: ["metro", "bus"],
    },
    cost: "25 EGP",
    expiry: "Dec 28, 2024 11:45 PM",
    validUntil: "24 hours",
  },
  {
    id: "MWS-24122701-8H3P",
    route: { from: "Maadi", to: "New Cairo", modes: ["metro", "microbus"] },
    cost: "18 EGP",
    expiry: "Dec 29, 2024 2:30 PM",
    validUntil: "24 hours",
  },
  {
    id: "MWS-24122601-2F7M",
    route: { from: "Zamalek", to: "Giza Pyramids", modes: ["bus"] },
    cost: "15 EGP",
    expiry: "Dec 30, 2024 9:15 AM",
    validUntil: "24 hours",
  },
];
const bookingHistory = [
  {
    id: "MWS-24122501-9K2L",
    route: { from: "Downtown", to: "Airport" },
    cost: "22 EGP",
    status: "expired",
    bookingTime: "Dec 25, 2024 7:30 AM",
  },
  {
    id: "MWS-24122401-5N8R",
    route: { from: "Nasr City", to: "Heliopolis" },
    cost: "12 EGP",
    status: "used",
    bookingTime: "Dec 24, 2024 3:15 PM",
  },
  {
    id: "MWS-24122301-1T6W",
    route: { from: "Mohandesen", to: "City Stars" },
    cost: "20 EGP",
    status: "used",
    bookingTime: "Dec 23, 2024 11:00 AM",
  },
];
const SmallStat = defineComponent({
  props: { label: String, value: String },
  setup: (p) => () =>
    h("div", { class: "p-3 bg-secondary rounded-lg" }, [
      h("div", { class: "text-xs text-muted-foreground" }, p.label),
      h("div", { class: "font-display text-foreground" }, p.value),
    ]),
});
function statusClass(status: string) {
  return [
    "px-2.5 py-1 rounded-full text-xs capitalize",
    status === "used"
      ? "bg-success-soft text-success"
      : "bg-danger-soft text-destructive",
  ];
}
</script>
