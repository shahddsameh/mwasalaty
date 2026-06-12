import type { ScannerProfile } from "@/services/api";
import { OUTCOMES, type Outcome } from "@/services/outcome";

const PROFILE_KEY = "mwasalaty-op:profile";
const SESSION_KEY = "mwasalaty-op:session";

export type OperatorSession = {
  selectedProfileId: string;
  startedAt: string;
  tally: Record<Outcome, number>;
  endedAt: string | null;
};

let selectedProfileCache: ScannerProfile | null | undefined;
let sessionCache: OperatorSession | null | undefined;

function hasStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function emptyTally(): Record<Outcome, number> {
  return OUTCOMES.reduce(
    (acc, outcome) => ({ ...acc, [outcome]: 0 }),
    {} as Record<Outcome, number>
  );
}

function readJson<T>(key: string): T | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
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

export function getSelectedProfile(): ScannerProfile | null {
  if (selectedProfileCache !== undefined) return selectedProfileCache;
  selectedProfileCache = readJson<ScannerProfile>(PROFILE_KEY);
  return selectedProfileCache;
}

export function setSelectedProfile(profile: ScannerProfile): void {
  selectedProfileCache = profile;
  writeJson(PROFILE_KEY, profile);
}

export function clearSelectedProfile(): void {
  selectedProfileCache = null;
  writeJson(PROFILE_KEY, null);
}

export function getSession(): OperatorSession | null {
  if (sessionCache !== undefined) return sessionCache;
  sessionCache = readJson<OperatorSession>(SESSION_KEY);
  return sessionCache;
}

export function startShift(): OperatorSession {
  const profile = getSelectedProfile();
  const existing = getSession();
  if (existing && !existing.endedAt && existing.selectedProfileId === profile?.scannerProfileId) {
    return existing;
  }

  const session: OperatorSession = {
    selectedProfileId: profile?.scannerProfileId ?? "",
    startedAt: new Date().toISOString(),
    tally: emptyTally(),
    endedAt: null
  };
  sessionCache = session;
  writeJson(SESSION_KEY, session);
  return session;
}

export function incrementTally(outcome: Outcome): OperatorSession {
  const current = getSession() ?? startShift();
  const next: OperatorSession = {
    ...current,
    tally: {
      ...emptyTally(),
      ...current.tally,
      [outcome]: (current.tally[outcome] ?? 0) + 1
    }
  };
  sessionCache = next;
  writeJson(SESSION_KEY, next);
  return next;
}

export function endShift(): OperatorSession | null {
  const current = getSession();
  if (!current) return null;
  const next = { ...current, endedAt: new Date().toISOString() };
  sessionCache = next;
  writeJson(SESSION_KEY, next);
  return next;
}

export function clearSessionView(): void {
  sessionCache = null;
  writeJson(SESSION_KEY, null);
  window.dispatchEvent(new CustomEvent("mwasalaty-op:clear-history"));
}
