import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./app/App.vue";
import router from "./app/router";
import "./styles/index.css";
import { applyTheme, getSavedTheme } from "./services/theme";
import { ensureAuthInitialized } from "./services/authState";

applyTheme(getSavedTheme());

const app = createApp(App);
app.use(createPinia());
app.use(router);
void (async () => {
  await ensureAuthInitialized();
  app.mount("#root");
})();
