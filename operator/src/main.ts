import { createApp } from "vue";
import App from "@/app/App.vue";
import { router } from "@/app/router";
import { i18n, setLocale } from "@/i18n";
import { installSyncOnReconnect } from "@/services/sync";
import "@/styles/index.css";

setLocale("ar");
installSyncOnReconnect();

createApp(App).use(router).use(i18n).mount("#app");
