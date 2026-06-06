import type { ScanOutcome } from "@/services/outcome";

const LATEST_KEY = "mwasalaty-op:latest-outcome";
const HISTORY_KEY = "mwasalaty-op:history";

function hasStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T | null) {
  if (!hasStorage()) return;
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function setLatestOutcome(outcome: ScanOutcome): void {
  writeJson(LATEST_KEY, outcome);
  recordScanOutcome(outcome);
}

export function getLatestOutcome(): ScanOutcome | null {
  return readJson<ScanOutcome | null>(LATEST_KEY, null);
}

export function recordScanOutcome(outcome: ScanOutcome): void {
  const history = getHistory();
  writeJson(HISTORY_KEY, [outcome, ...history].slice(0, 300));
  window.dispatchEvent(new CustomEvent("mwasalaty-op:history-change"));
}

export function getHistory(): ScanOutcome[] {
  return readJson<ScanOutcome[]>(HISTORY_KEY, []);
}

export function clearHistory(): void {
  writeJson(HISTORY_KEY, []);
  writeJson(LATEST_KEY, null);
  window.dispatchEvent(new CustomEvent("mwasalaty-op:history-change"));
}

if (typeof window !== "undefined") {
  window.addEventListener("mwasalaty-op:clear-history", clearHistory);
}
