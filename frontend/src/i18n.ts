import { createI18n } from "vue-i18n";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import {
  applyLanguage,
  getFallbackLanguage,
  type AppLanguage,
} from "./services/language";

export const i18n = createI18n({
  legacy: false,
  locale: getFallbackLanguage(),
  fallbackLocale: "en",
  messages: {
    en,
    ar,
  },
});

export function setI18nLanguage(language: AppLanguage) {
  i18n.global.locale.value = language;
  applyLanguage(language);
}
