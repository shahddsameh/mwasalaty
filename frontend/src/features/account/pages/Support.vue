<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <h1 class="font-display text-4xl text-foreground mb-3">
        Contact Support
      </h1>
      <p class="text-muted-foreground mb-8">
        Get help and find answers to common questions
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section class="lg:col-span-2 space-y-6">
          <Card title="Send us a message">
            <div
              v-if="successMessage"
              class="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg"
            >
              <p class="text-green-200">{{ successMessage }}</p>
            </div>
            <div
              v-if="errorMessage"
              class="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg"
            >
              <p class="text-red-200">{{ errorMessage }}</p>
            </div>
            <div class="space-y-4 mb-6">
              <AppInput
                v-model="form.name"
                label="Your Name"
                placeholder="Enter your name"
              />
              <AppInput
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="your@email.com"
              />
              <AppInput
                v-model="form.phone"
                label="Phone (Optional)"
                type="tel"
                placeholder="+20 XXX XXX XXXX"
              />
              <AppInput
                v-model="form.subject"
                label="Subject (Optional)"
                placeholder="What is this about?"
              />
              <label class="block">
                <span class="block text-sm text-foreground mb-2">Message</span>
                <textarea
                  v-model="form.message"
                  rows="6"
                  class="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Describe your issue or question..."
                />
              </label>
            </div>

            <AppButton
              size="lg"
              class="w-full flex items-center justify-center gap-2"
              :disabled="sending"
              @click="send"
            >
              <Send class="w-5 h-5" />
              {{ sending ? "Sending..." : "Send Message" }}
            </AppButton>
            <p class="text-sm text-muted-foreground text-center mt-4">
              We typically respond within 24 hours
            </p>
          </Card>

          <Card title="Frequently Asked Questions">
            <div class="space-y-3">
              <div
                v-for="(faq, index) in faqs"
                :key="faq.question"
                class="border-2 border-border rounded-lg overflow-hidden"
              >
                <button
                  class="w-full flex items-center justify-between p-4 hover:bg-muted"
                  @click="
                    activeQuestion = activeQuestion === index ? null : index
                  "
                >
                  <span class="font-display text-foreground text-left">{{
                    faq.question
                  }}</span>
                  <ChevronDown
                    v-if="activeQuestion === index"
                    class="w-5 h-5 text-primary"
                  />
                  <ChevronRight v-else class="w-5 h-5 text-muted-foreground" />
                </button>
                <div
                  v-if="activeQuestion === index"
                  class="px-4 pb-4 pt-2 text-sm text-muted-foreground bg-muted"
                >
                  {{ faq.answer }}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <aside class="space-y-6">
          <Card title="Quick Help">
            <div class="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <button
                v-for="item in quickHelp"
                :key="item.title"
                class="p-4 text-left rounded-lg border-2 border-border hover:border-primary hover:bg-primary-soft"
              >
                <div class="font-display text-foreground mb-1">
                  {{ item.title }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ item.description }}
                </div>
              </button>
            </div>
          </Card>

          <section
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary rounded-xl p-6 border-2 border-primary"
          >
            <MessageCircle class="w-8 h-8 text-foreground mb-3" />
            <h3 class="font-display text-xl text-foreground mb-2">
              Need urgent help?
            </h3>
            <p class="text-sm text-foreground mb-4">
              Our support team is available 24/7.
            </p>
            <div class="text-sm text-foreground">
              support@mwasalaty.com<br />+20 2 1234 5678<br />Available 24/7
            </div>
          </section>

          <Card title="Helpful Links">
            <button
              class="block w-full text-left p-3 rounded-lg hover:bg-muted"
            >
              Getting Started Guide
            </button>
            <button
              class="block w-full text-left p-3 rounded-lg hover:bg-muted"
            >
              Video Tutorials
            </button>
            <button
              class="block w-full text-left p-3 rounded-lg hover:bg-muted"
            >
              Community Forum
            </button>
          </Card>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { ChevronDown, ChevronRight, MessageCircle, Send } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";

const activeQuestion = ref<number | null>(null);
const sending = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const form = ref({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const faqs = [
  {
    question: "How do I book a ticket?",
    answer:
      "Search for your route, select your preferred option, and click Book & Pay. You will receive a digital QR ticket valid for 24 hours.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept InstaPay, credit/debit cards, Apple Pay, and cash payment on board for select routes.",
  },
  {
    question: "Can I use the app offline?",
    answer:
      "Yes. Download routes for offline use from the Saved & History section.",
  },
  {
    question: "What is AI Trip Planner?",
    answer:
      "AI Trip Planner creates complete day itineraries based on your budget and interests.",
  },
];

const quickHelp = [
  { title: "Booking Help", description: "How to book and pay" },
  { title: "Route Planning", description: "Finding best routes" },
  { title: "Payments", description: "Payment methods & refunds" },
  { title: "App Features", description: "Using AI and offline mode" },
];

const Card = defineComponent({
  props: { title: String },
  setup:
    (p, { slots }) =>
    () =>
      h("section", { class: "bg-card rounded-xl p-6 border-2 border-border" }, [
        h(
          "h2",
          { class: "font-display text-2xl text-foreground mb-6" },
          p.title,
        ),
        slots.default?.(),
      ]),
});

async function send() {
  successMessage.value = "";
  errorMessage.value = "";

  if (!form.value.name.trim()) {
    errorMessage.value = "Please enter your name";
    return;
  }
  if (!form.value.email.trim()) {
    errorMessage.value = "Please enter your email";
    return;
  }
  if (!form.value.message.trim()) {
    errorMessage.value = "Please write a message";
    return;
  }

  sending.value = true;
  try {
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        phone: form.value.phone.trim() || undefined,
        subject: form.value.subject.trim() || undefined,
        message: form.value.message.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Failed to send message");
    }

    successMessage.value =
      "Message sent! Our support team will respond within 24 hours.";
    form.value = {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    };
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : "Failed to send message";
    console.error("[Support] Error sending message:", err);
  } finally {
    sending.value = false;
  }
}
</script>
