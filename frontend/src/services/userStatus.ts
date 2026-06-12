import { getCurrentSession, signOut } from "./supabaseAuth";
import { clearAuthState } from "./authState";

export type UserStatus = {
  blocked: boolean;
  reason?: string;
};

export async function getUserStatus(): Promise<UserStatus> {
  try {
    const session = await getCurrentSession();
    if (!session?.access_token) return { blocked: false };

    const response = await fetch("/api/me/status", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return { blocked: false };

    const data = await response.json().catch(() => null);
    return { blocked: data?.blocked === true, reason: data?.reason };
  } catch {
    return { blocked: false };
  }
}

export async function logoutBlockedUser() {
  await signOut();
  clearAuthState();
}
