import { createApp } from "vue";
import App from "@/app/App.vue";
import { router } from "@/app/router";
import { getStoredLocale, i18n, setLocale } from "@/i18n";
import "@/styles.css";

setLocale(getStoredLocale());
createApp(App).use(router).use(i18n).mount("#app");
