import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./app/App.vue";
import router from "./app/router";
import "./styles/index.css";
import { i18n, setI18nLanguage } from "./i18n";
import { ensureAuthInitialized } from "./services/authState";
import { getSavedLanguage } from "./services/language";
import { applyTheme, getSavedTheme } from "./services/theme";
import { initializeSyncService } from "./core/offline/syncService";
import { initializeCacheManager } from "./core/offline/cacheManager";

applyTheme(getSavedTheme());

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);

void (async () => {
  setI18nLanguage(await getSavedLanguage());
  await ensureAuthInitialized();
  
  // Initialize offline-first infrastructure
  initializeSyncService();
  initializeCacheManager();
  
  app.mount("#root");
})();
