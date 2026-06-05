import { createApp } from "vue";
import App from "@/app/App.vue";
import { router } from "@/app/router";
import { getStoredLocale, i18n, setLocale } from "@/i18n";
import { installSyncOnReconnect } from "@/services/sync";
import { getStoredTheme, setTheme } from "@/services/theme";
import "@/styles/index.css";

setLocale(getStoredLocale());
setTheme(getStoredTheme());
installSyncOnReconnect();

createApp(App).use(router).use(i18n).mount("#app");
