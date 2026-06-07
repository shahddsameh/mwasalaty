import { ref } from "vue";

const SESSION_KEY = "mwasalaty-admin:token";
export type AdminSession = { token: string; expiresAt: string };
export const sessionRevision = ref(0);

export function getSession(): AdminSession | null {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as AdminSession | null;
  } catch {
    return null;
  }
}
export function getToken(): string | null { return getSession()?.token ?? null; }
export function setSession(session: AdminSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  sessionRevision.value += 1;
}
export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  sessionRevision.value += 1;
}
export function isAuthenticated(): boolean {
  const session = getSession();
  return Boolean(session?.token && Date.parse(session.expiresAt) > Date.now());
}
