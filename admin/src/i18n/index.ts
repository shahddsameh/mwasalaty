import { createI18n } from "vue-i18n";
import ar from "@/i18n/ar";
import en from "@/i18n/en";

export type Locale = "ar" | "en";
const LOCALE_KEY = "mwasalaty-admin:locale";

export const i18n = createI18n({ legacy: false, locale: "ar", fallbackLocale: "en", messages: { ar, en } });

export function getStoredLocale(): Locale {
  const stored = window.localStorage.getItem(LOCALE_KEY);
  return stored === "en" || stored === "ar" ? stored : "ar";
}

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  window.localStorage.setItem(LOCALE_KEY, locale);
}

export function getCurrentLocale(): Locale {
  return i18n.global.locale.value as Locale;
}
