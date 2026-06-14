export type Theme = "light" | "dark";

const THEME_KEY = "mwasalaty:theme";
const LEGACY_THEME_KEY = "mwasalaty-op:theme";
const THEME_COLOR = { light: "#f8fafc", dark: "#020617" } as const;

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY) ?? window.localStorage.getItem(LEGACY_THEME_KEY);
  return isTheme(stored) ? stored : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  window.localStorage.setItem(THEME_KEY, theme);
  window.localStorage.removeItem(LEGACY_THEME_KEY);
}

export function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
