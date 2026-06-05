export type AppTheme = "light" | "dark";

const THEME_KEY = "mwasalaty:theme";

export function getSavedTheme(): AppTheme {
  try {
    return normalizeTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return "light";
  }
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The visual theme still applies for the current page session.
  }
}

export function normalizeTheme(value: unknown): AppTheme {
  return value === "dark" ? "dark" : "light";
}
