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
              <button
                class="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :aria-label="t('account.editProfile')"
                @click="openEditModal"
              >
                <Edit class="w-5 h-5" />
              </button>
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

                <ChevronRight
                  class="w-5 h-5 shrink-0 text-muted-foreground rtl:rotate-180"
                />
              </button>

              <button
                v-if="canChangePassword"
                class="w-full min-h-14 flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted text-start transition-colors text-foreground"
                @click="openPasswordModal"
              >
                <span class="min-w-0">
                  <span class="block font-display">
                    {{ t("account.changePassword") }}
                  </span>
                  <span class="block text-sm text-muted-foreground">
                    {{ t("account.changePasswordDescription") }}
                  </span>
                </span>

                <ChevronRight
                  class="w-5 h-5 shrink-0 text-muted-foreground rtl:rotate-180"
                />
              </button>

              <button
                class="w-full min-h-14 flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted text-start transition-colors text-destructive"
                @click="logoutModalOpen = true"
              >
                <span class="min-w-0">
                  <span class="block font-display">{{
                    t("settings.logout")
                  }}</span>
                  <span class="block text-sm text-muted-foreground">
                    {{ t("settings.logoutDescription") }}
                  </span>
                </span>

                <ChevronRight
                  class="w-5 h-5 shrink-0 text-muted-foreground rtl:rotate-180"
                />
              </button>
            </div>
          </section>

          <section
            class="bg-gradient-to-br from-primary-soft via-warning-soft to-primary text-sidebar rounded-xl p-6 border-2 border-primary"
          >
            <h3 class="font-display text-xl mb-4">
              {{ t("account.yourStats") }}
            </h3>
            <div class="flex justify-between mb-3">
              <span>{{ t("account.totalTrips") }}</span>
              <strong class="text-3xl">{{ totalTrips }}</strong>
            </div>
            <div class="flex justify-between">
              <span>{{ t("account.savedRoutes") }}</span>
              <strong class="text-3xl">{{ savedRoutesCount }}</strong>
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

          <Card
            v-if="activeTab === 'info'"
            :title="t('account.personalInformation')"
          >
            <Info :label="t('account.fullName')" :value="userInfo.name" />
            <Info :label="t('account.email')" :value="userInfo.email" />
            <Info :label="t('account.phone')" :value="userInfo.phone" />
          </Card>

          <Card v-else :title="t('account.transactionHistory')">
            <p
              v-if="transactions.length === 0"
              class="text-sm text-muted-foreground"
            >
              {{ t("account.noTransactions") }}
            </p>
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
      :open="editModalOpen"
      :title="t('account.editProfile')"
      @close="editModalOpen = false"
    >
      <div class="space-y-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{
            t("account.fullName")
          }}</span>
          <input
            v-model="editName"
            class="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{ t("account.email") }}</span>
          <input
            v-model="editEmail"
            type="email"
            class="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <span class="text-xs text-muted-foreground">
            {{ t("account.emailChangeHint") }}
          </span>
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{ t("account.phone") }}</span>
          <input
            v-model="editPhone"
            type="tel"
            class="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </label>

        <p
          v-if="editError"
          class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ editError }}
        </p>
        <p
          v-if="editNotice"
          class="rounded-lg border border-primary/30 bg-primary-soft px-4 py-3 text-sm text-primary"
        >
          {{ editNotice }}
        </p>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-4"
        >
          <AppButton
            class="w-full"
            :disabled="savingProfile"
            @click="handleSaveProfile"
          >
            {{ savingProfile ? t("account.saving") : t("account.saveChanges") }}
          </AppButton>
          <AppButton
            variant="outline"
            class="w-full"
            :disabled="savingProfile"
            @click="editModalOpen = false"
          >
            {{ t("home.cancel") }}
          </AppButton>
        </div>
      </div>
    </Modal>

    <Modal
      :open="passwordModalOpen"
      :title="t('account.changePassword')"
      @close="passwordModalOpen = false"
    >
      <div class="space-y-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{
            t("account.currentPassword")
          }}</span>
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            class="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{
            t("account.newPassword")
          }}</span>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm text-foreground">{{
            t("account.confirmPassword")
          }}</span>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </label>

        <p
          v-if="passwordError"
          class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ passwordError }}
        </p>
        <p
          v-if="passwordNotice"
          class="rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
        >
          {{ passwordNotice }}
        </p>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-4"
        >
          <AppButton
            class="w-full"
            :disabled="changingPassword"
            @click="handleChangePassword"
          >
            {{
              changingPassword ? t("account.saving") : t("account.saveChanges")
            }}
          </AppButton>
          <AppButton
            variant="outline"
            class="w-full"
            :disabled="changingPassword"
            @click="passwordModalOpen = false"
          >
            {{ t("home.cancel") }}
          </AppButton>
        </div>
      </div>
    </Modal>

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
import { ChevronRight, Edit, Settings, User } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";
import { clearAuthState } from "@/services/authState";
import {
  changePassword,
  getCurrentUser,
  isEmailPasswordUser,
  signOut,
  updateProfile,
} from "@/services/supabaseAuth";
import { getTickets, type Ticket } from "@/services/api";
import { useSavedTrips } from "@/composables/useSavedTrips";

const router = useRouter();
const { t } = useI18n();
const logoutModalOpen = ref(false);
const loggingOut = ref(false);
const logoutError = ref("");
const editModalOpen = ref(false);
const editName = ref("");
const editEmail = ref("");
const editPhone = ref("");
const savingProfile = ref(false);
const editError = ref("");
const editNotice = ref("");
const canChangePassword = ref(false);
const passwordModalOpen = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const changingPassword = ref(false);
const passwordError = ref("");
const passwordNotice = ref("");
const activeTab = ref<"info" | "transactions">("info");
const tabs = computed(() => [
  { value: "info" as const, labelKey: "account.tabs.personalInfo" },
  { value: "transactions" as const, labelKey: "account.tabs.transactions" },
]);
const userInfo = reactive({
  name: "Ahmed Hassan",
  email: "ahmed.hassan@email.com",
  phone: "+20 100 123 4567",
  joined: "December 2024",
});

const { savedTrips } = useSavedTrips();
const tickets = ref<Ticket[]>([]);

// Live count of locally saved routes (offline-first store shared with Saved.vue).
const savedRoutesCount = computed(() => savedTrips.value.length);
// Total paid journeys = number of the user's tickets.
const totalTrips = computed(() => tickets.value.length);

// Transaction history derived from the user's real tickets: one charge row per
// ticket, plus a refund row whenever any amount has been refunded.
const transactions = computed(() =>
  tickets.value.flatMap((ticket) => {
    const rows: {
      id: string;
      description: string;
      amount: string;
      date: string;
    }[] = [];
    const description = ticketRouteSummary(ticket);
    const currency = ticket.payment.currency ?? "EGP";
    const date = formatTxDate(ticket.createdAt ?? ticket.departureAt);

    rows.push({
      id: ticket.ticketId,
      description,
      amount: `-${ticket.payment.amount} ${currency}`,
      date,
    });

    if ((ticket.payment.refundedAmount ?? 0) > 0) {
      rows.push({
        id: `${ticket.ticketId}-refund`,
        description: `${t("account.refundLabel")} · ${description}`,
        amount: `+${ticket.payment.refundedAmount} ${currency}`,
        date: formatTxDate(ticket.payment.refundedAt ?? ticket.createdAt),
      });
    }

    return rows;
  }),
);

function ticketRouteSummary(ticket: Ticket): string {
  const from = ticket.legs[0]?.from?.name;
  const to = ticket.legs.at(-1)?.to?.name;
  return from && to ? `${from} -> ${to}` : t("account.transactionHistory");
}

function formatTxDate(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

onMounted(async () => {
  const user = await getCurrentUser();
  if (!user) return;

  canChangePassword.value = isEmailPasswordUser(user);

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

  try {
    tickets.value = await getTickets();
  } catch {
    // Leave the list empty if tickets can't be fetched; the page still renders.
    tickets.value = [];
  }
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

function openEditModal() {
  editName.value = userInfo.name;
  editEmail.value = userInfo.email;
  editPhone.value = userInfo.phone;
  editError.value = "";
  editNotice.value = "";
  editModalOpen.value = true;
}

async function handleSaveProfile() {
  const name = editName.value.trim();
  const email = editEmail.value.trim();
  const phone = editPhone.value.trim();

  if (!name) {
    editError.value = t("account.nameRequired");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    editError.value = t("account.invalidEmail");
    return;
  }

  editError.value = "";
  editNotice.value = "";
  savingProfile.value = true;

  try {
    const emailChanged = email !== userInfo.email;
    const result = await updateProfile({
      name,
      phone,
      email: emailChanged ? email : undefined,
    });

    if (result.error) {
      editError.value = result.error;
      return;
    }

    userInfo.name = name;
    userInfo.phone = phone;

    if (result.emailChangePending) {
      editNotice.value = t("account.emailChangePending");
    } else {
      editModalOpen.value = false;
    }
  } catch (error) {
    editError.value =
      error instanceof Error ? error.message : t("account.updateFailed");
  } finally {
    savingProfile.value = false;
  }
}

function openPasswordModal() {
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  passwordError.value = "";
  passwordNotice.value = "";
  passwordModalOpen.value = true;
}

async function handleChangePassword() {
  passwordError.value = "";
  passwordNotice.value = "";

  if (!currentPassword.value) {
    passwordError.value = t("account.currentPasswordRequired");
    return;
  }
  if (newPassword.value.length < 6) {
    passwordError.value = t("account.passwordTooShort");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t("account.passwordMismatch");
    return;
  }

  changingPassword.value = true;
  try {
    const result = await changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    if (result.error) {
      passwordError.value = result.error;
      return;
    }
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    passwordNotice.value = t("account.passwordChanged");
  } catch (error) {
    passwordError.value =
      error instanceof Error ? error.message : t("account.updateFailed");
  } finally {
    changingPassword.value = false;
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
