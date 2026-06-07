import { db } from "@/db/appDb";

export type AppLanguage = "en" | "ar";

const LANGUAGE_KEY = "mwasalaty:language";
const SETTINGS_LANGUAGE_KEY = "language";

export async function getSavedLanguage(): Promise<AppLanguage> {
  try {
    const setting = await db.settings.get(SETTINGS_LANGUAGE_KEY);
    if (setting) return normalizeLanguage(setting.value);
  } catch {
    // Fall through to the synchronous fallback below.
  }

  return getFallbackLanguage();
}

export function getFallbackLanguage(): AppLanguage {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));
  } catch {
    return "en";
  }
}

export async function setSavedLanguage(language: AppLanguage) {
  try {
    await db.settings.put({
      key: SETTINGS_LANGUAGE_KEY,
      value: language,
      updatedAt: Date.now(),
    });
  } catch {
    // localStorage fallback below still persists in browsers without IndexedDB.
  }

  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // The document direction still applies for the current page session.
  }
}

export function applyLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
}

export async function changeLanguage(language: AppLanguage) {
  applyLanguage(language);
  await setSavedLanguage(language);
}

export function normalizeLanguage(value: unknown): AppLanguage {
  return value === "ar" ? "ar" : "en";
}
