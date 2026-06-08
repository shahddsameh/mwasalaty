const TOKEN_KEY = "mwasalaty:admin-token";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  last_sign_in_at?: string;
  status: "active" | "blocked";
};

function token() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    throw new Error(data?.error?.message ?? "Admin session expired. Sign in again.");
  }
  if (!res.ok) throw new Error(data?.error?.message ?? data?.message ?? `Admin request failed (${res.status}).`);
  return data;
}

export async function adminLogin(secret: string) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message ?? data?.message ?? "Admin login failed.");
  localStorage.setItem(TOKEN_KEY, data.token);
}

export async function adminLogout() {
  const currentToken = token();
  if (currentToken) {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${currentToken}` },
    }).catch(() => null);
  }
  localStorage.removeItem(TOKEN_KEY);
}

export async function listUsers() {
  const data = await adminFetch("/api/admin/users");
  return (data.users ?? []) as AdminUser[];
}

export async function updateUser(id: string, user: Partial<AdminUser>) {
  const data = await adminFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(user),
  });
  return data.user as AdminUser;
}

export async function blockUser(id: string) {
  const data = await adminFetch(`/api/admin/users/${encodeURIComponent(id)}/block`, { method: "POST" });
  return data.user as AdminUser;
}

export async function unblockUser(id: string) {
  const data = await adminFetch(`/api/admin/users/${encodeURIComponent(id)}/unblock`, { method: "POST" });
  return data.user as AdminUser;
}
