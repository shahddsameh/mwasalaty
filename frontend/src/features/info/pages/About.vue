<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <!-- Hero -->
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
            <MapPin class="w-3.5 h-3.5" /> {{ t("about.badge") }}
          </span>
          <h1
            class="font-display text-3xl md:text-5xl font-bold text-foreground mb-3"
          >
            {{ t("about.title") }}
          </h1>
          <p class="text-muted-foreground max-w-2xl text-sm md:text-base">
            {{ t("about.subtitle") }}
          </p>
        </div>
      </header>

      <!-- Mission & the problem -->
      <Card :title="t('about.mission.title')" class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-lg bg-muted p-5">
            <span
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft mb-3"
            >
              <Target class="w-5 h-5 text-destructive" />
            </span>
            <h3 class="font-display text-lg text-foreground mb-2">
              {{ t("about.mission.problemHeading") }}
            </h3>
            <p class="text-sm md:text-base text-muted-foreground leading-relaxed">
              {{ t("about.mission.problem") }}
            </p>
          </div>
          <div class="rounded-lg bg-muted p-5">
            <span
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft mb-3"
            >
              <Compass class="w-5 h-5 text-primary" />
            </span>
            <h3 class="font-display text-lg text-foreground mb-2">
              {{ t("about.mission.statementHeading") }}
            </h3>
            <p class="text-sm md:text-base text-muted-foreground leading-relaxed">
              {{ t("about.mission.statement") }}
            </p>
          </div>
        </div>
      </Card>

      <!-- What we offer -->
      <section class="mb-8">
        <h2 class="font-display text-2xl md:text-3xl text-foreground mb-5">
          {{ t("about.offer.title") }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in offerItems"
            :key="item.key"
            class="flex flex-col gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <span
              class="flex h-11 w-11 items-center justify-center rounded-xl"
              :style="{ backgroundColor: item.soft }"
            >
              <component :is="item.icon" class="w-5 h-5" :style="{ color: item.color }" />
            </span>
            <div>
              <div class="font-display text-foreground mb-1">
                {{ t(`about.offer.items.${item.key}.title`) }}
              </div>
              <p class="text-sm text-muted-foreground leading-relaxed">
                {{ t(`about.offer.items.${item.key}.desc`) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="mb-8">
        <h2 class="font-display text-2xl md:text-3xl text-foreground mb-5">
          {{ t("about.how.title") }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="(step, index) in howSteps"
            :key="step"
            class="rounded-xl border-2 border-border bg-card p-5"
          >
            <span
              class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg mb-3"
            >
              {{ index + 1 }}
            </span>
            <h3 class="font-display text-lg text-foreground mb-2">
              {{ t(`about.how.steps.${step}.title`) }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ t(`about.how.steps.${step}.desc`) }}
            </p>
          </div>
        </div>
      </section>

      <!-- Team -->
      <section class="mb-8">
        <h2 class="font-display text-2xl md:text-3xl text-foreground mb-2">
          {{ t("about.team.title") }}
        </h2>
        <p class="text-sm md:text-base text-muted-foreground max-w-2xl mb-5">
          {{ t("about.team.subtitle") }}
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div
            v-for="name in team"
            :key="name"
            class="flex flex-col items-center text-center rounded-xl border-2 border-border bg-card p-5"
          >
            <span
              class="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary font-display text-xl mb-3"
            >
              {{ name.charAt(0) }}
            </span>
            <div class="font-display text-foreground">{{ name }}</div>
            <div class="text-xs text-muted-foreground mt-0.5">
              {{ t("about.team.role") }}
            </div>
          </div>
        </div>
      </section>

      <!-- Contact CTA -->
      <section
        class="rounded-xl text-gradient-foreground p-6 md:p-8 border-2 border-primary bg-gradient-to-br from-primary-soft via-warning-soft to-primary"
      >
        <h3 class="font-display text-xl md:text-2xl mb-2">
          {{ t("about.cta.title") }}
        </h3>
        <p class="text-sm md:text-base mb-5 max-w-xl">
          {{ t("about.cta.subtitle") }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <AppButton
            size="lg"
            class="flex items-center justify-center gap-2"
            @click="router.push('/')"
          >
            <Compass class="w-5 h-5" /> {{ t("about.cta.plan") }}
          </AppButton>
          <AppButton
            variant="outline"
            size="lg"
            class="flex items-center justify-center gap-2"
            @click="router.push('/support')"
          >
            <MessageCircle class="w-5 h-5" /> {{ t("about.cta.contact") }}
          </AppButton>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  Brain,
  Compass,
  Languages,
  MapPin,
  MessageCircle,
  Route,
  SlidersHorizontal,
  Target,
  Ticket,
  WifiOff,
} from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";

const { t } = useI18n();
const router = useRouter();

const offerItems = [
  {
    key: "route",
    icon: Route,
    color: "var(--transport-bus)",
    soft: "var(--transport-bus-soft)",
  },
  {
    key: "filters",
    icon: SlidersHorizontal,
    color: "var(--success)",
    soft: "var(--success-soft)",
  },
  {
    key: "ai",
    icon: Brain,
    color: "var(--primary-hover)",
    soft: "var(--primary-soft)",
  },
  {
    key: "ticket",
    icon: Ticket,
    color: "var(--transport-microbus)",
    soft: "var(--transport-microbus-soft)",
  },
  {
    key: "offline",
    icon: WifiOff,
    color: "var(--warning)",
    soft: "var(--warning-soft)",
  },
  {
    key: "operator",
    icon: Languages,
    color: "var(--transport-walking)",
    soft: "var(--transport-walking-soft)",
  },
];

const howSteps = ["plan", "pay", "ride"];

const team = ["Shahd", "Renad", "Mennatallah", "Sarah", "Alaa"];

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
</script>
