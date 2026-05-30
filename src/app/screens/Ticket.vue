<template>
  <main class="min-h-screen pb-20 bg-background py-6 md:py-12">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section class="lg:col-span-2">
          <button
            class="flex items-center gap-2 text-foreground hover:text-primary mb-6"
            @click="router.back()"
          >
            <ArrowLeft class="w-5 h-5" /> Back
          </button>

          <div
            class="bg-card rounded-2xl overflow-hidden border-2 border-border"
          >
            <div
              class="bg-secondary px-4 md:px-8 py-6 flex items-center justify-between"
            >
              <div>
                <h1 class="font-display text-2xl md:text-3xl text-foreground">
                  Mwasalaty
                </h1>
                <p class="text-foreground">Digital Transport Ticket</p>
              </div>
              <span
                class="px-4 py-2 rounded-full bg-success text-success-foreground flex items-center gap-2"
              >
                <Check class="w-4 h-4" /> Valid
              </span>
            </div>

            <div class="px-4 md:px-8 py-10 bg-card flex flex-col items-center">
              <button
                class="w-56 h-56 md:w-80 md:h-80 bg-card border-4 border-border rounded-2xl flex items-center justify-center mb-6 hover:border-primary"
                @click="qrModalOpen = true"
              >
                <QrCode class="w-48 h-48 md:w-64 md:h-64 text-foreground" />
              </button>
              <div
                class="font-mono text-lg md:text-2xl text-foreground text-center break-all"
              >
                {{ ticketData.id }}
              </div>
              <p class="text-sm text-muted-foreground mt-2">Ticket ID</p>
            </div>

            <div
              class="px-4 md:px-8 py-6 bg-surface-dark text-surface-dark-foreground"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RouteField label="From" :value="ticketData.route.from" />
                <RouteField label="To" :value="ticketData.route.to" />
              </div>
              <div class="flex flex-wrap gap-2 mt-4">
                <span
                  v-for="mode in ticketData.route.modes"
                  :key="mode"
                  class="px-3 py-1.5 bg-surface-dark-border rounded-full text-sm"
                >
                  {{ mode }}
                </span>
              </div>
            </div>

            <div
              class="px-4 md:px-8 py-6 bg-surface-dark text-surface-dark-foreground border-t border-surface-dark-border grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              <Detail label="Total Cost" :value="ticketData.cost" gold />
              <Detail label="Valid Until" :value="ticketData.validUntil" />
              <Detail label="Booked" :value="ticketData.bookingTime" />
            </div>

            <div
              class="px-4 md:px-8 py-4 bg-primary-soft border-t border-primary/20 text-foreground flex items-center gap-3"
            >
              <Clock class="w-5 h-5" /> Expires {{ ticketData.expiry }}
            </div>

            <div
              class="px-4 md:px-8 py-6 bg-surface-dark border-t border-surface-dark-border grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <AppButton
                class="flex items-center justify-center gap-2"
                @click="router.push('/live-navigation')"
              >
                <Navigation class="w-5 h-5" /> Start Navigation
              </AppButton>
              <AppButton
                variant="ghost"
                class="text-surface-dark-foreground border-surface-dark-border hover:bg-surface-dark-muted flex items-center justify-center gap-2"
              >
                <Download class="w-5 h-5" /> Download
              </AppButton>
              <AppButton
                variant="ghost"
                class="text-surface-dark-foreground border-surface-dark-border hover:bg-surface-dark-muted flex items-center justify-center gap-2"
              >
                <Share2 class="w-5 h-5" /> Share
              </AppButton>
            </div>
          </div>
        </section>

        <aside class="space-y-6">
          <InfoCard title="How to Use">
            <ol class="space-y-3 text-sm text-muted-foreground">
              <li>1. Show QR code at metro/bus entry points</li>
              <li>2. Ticket is valid for 24 hours from booking</li>
              <li>3. Keep your phone charged during journey</li>
              <li>4. Download for offline access if needed</li>
            </ol>
          </InfoCard>
          <InfoCard title="Quick Actions">
            <div class="space-y-2">
              <AppButton
                variant="outline"
                class="w-full justify-start"
                @click="router.push('/all-tickets')"
                >View All Tickets</AppButton
              >
              <AppButton
                variant="outline"
                class="w-full justify-start"
                @click="router.push('/support')"
                >Contact Support</AppButton
              >
            </div>
          </InfoCard>
          <section
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary rounded-xl p-6 border-2 border-primary"
          >
            <h3 class="font-display text-xl text-foreground mb-4">
              Your Journey
            </h3>
            <div class="flex justify-between mb-3">
              <span>Total trips this month</span
              ><strong class="text-2xl">12</strong>
            </div>
            <div class="flex justify-between">
              <span>Money saved</span><strong class="text-2xl">340 EGP</strong>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <Modal :open="qrModalOpen" size="sm" @close="qrModalOpen = false">
      <div class="flex flex-col items-center py-6">
        <QrCode class="w-64 h-64 text-foreground mb-4" />
        <div class="font-mono text-center break-all">{{ ticketData.id }}</div>
        <AppButton class="w-full mt-6" @click="qrModalOpen = false"
          >Close</AppButton
        >
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  Navigation,
  QrCode,
  Share2,
} from "@lucide/vue";
import AppButton from "../components/AppButton.vue";
import Modal from "../components/Modal.vue";
import { ticketData } from "../data";

const router = useRouter();
const qrModalOpen = ref(false);

const RouteField = defineComponent({
  props: { label: String, value: String },
  setup: (p) => () =>
    h("div", [
      h("div", { class: "text-sm text-muted-foreground mb-1" }, p.label),
      h("div", { class: "font-display text-xl" }, p.value),
    ]),
});

const Detail = defineComponent({
  props: { label: String, value: String, gold: Boolean },
  setup: (p) => () =>
    h("div", [
      h("div", { class: "text-sm text-muted-foreground mb-1" }, p.label),
      h(
        "div",
        {
          class: ["font-display", p.gold ? "text-2xl text-primary" : "text-lg"],
        },
        p.value,
      ),
    ]),
});

const InfoCard = defineComponent({
  props: { title: String },
  setup:
    (p, { slots }) =>
    () =>
      h("section", { class: "bg-card rounded-xl p-6 border-2 border-border" }, [
        h(
          "h3",
          { class: "font-display text-xl text-foreground mb-4" },
          p.title,
        ),
        slots.default?.(),
      ]),
});
</script>
