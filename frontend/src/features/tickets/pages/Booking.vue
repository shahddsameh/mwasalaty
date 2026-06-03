<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
      <h1 class="font-display text-2xl sm:text-3xl text-foreground mb-3">
        Booking & Payment
      </h1>
      <p class="text-muted-foreground mb-8">
        Complete your booking to get your digital ticket
      </p>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section class="lg:col-span-2 space-y-6">
          <Card title="Route Summary">
            <InfoRow label="From" value="Tahrir Square" />
            <InfoRow label="To" value="Cairo Airport" />
            <InfoRow label="Duration" value="45 min" />
            <div class="flex gap-2 mt-3">
              <span
                v-for="mode in ['metro', 'bus']"
                :key="mode"
                class="px-3 py-1 bg-secondary rounded-full text-sm text-foreground"
              >
                {{ mode }}
              </span>
            </div>
          </Card>

          <Card title="Passenger Information">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput label="Full Name" placeholder="Enter your full name" />
              <AppInput
                label="Phone Number"
                placeholder="+20 XXX XXX XXXX"
                type="tel"
              />
              <AppInput
                label="Email (Optional)"
                placeholder="your@email.com"
                type="email"
              />
            </div>
          </Card>

          <Card title="Payment Method">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                v-for="method in methods"
                :key="method.value"
                :class="methodClass(method.value)"
                @click="paymentMethod = method.value"
              >
                <component
                  :is="method.icon"
                  class="w-6 h-6 text-primary mb-2"
                />
                <div class="font-display text-foreground">
                  {{ method.label }}
                </div>
              </button>
            </div>
            <div v-if="paymentMethod === 'card'" class="space-y-4">
              <AppInput label="Card Number" placeholder="XXXX XXXX XXXX XXXX" />
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppInput label="Expiry Date" placeholder="MM/YY" />
                <AppInput label="CVV" placeholder="XXX" type="password" />
              </div>
            </div>
            <div
              v-if="paymentMethod === 'instapay'"
              class="p-4 bg-secondary rounded-lg text-sm text-muted-foreground"
            >
              You'll be redirected to InstaPay to complete your payment
              securely.
            </div>
          </Card>

          <AppButton
            size="lg"
            class="w-full flex items-center justify-center gap-2"
            :disabled="paymentSuccess"
            @click="proceed"
          >
            <Check v-if="paymentSuccess" class="w-5 h-5" />
            <CreditCard v-else class="w-5 h-5" />
            {{
              paymentSuccess
                ? "Payment Successful!"
                : "Confirm Payment - 25 EGP"
            }}
          </AppButton>
        </section>

        <aside class="space-y-6">
          <Card title="Fare Breakdown" sticky>
            <InfoRow
              v-for="item in fareBreakdown"
              :key="item.service"
              :label="item.service"
              :value="`${item.cost} EGP`"
              small
            />
            <div
              class="pt-4 border-t-2 border-border mt-4 flex items-center justify-between"
            >
              <span class="font-display text-lg">Total</span>
              <span class="font-display text-3xl text-primary">25 EGP</span>
            </div>
            <div
              class="mt-4 p-3 bg-secondary rounded-lg text-sm text-muted-foreground"
            >
              Includes all transport fees<br />Valid for 24 hours<br />Digital
              QR ticket
            </div>
          </Card>
        </aside>
      </div>
    </div>

    <Modal
      :open="loginModalOpen"
      title="Login Required"
      @close="loginModalOpen = false"
    >
      <div class="space-y-4">
        <p class="p-4 bg-secondary rounded-lg text-sm text-foreground">
          You need to log in or create an account to book and save your tickets.
        </p>
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="router.push('/login')"
            >Login</AppButton
          >
          <AppButton
            variant="outline"
            class="flex-1"
            @click="router.push('/signup')"
            >Sign Up</AppButton
          >
        </div>
        <AppButton variant="ghost" class="w-full" @click="payAsGuest"
          >Continue as Guest</AppButton
        >
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import { Check, CreditCard, Smartphone, Wallet } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import Modal from "@/components/ui/Modal.vue";

const router = useRouter();
const paymentMethod = ref<"instapay" | "card" | "apple" | "cash">("instapay");
const loginModalOpen = ref(false);
const paymentSuccess = ref(false);
const isLoggedIn = false;

const fareBreakdown = [
  { service: "Metro (Sadat -> Nasser)", cost: 8 },
  { service: "Bus 356 (Nasser -> Airport)", cost: 15 },
  { service: "Service Fee", cost: 2 },
];

const methods = [
  { value: "instapay" as const, label: "InstaPay", icon: Smartphone },
  { value: "card" as const, label: "Credit Card", icon: CreditCard },
  { value: "apple" as const, label: "Apple Pay", icon: Smartphone },
  { value: "cash" as const, label: "Pay on Board", icon: Wallet },
];

const Card = defineComponent({
  props: { title: String, sticky: Boolean },
  setup:
    (p, { slots }) =>
    () =>
      h(
        "section",
        {
          class: [
            "bg-card rounded-xl p-4 sm:p-6 border-2 border-border",
            p.sticky ? "lg:sticky lg:top-8" : "",
          ],
        },
        [
          h(
            "h2",
            { class: "font-display text-xl sm:text-2xl text-foreground mb-4" },
            p.title,
          ),
          slots.default?.(),
        ],
      ),
});

const InfoRow = defineComponent({
  props: { label: String, value: String, small: Boolean },
  setup: (p) => () =>
    h("div", { class: "flex items-center justify-between mb-3 gap-3" }, [
      h(
        "span",
        {
          class: p.small
            ? "text-sm text-muted-foreground"
            : "text-muted-foreground",
        },
        p.label,
      ),
      h("span", { class: "font-display text-foreground text-right" }, p.value),
    ]),
});

function methodClass(value: string) {
  return [
    "p-4 min-h-[110px] flex flex-col items-start justify-center rounded-lg border-2 transition-all",
    paymentMethod.value === value
      ? "border-primary bg-secondary"
      : "border-border hover:border-primary",
  ];
}

function handlePayment() {
  setTimeout(() => {
    paymentSuccess.value = true;
    setTimeout(() => router.push("/ticket"), 900);
  }, 700);
}

function proceed() {
  isLoggedIn ? handlePayment() : (loginModalOpen.value = true);
}

function payAsGuest() {
  loginModalOpen.value = false;
  handlePayment();
}
</script>
