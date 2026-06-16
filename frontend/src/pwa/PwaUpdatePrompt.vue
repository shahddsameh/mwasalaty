<template>
  <div
    v-if="showInstallPrompt"
    class="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl lg:bottom-6"
  >
    <div class="flex items-center gap-3">
      <img
        src="/icons/mwasalaty-app-icon.png"
        alt="Mwasalaty logo"
        class="h-12 w-12 shrink-0 object-contain"
      />
      <div class="min-w-0 flex-1">
        <p class="font-display text-base font-bold">Install Mwasalaty</p>
        <p class="text-sm text-muted-foreground">
          Add it to your home screen for faster access.
        </p>
      </div>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <button
        type="button"
        class="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        @click="dismissInstallPrompt"
      >
        Not now
      </button>
      <button
        type="button"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        @click="installApp"
      >
        Download
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRegisterSW } from "virtual:pwa-register/vue";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_DISMISSED_KEY = "mwasalaty:pwa-install-dismissed";

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
});

const deferredInstallPrompt = ref<BeforeInstallPromptEvent | null>(null);
const installDismissed = ref(false);
const appInstalled = ref(false);
const isStandalone = ref(false);
const showInstallPrompt = computed(
  () =>
    Boolean(deferredInstallPrompt.value) &&
    !installDismissed.value &&
    !appInstalled.value &&
    !isStandalone.value,
);

watch(needRefresh, (refreshAvailable) => {
  if (refreshAvailable) void updateServiceWorker(true);
});

function updateStandaloneState() {
  isStandalone.value =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function handleBeforeInstallPrompt(event: Event) {
  event.preventDefault();
  deferredInstallPrompt.value = event as BeforeInstallPromptEvent;
}

function handleAppInstalled() {
  appInstalled.value = true;
  deferredInstallPrompt.value = null;
}

function dismissInstallPrompt() {
  installDismissed.value = true;
  try {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  } catch {
    // The prompt can reappear on a later page load if session storage is blocked.
  }
}

async function installApp() {
  const promptEvent = deferredInstallPrompt.value;
  if (!promptEvent) return;

  deferredInstallPrompt.value = null;
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  if (choice.outcome !== "accepted") dismissInstallPrompt();
}

onMounted(() => {
  updateStandaloneState();
  try {
    installDismissed.value = sessionStorage.getItem(INSTALL_DISMISSED_KEY) === "true";
  } catch {
    installDismissed.value = false;
  }

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
});

onUnmounted(() => {
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.removeEventListener("appinstalled", handleAppInstalled);
});
</script>
