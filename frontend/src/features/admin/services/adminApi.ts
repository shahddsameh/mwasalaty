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
  const currentToken = token();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${currentToken}`,
    ...(init.headers ?? {}),
  };
  
  // Log request details for debugging
  console.log(`[adminFetch] ${init.method ?? "GET"} ${path}`, {
    hasToken: !!currentToken,
    tokenLength: currentToken.length,
  });
  
  const res = await fetch(path, {
    ...init,
    headers,
  });
  
  const data = await res.json().catch(() => null);
  
  // Log response details
  console.log(`[adminFetch] Response: ${res.status} ${res.statusText}`, {
    url: res.url,
    contentType: res.headers.get("content-type"),
    data,
  });
  
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    throw new Error(data?.error?.message ?? "Admin session expired. Sign in again.");
  }
  if (!res.ok) {
    const errorMsg = data?.error?.message ?? data?.message ?? `Admin request failed (${res.status}).`;
    console.error(`[adminFetch] Error: ${errorMsg}`, { path, status: res.status, url: res.url });
    throw new Error(errorMsg);
  }
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

// Support Tickets
export type SupportTicket = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getSupportTickets() {
  const data = await adminFetch("/api/admin/support/tickets");
  return (data.tickets ?? []) as SupportTicket[];
}

export async function getSupportTicket(id: string) {
  const data = await adminFetch(`/api/admin/support/tickets/${encodeURIComponent(id)}`);
  return data.ticket as SupportTicket;
}

export async function updateSupportTicket(id: string, updates: Partial<SupportTicket>) {
  const data = await adminFetch(`/api/admin/support/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return data.ticket as SupportTicket;
}
