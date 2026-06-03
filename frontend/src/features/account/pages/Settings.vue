<template>
  <main class="min-h-screen pb-20 bg-background">
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
      <h1 class="font-display text-3xl text-foreground mb-3">Settings</h1>
      <p class="text-muted-foreground mb-8">
        Manage your app preferences and account
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section class="lg:col-span-2 space-y-6">
          <Card title="Appearance & Language">
            <SettingGroup label="Language" :icon="Globe">
              <Choice v-model="language" value="en" label="English" />
              <Choice v-model="language" value="ar" label="Arabic" />
            </SettingGroup>
            <SettingGroup label="Theme" :icon="Moon">
              <Choice v-model="theme" value="light" label="Light" />
              <Choice v-model="theme" value="dark" label="Dark" />
            </SettingGroup>
          </Card>

          <Card title="Notifications">
            <div
              class="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div class="flex items-center gap-3">
                <Bell class="w-5 h-5 text-primary" />
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
                  'w-12 h-6 rounded-full transition-all',
                  notifications ? 'bg-success' : 'bg-border',
                ]"
                @click="notifications = !notifications"
              >
                <div
                  :class="[
                    'w-5 h-5 bg-card rounded-full transition-all',
                    notifications ? 'translate-x-6' : 'translate-x-1',
                  ]"
                />
              </button>
            </div>
          </Card>

          <Card title="Data & Storage">
            <button
              class="w-full flex items-center justify-between p-4 border-2 border-border rounded-lg hover:border-primary"
            >
              <span class="flex items-center gap-3">
                <Trash2 class="w-5 h-5 text-destructive" /> Clear Offline Data
              </span>
              <ChevronRight class="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </section>

        <aside class="space-y-6">
          <Card title="Account">
            <MenuButton
              label="Profile Settings"
              @click="router.push('/profile')"
            />
            <MenuButton danger label="Logout" @click="logoutModalOpen = true" />
          </Card>
          <Card title="Privacy & Legal">
            <MenuButton label="Privacy Policy" />
            <MenuButton label="Terms of Service" />
          </Card>
          <Card title="Help & Support">
            <MenuButton
              label="Contact Support"
              @click="router.push('/support')"
            />
          </Card>

          <section
            class="bg-card rounded-xl p-6 border-2 border-border text-center text-sm text-muted-foreground"
          >
            Mwasalaty v1.0.0<br />2024 All rights reserved
          </section>
        </aside>
      </div>
    </div>

    <Modal
      :open="logoutModalOpen"
      title="Logout"
      @close="logoutModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-muted-foreground">Are you sure you want to logout?</p>
        <div class="flex gap-3">
          <AppButton
            variant="danger"
            class="flex-1"
            @click="router.push('/auth')"
            >Logout</AppButton
          >
          <AppButton
            variant="outline"
            class="flex-1"
            @click="logoutModalOpen = false"
            >Cancel</AppButton
          >
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { useRouter } from "vue-router";
import { Bell, ChevronRight, Globe, Moon, Trash2 } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import Modal from "@/components/ui/Modal.vue";

const router = useRouter();
const language = ref<"en" | "ar">("en");
const theme = ref<"light" | "dark">("light");
const notifications = ref(true);
const logoutModalOpen = ref(false);

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

const SettingGroup = defineComponent({
  props: { label: String, icon: { type: [Object, Function], required: true } },
  setup:
    (p, { slots }) =>
    () =>
      h("div", { class: "mb-6 last:mb-0" }, [
        h(
          "label",
          {
            class: "flex items-center gap-2 text-foreground mb-3 font-display",
          },
          [h(p.icon as any, { class: "w-5 h-5 text-primary" }), p.label],
        ),
        h("div", { class: "grid grid-cols-2 gap-3" }, slots.default?.()),
      ]),
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
            "p-4 rounded-lg border-2 transition-all",
            p.modelValue === p.value
              ? "border-primary bg-secondary"
              : "border-border hover:border-primary",
          ],
          onClick: () => emit("update:modelValue", p.value),
        },
        [h("div", { class: "font-display text-foreground" }, p.label)],
      ),
});

const MenuButton = defineComponent({
  props: { label: String, danger: Boolean },
  emits: ["click"],
  setup:
    (p, { emit }) =>
    () =>
      h(
        "button",
        {
          class: [
            "w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted",
            p.danger ? "text-destructive" : "text-foreground",
          ],
          onClick: () => emit("click"),
        },
        [p.label, h(ChevronRight, { class: "w-5 h-5 text-muted-foreground" })],
      ),
});
</script>
