import { createI18n } from "vue-i18n";
import ar from "@/i18n/ar";
import en from "@/i18n/en";

export type Locale = "ar" | "en";

export const i18n = createI18n({
  legacy: false,
  locale: "ar",
  fallbackLocale: "en",
  messages: { ar, en }
});

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export function getCurrentLocale(): Locale {
  return i18n.global.locale.value as Locale;
}
