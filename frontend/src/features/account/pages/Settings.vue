<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-12">
      <h1
        class="font-display text-2xl md:text-3xl text-foreground mb-2 md:mb-3"
      >
        Settings
      </h1>
      <p class="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
        Manage your app preferences and account
      </p>

      <div
        class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 md:gap-8"
      >
        <section class="space-y-5 md:space-y-6">
          <Card title="Preferences">
            <SettingRow
              label="Language"
              description="Choose the app language for navigation, labels, and trip details."
              :icon="Globe"
            >
              <Choice v-model="language" value="en" label="English" />
              <Choice v-model="language" value="ar" label="Arabic" />
            </SettingRow>
            <SettingRow
              label="Theme"
              description="Switch between the default light appearance and dark mode."
              :icon="Moon"
            >
              <Choice v-model="theme" value="light" label="Light" />
              <Choice v-model="theme" value="dark" label="Dark" />
            </SettingRow>
          </Card>

          <Card title="Notifications">
            <div
              class="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3 md:p-4"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft"
                >
                  <Bell class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div class="font-display text-foreground">
                    Push Notifications
                  </div>
                  <div class="text-sm text-muted-foreground">
                    Route updates and journey alerts
                  </div>
                </div>
              </div>
              <button
                :class="[
                  'h-7 w-14 shrink-0 rounded-full p-1 transition-all',
                  notifications ? 'bg-success' : 'bg-border',
                ]"
                @click="notifications = !notifications"
              >
                <div
                  :class="[
                    'w-5 h-5 bg-card rounded-full transition-all',
                    notifications ? 'translate-x-7' : 'translate-x-0',
                  ]"
                />
              </button>
            </div>
          </Card>

          <Card title="Data & Storage">
            <button
              class="w-full flex items-center justify-between gap-3 p-3 md:p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-muted transition-all text-left"
            >
              <span class="flex items-center gap-3 min-w-0">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger-soft"
                >
                  <Trash2 class="w-5 h-5 text-destructive" />
                </span>
                <span class="min-w-0">
                  <span class="block font-display text-foreground">
                    Clear Offline Data
                  </span>
                  <span class="block text-sm text-muted-foreground">
                    Remove downloaded routes and cached trip data.
                  </span>
                </span>
              </span>
              <ChevronRight class="w-5 h-5 shrink-0 text-muted-foreground" />
            </button>
          </Card>
        </section>

        <aside class="space-y-5 md:space-y-6 lg:sticky lg:top-8 h-fit">
          <!-- <Card title="Account">
            <MenuButton
              label="Profile Settings"
              description="Edit personal details and payment methods"
              @click="router.push('/profile')"
            />
            <MenuButton
              danger
              label="Logout"
              description="Sign out from this device"
              @click="logoutModalOpen = true"
            />
          </Card> -->
          <Card title="Privacy & Legal">
            <MenuButton
              label="Privacy Policy"
              description="How your data is used"
            />
            <MenuButton
              label="Terms of Service"
              description="App usage rules"
            />
          </Card>
          <Card title="Help & Support">
            <MenuButton
              label="Contact Support"
              description="Get help with routes, tickets, and payments"
              @click="router.push('/support')"
            />
          </Card>

          <section
            class="bg-card rounded-xl p-4 md:p-5 border-2 border-border text-sm text-muted-foreground"
          >
            <div class="font-display text-foreground mb-1">Mwasalaty</div>
            <div>Version 1.0.0</div>
            <div>2024 All rights reserved</div>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Bell, ChevronRight, Globe, Moon, Trash2 } from "@lucide/vue";
import { applyTheme, getSavedTheme, type AppTheme } from "@/services/theme";

const router = useRouter();
const language = ref<"en" | "ar">("en");
const theme = ref<AppTheme>(getSavedTheme());
const notifications = ref(true);

watch(
  theme,
  (nextTheme) => {
    applyTheme(nextTheme);
  },
  { immediate: true },
);

const Card = defineComponent({
  props: { title: String },
  setup:
    (p, { slots }) =>
    () =>
      h(
        "section",
        { class: "bg-card rounded-xl p-4 md:p-6 border-2 border-border" },
        [
          h(
            "h2",
            {
              class:
                "font-display text-lg md:text-2xl text-foreground mb-4 md:mb-5",
            },
            p.title,
          ),
          h("div", { class: "space-y-3 md:space-y-4" }, slots.default?.()),
        ],
      ),
});

const SettingRow = defineComponent({
  props: {
    label: String,
    description: String,
    icon: { type: [Object, Function], required: true },
  },
  setup:
    (p, { slots }) =>
    () =>
      h(
        "div",
        {
          class:
            "grid gap-3 rounded-lg border border-border p-3 md:gap-4 md:p-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:items-center",
        },
        [
          h("div", { class: "flex gap-3" }, [
            h(
              "div",
              {
                class:
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft",
              },
              [h(p.icon as any, { class: "w-5 h-5 text-primary" })],
            ),
            h("div", { class: "min-w-0" }, [
              h("div", { class: "font-display text-foreground" }, p.label),
              h(
                "div",
                { class: "text-sm leading-snug text-muted-foreground" },
                p.description,
              ),
            ]),
          ]),
          h("div", { class: "grid grid-cols-2 gap-2" }, slots.default?.()),
        ],
      ),
});

const Choice = defineComponent({
  props: { modelValue: String, value: String, label: String },
  emits: ["update:modelValue"],
  setup:
    (p, { emit }) =>
    () =>
      h(
        "button",
        {
          class: [
            "flex min-h-11 md:min-h-12 items-center justify-center rounded-lg border-2 px-3 py-2 text-center transition-all",
            p.modelValue === p.value
              ? "border-primary bg-secondary text-primary"
              : "border-border text-foreground hover:border-primary hover:bg-muted",
          ],
          onClick: () => emit("update:modelValue", p.value),
        },
        [
          h(
            "div",
            { class: "font-display text-sm md:text-base text-foreground" },
            p.label,
          ),
        ],
      ),
});

const MenuButton = defineComponent({
  props: { label: String, description: String, danger: Boolean },
  emits: ["click"],
  setup:
    (p, { emit }) =>
    () =>
      h(
        "button",
        {
          class: [
            "w-full min-h-14 flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted text-left transition-colors",
            p.danger ? "text-destructive" : "text-foreground",
          ],
          onClick: () => emit("click"),
        },
        [
          h("span", { class: "min-w-0" }, [
            h("span", { class: "block font-display" }, p.label),
            p.description
              ? h(
                  "span",
                  { class: "block text-sm text-muted-foreground" },
                  p.description,
                )
              : null,
          ]),
          h(ChevronRight, { class: "w-5 h-5 shrink-0 text-muted-foreground" }),
        ],
      ),
});
</script>
