<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <!-- Header -->
      <header
        class="relative overflow-hidden rounded-2xl border-2 border-border bg-card mb-8"
      >
        <div
          class="absolute inset-0 opacity-90"
          style="
            background-image:
              radial-gradient(
                circle at 0% 0%,
                var(--secondary),
                transparent 45%
              ),
              radial-gradient(circle at 100% 100%, var(--card), transparent 55%);
          "
        />
        <div class="relative px-6 py-8 md:px-10 md:py-12">
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground border border-primary/30 mb-4"
          >
            <Headphones class="w-3.5 h-3.5" /> {{ t("support.badge") }}
          </span>
          <h1
            class="font-display text-3xl md:text-5xl font-bold text-foreground mb-3"
          >
            {{ t("support.title") }}
          </h1>
          <p class="text-muted-foreground max-w-xl text-sm md:text-base">
            {{ t("support.subtitle") }}
          </p>
        </div>
      </header>

      <!-- Quick contact methods -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <a
          v-for="m in methods"
          :key="m.label"
          :href="m.href"
          class="group flex flex-col gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
        >
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
            :style="{ backgroundColor: m.soft }"
          >
            <component
              :is="m.icon"
              class="w-5 h-5"
              :style="{ color: m.color }"
            />
          </span>
          <div>
            <div class="font-display text-foreground">{{ m.label }}</div>
            <div class="text-sm text-muted-foreground" dir="ltr">
              {{ m.value }}
            </div>
          </div>
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: message form + FAQ -->
        <section class="lg:col-span-2 space-y-8">
          <Card :title="t('support.form.title')">
            <!-- Success state -->
            <div
              v-if="submitted"
              class="flex flex-col items-center text-center py-8"
            >
              <span
                class="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft mb-4"
              >
                <CheckCircle2 class="w-8 h-8 text-success" />
              </span>
              <h3 class="font-display text-2xl text-foreground mb-1">
                {{ t("support.form.successTitle") }}
              </h3>
              <p class="text-sm text-muted-foreground max-w-sm mb-6">
                {{ t("support.form.successBody") }}
              </p>
              <AppButton variant="outline" @click="resetForm">
                {{ t("support.form.sendAnother") }}
              </AppButton>
            </div>

            <form v-else class="space-y-5" @submit.prevent="submit">
              <!-- Topic chips -->
              <div>
                <span class="block text-sm text-foreground mb-2">{{
                  t("support.form.topicLabel")
                }}</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in topics"
                    :key="option"
                    type="button"
                    :class="topicClass(option)"
                    @click="topic = option"
                  >
                    {{ t(`support.topics.${option}`) }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppInput
                  v-model="form.name"
                  :label="t('support.form.name')"
                  :placeholder="t('support.form.namePlaceholder')"
                  :error="errors.name"
                />
                <AppInput
                  v-model="form.email"
                  :label="t('support.form.email')"
                  type="email"
                  :placeholder="t('support.form.emailPlaceholder')"
                  :error="errors.email"
                />
              </div>

              <AppInput
                v-model="form.subject"
                :label="t('support.form.subject')"
                :placeholder="t('support.form.subjectPlaceholder')"
              />

              <label class="block">
                <span class="block text-sm text-foreground mb-2">{{
                  t("support.form.message")
                }}</span>
                <textarea
                  v-model="form.message"
                  rows="6"
                  class="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all"
                  :class="errors.message ? 'border-destructive' : ''"
                  :placeholder="t('support.form.messagePlaceholder')"
                />
                <span v-if="errors.message" class="text-sm text-destructive">{{
                  errors.message
                }}</span>
              </label>

              <p v-if="errorMessage" class="text-sm text-destructive">
                {{ errorMessage }}
              </p>
              <AppButton
                type="submit"
                size="lg"
                class="w-full flex items-center justify-center gap-2"
                :disabled="sending"
              >
                <Send class="w-5 h-5" />
                {{ sending ? t("support.form.sending") : t("support.form.send") }}
              </AppButton>
              <p class="text-sm text-muted-foreground text-center">
                {{ t("support.form.responseTime") }}
              </p>
            </form>
          </Card>

          <Card :title="t('support.faqTitle')">
            <div class="space-y-3">
              <div
                v-for="(faq, index) in faqs"
                :key="faq.question"
                class="rounded-lg border-2 border-border overflow-hidden transition-colors"
                :class="activeQuestion === index ? 'border-primary' : ''"
              >
                <button
                  type="button"
                  class="w-full flex items-center justify-between gap-3 p-4 text-start hover:bg-muted transition-colors"
                  @click="
                    activeQuestion = activeQuestion === index ? null : index
                  "
                >
                  <span class="font-display text-foreground">{{
                    faq.question
                  }}</span>
                  <ChevronDown
                    class="w-5 h-5 shrink-0 transition-transform duration-200"
                    :class="
                      activeQuestion === index
                        ? 'rotate-180 text-primary'
                        : 'text-muted-foreground'
                    "
                  />
                </button>
                <div
                  v-show="activeQuestion === index"
                  class="px-4 pb-4 pt-1 text-sm text-muted-foreground"
                >
                  {{ faq.answer }}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <!-- Right: office, hours, social, urgent -->
        <aside class="space-y-8">
          <Card :title="t('support.office.title')">
            <div
              class="relative h-36 -mx-6 -mt-2 mb-4 overflow-hidden border-y border-border"
              style="
                background-image:
                  linear-gradient(var(--border) 1px, transparent 1px),
                  linear-gradient(to right, var(--border) 1px, transparent 1px),
                  linear-gradient(135deg, var(--primary-soft), var(--secondary));
                background-size:
                  28px 28px,
                  28px 28px,
                  cover;
              "
            >
              <span
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <span
                  class="relative flex h-12 w-12 items-center justify-center"
                >
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40"
                  />
                  <span
                    class="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg"
                  >
                    <MapPin class="w-5 h-5 text-primary-foreground" />
                  </span>
                </span>
              </span>
            </div>
            <p class="text-sm text-foreground leading-relaxed mb-4">
              {{ t("support.office.addressLine1")
              }}<br />{{ t("support.office.addressLine2") }}
            </p>
            <a
              href="https://maps.google.com/?q=Smart+Village+Giza"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              {{ t("support.office.directions") }}
              <ArrowRight class="w-4 h-4 rtl:rotate-180" />
            </a>
          </Card>

          <Card :title="t('support.hours.title')">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-foreground">{{
                  t("support.hours.weekdays")
                }}</span>
                <span class="text-sm text-muted-foreground" dir="ltr">{{
                  t("support.hours.weekdaysHours")
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-foreground">{{
                  t("support.hours.weekend")
                }}</span>
                <span class="text-sm text-muted-foreground" dir="ltr">{{
                  t("support.hours.weekendHours")
                }}</span>
              </div>
              <div class="pt-2 border-t border-border">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  :class="
                    isOpen
                      ? 'bg-success-soft text-success'
                      : 'bg-muted text-muted-foreground'
                  "
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="isOpen ? 'bg-success' : 'bg-muted-foreground'"
                  />
                  {{ isOpen ? t("support.hours.open") : t("support.hours.closed") }}
                </span>
              </div>
            </div>
          </Card>

          <Card :title="t('support.social.title')">
            <p class="text-sm text-muted-foreground mb-4">
              {{ t("support.social.subtitle") }}
            </p>
            <div class="flex gap-3">
              <a
                v-for="s in socials"
                :key="s.label"
                :href="s.href"
                target="_blank"
                rel="noopener"
                :aria-label="s.label"
                class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path :d="s.path" />
                </svg>
              </a>
            </div>
          </Card>

          <section
            class="rounded-xl text-gradient-foreground p-6 border-2 border-primary bg-gradient-to-br from-primary-soft via-warning-soft to-primary"
          >
            <MessageCircle class="w-8 h-8 mb-3" />
            <h3 class="font-display text-xl mb-2">
              {{ t("support.urgent.title") }}
            </h3>
            <p class="text-sm mb-4">{{ t("support.urgent.subtitle") }}</p>
            <div class="space-y-2 text-sm">
              <a
                href="mailto:support@mwasalaty.com"
                class="flex items-center gap-2 hover:underline"
                dir="ltr"
              >
                <Mail class="w-4 h-4 shrink-0" /> support@mwasalaty.com
              </a>
              <a
                href="tel:+20212345678"
                class="flex items-center gap-2 hover:underline"
                dir="ltr"
              >
                <Phone class="w-4 h-4 shrink-0" /> +20 2 1234 5678
              </a>
              <div class="flex items-center gap-2">
                <Clock class="w-4 h-4 shrink-0" /> {{ t("support.urgent.available") }}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import { getCurrentSession, getCurrentUser } from "@/services/supabaseAuth";

const { t } = useI18n();
const activeQuestion = ref<number | null>(null);
const sending = ref(false);
const errorMessage = ref("");
const submitted = ref(false);
const topic = ref("general");

const topics = ["general", "booking", "payment", "feedback"];

const form = reactive({ name: "", email: "", subject: "", message: "" });
const errors = reactive({ name: "", email: "", message: "" });
const currentUserId = ref("");

const isOpen = computed(() => {
  const hour = new Date().getHours();
  return hour >= 9 && hour < 21;
});

const methods = computed(() => [
  {
    label: t("support.methods.email.label"),
    value: t("support.methods.email.value"),
    href: "mailto:support@mwasalaty.com",
    icon: Mail,
    color: "var(--transport-walking)",
    soft: "var(--transport-walking-soft)",
  },
  {
    label: t("support.methods.call.label"),
    value: t("support.methods.call.value"),
    href: "tel:+20212345678",
    icon: Phone,
    color: "var(--success)",
    soft: "var(--success-soft)",
  },
  {
    label: t("support.methods.visit.label"),
    value: t("support.methods.visit.value"),
    href: "https://maps.google.com/?q=Smart+Village+Giza",
    icon: MapPin,
    color: "var(--transport-microbus)",
    soft: "var(--transport-microbus-soft)",
  },
  {
    label: t("support.methods.chat.label"),
    value: t("support.methods.chat.value"),
    href: "#",
    icon: MessageCircle,
    color: "var(--primary-hover)",
    soft: "var(--primary-soft)",
  },
]);

const socials = [
  {
    label: "Facebook",
    href: "#",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    label: "X",
    href: "#",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    label: "LinkedIn",
    href: "#",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
];

const faqs = computed(() => [
  {
    question: t("support.faqs.book.q"),
    answer: t("support.faqs.book.a"),
  },
  {
    question: t("support.faqs.payment.q"),
    answer: t("support.faqs.payment.a"),
  },
  {
    question: t("support.faqs.offline.q"),
    answer: t("support.faqs.offline.a"),
  },
  {
    question: t("support.faqs.aiPlanner.q"),
    answer: t("support.faqs.aiPlanner.a"),
  },
]);

function topicClass(option: string) {
  return [
    "rounded-full border-2 px-4 py-1.5 text-sm transition-all",
    topic.value === option
      ? "border-primary bg-secondary text-primary"
      : "border-border text-muted-foreground hover:border-primary",
  ];
}

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

onMounted(async () => {
  const user = await getCurrentUser();
  if (!user) return;
  currentUserId.value = user.id;
  form.email = user.email || form.email;
  form.name =
    (user.user_metadata.full_name as string | undefined) ||
    (user.user_metadata.name as string | undefined) ||
    form.name;
});

async function submit() {
  errorMessage.value = "";
  errors.name = form.name.trim() ? "" : t("support.errors.name");
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? ""
    : t("support.errors.email");
  errors.message = form.message.trim() ? "" : t("support.errors.message");

  if (errors.name || errors.email || errors.message) return;

  sending.value = true;
  try {
    const session = await getCurrentSession();
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({
        userId: currentUserId.value || undefined,
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || t(`support.topics.${topic.value}`),
        message: form.message.trim(),
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(data?.error?.message || t("support.errors.failed"));
    submitted.value = true;
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : t("support.errors.failed");
  } finally {
    sending.value = false;
  }
}

function resetForm() {
  submitted.value = false;
  topic.value = "general";
  form.name = "";
  form.email = "";
  form.subject = "";
  form.message = "";
  errors.name = "";
  errors.email = "";
  errors.message = "";
  errorMessage.value = "";
}
</script>
