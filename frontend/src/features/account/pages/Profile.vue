<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <div class="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 class="font-display text-3xl text-foreground mb-3">
            {{ t("account.profileTitle") }}
          </h1>
          <p class="text-muted-foreground">
            {{ t("account.profileSubtitle") }}
          </p>
        </div>
        <AppButton
          variant="outline"
          class="flex items-center gap-2"
          @click="router.push('/settings')"
        >
          <Settings class="w-5 h-5" /> {{ t("nav.settings") }}
        </AppButton>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside class="space-y-6">
          <section class="bg-card rounded-xl p-6 border-2 border-border">
            <div class="flex items-center justify-between mb-6">
              <div
                class="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center"
              >
                <User class="w-10 h-10 text-primary" />
              </div>
              <Edit class="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 class="font-display text-2xl text-foreground">
              {{ userInfo.name }}
            </h2>
            <p class="text-sm text-muted-foreground mb-6">
              {{ t("account.memberSince", { date: userInfo.joined }) }}
            </p>
            <p class="text-sm text-foreground mb-3">{{ userInfo.email }}</p>
            <p class="text-sm text-foreground">{{ userInfo.phone }}</p>
          </section>

          <section class="bg-card rounded-xl p-4 md:p-6 border-2 border-border">
            <h2
              class="font-display text-lg md:text-2xl text-foreground mb-4 md:mb-5"
            >
              {{ t("settings.account") }}
            </h2>

            <div class="space-y-3 md:space-y-4">
              <button
                class="w-full min-h-14 flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted text-start transition-colors text-foreground"
                @click="router.push('/profile')"
              >
                <span class="min-w-0">
                  <span class="block font-display">
                    {{ t("settings.profileSettings") }}
                  </span>
                  <span class="block text-sm text-muted-foreground">
                    {{ t("settings.profileDescription") }}
                  </span>
                </span>

                <ChevronRight class="w-5 h-5 shrink-0 text-muted-foreground rtl:rotate-180" />
              </button>

              <button
                class="w-full min-h-14 flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted text-start transition-colors text-destructive"
                @click="logoutModalOpen = true"
              >
                <span class="min-w-0">
                  <span class="block font-display">{{ t("settings.logout") }}</span>
                  <span class="block text-sm text-muted-foreground">
                    {{ t("settings.logoutDescription") }}
                  </span>
                </span>

                <ChevronRight class="w-5 h-5 shrink-0 text-muted-foreground rtl:rotate-180" />
              </button>
            </div>
          </section>

          <section
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary rounded-xl p-6 border-2 border-primary"
          >
            <h3 class="font-display text-xl text-foreground mb-4">
              {{ t("account.yourStats") }}
            </h3>
            <div class="flex justify-between mb-3">
              <span>{{ t("account.totalTrips") }}</span>
              <strong class="text-3xl">{{ userInfo.totalTrips }}</strong>
            </div>
            <div class="flex justify-between">
              <span>{{ t("account.savedRoutes") }}</span>
              <strong class="text-3xl">{{ userInfo.savedRoutes }}</strong>
            </div>
          </section>
        </aside>

        <section class="lg:col-span-2">
          <div class="flex gap-3 mb-6 overflow-x-auto pb-2">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              :class="tabClass(tab.value)"
              @click="activeTab = tab.value"
            >
              {{ t(tab.labelKey) }}
            </button>
          </div>

          <Card v-if="activeTab === 'info'" :title="t('account.personalInformation')">
            <Info :label="t('account.fullName')" :value="userInfo.name" />
            <Info :label="t('account.email')" :value="userInfo.email" />
            <Info :label="t('account.phone')" :value="userInfo.phone" />
          </Card>

          <Card
            v-else-if="activeTab === 'payments'"
            :title="t('account.savedPaymentMethods')"
          >
            <div
              v-for="payment in savedPayments"
              :key="payment.type"
              class="flex items-center justify-between p-4 border-2 border-border rounded-lg mb-3"
            >
              <div class="flex items-center gap-3">
                <CreditCard class="w-5 h-5 text-primary" />
                <div>
                  <div class="font-display text-foreground">
                    {{ payment.type }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ payment.last4 }}
                  </div>
                </div>
              </div>
              <span
                v-if="payment.primary"
                class="px-3 py-1 bg-primary-soft text-primary text-sm rounded-full"
              >
                {{ t("account.primary") }}
              </span>
            </div>
          </Card>

          <Card v-else :title="t('account.transactionHistory')">
            <div
              v-for="tx in transactions"
              :key="tx.id"
              class="flex items-center justify-between p-4 border-b border-border last:border-0"
            >
              <div>
                <div class="text-foreground">{{ tx.description }}</div>
                <div class="text-sm text-muted-foreground">{{ tx.date }}</div>
              </div>
              <div
                :class="[
                  'font-display text-lg',
                  tx.amount.startsWith('+')
                    ? 'text-success'
                    : 'text-foreground',
                ]"
              >
                {{ tx.amount }}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>

    <Modal
      :open="logoutModalOpen"
      :title="t('settings.logout')"
      @close="logoutModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-muted-foreground">{{ t("settings.logoutConfirm") }}</p>
        <p
          v-if="logoutError"
          class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ logoutError }}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AppButton
            variant="danger"
            class="w-full"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            {{ loggingOut ? t("settings.loggingOut") : t("settings.logout") }}
          </AppButton>
          <AppButton
            variant="outline"
            class="w-full"
            :disabled="loggingOut"
            @click="logoutModalOpen = false"
          >
            {{ t("home.cancel") }}
          </AppButton>
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ChevronRight, CreditCard, Edit, Settings, User } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import { clearAuthState } from "@/services/authState";
import { getCurrentUser, signOut } from "@/services/supabaseAuth";

const router = useRouter();
const { t } = useI18n();
const logoutModalOpen = ref(false);
const loggingOut = ref(false);
const logoutError = ref("");
const activeTab = ref<"info" | "payments" | "transactions">("info");
const tabs = computed(() => [
  { value: "info" as const, labelKey: "account.tabs.personalInfo" },
  { value: "payments" as const, labelKey: "account.tabs.payments" },
  { value: "transactions" as const, labelKey: "account.tabs.transactions" },
]);
const userInfo = reactive({
  name: "Ahmed Hassan",
  email: "ahmed.hassan@email.com",
  phone: "+20 100 123 4567",
  joined: "December 2024",
  totalTrips: 42,
  savedRoutes: 8,
});
const savedPayments = [
  { type: "InstaPay", last4: "****", primary: true },
  { type: "Visa", last4: "4242", primary: false },
];
const transactions = [
  {
    id: "1",
    description: "Tahrir -> Airport",
    amount: "-25 EGP",
    date: "Dec 28, 2024",
  },
  {
    id: "2",
    description: "Maadi -> New Cairo",
    amount: "-18 EGP",
    date: "Dec 27, 2024",
  },
  {
    id: "3",
    description: "Refund: Cancelled Trip",
    amount: "+22 EGP",
    date: "Dec 26, 2024",
  },
];

onMounted(async () => {
  const user = await getCurrentUser();
  if (!user) return;

  userInfo.name =
    (user.user_metadata.full_name as string | undefined) ??
    (user.user_metadata.name as string | undefined) ??
    user.email?.split("@")[0] ??
    userInfo.name;
  userInfo.email = user.email ?? userInfo.email;
  userInfo.phone =
    (user.user_metadata.phone as string | undefined) ?? userInfo.phone;
  userInfo.joined = user.created_at
    ? new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
      }).format(new Date(user.created_at))
    : userInfo.joined;
});

async function handleLogout() {
  logoutError.value = "";
  loggingOut.value = true;

  try {
    const result = await signOut();
    if (result.error) {
      logoutError.value = result.error;
      return;
    }

    clearAuthState();
    logoutModalOpen.value = false;
    await router.push("/login");
  } catch (error) {
    logoutError.value =
      error instanceof Error ? error.message : "Could not log out right now.";
  } finally {
    loggingOut.value = false;
  }
}

function tabClass(value: string) {
  return [
    "px-6 py-3 rounded-lg whitespace-nowrap transition-all",
    activeTab.value === value
      ? "bg-primary text-primary-foreground"
      : "bg-card border-2 border-border text-muted-foreground hover:border-primary",
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

const Info = defineComponent({
  props: { label: String, value: String },
  setup: (p) => () =>
    h("div", { class: "p-4 bg-muted rounded-lg mb-4" }, [
      h("div", { class: "text-sm text-muted-foreground mb-1" }, p.label),
      h("div", { class: "text-foreground break-all" }, p.value),
    ]),
});
</script>
