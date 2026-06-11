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

export type TransitRoute = Record<string, unknown> & {
  id?: string;
  short_name?: string;
  long_name?: string;
  mode?: string;
};

export type TransitStop = Record<string, unknown> & {
  id?: string;
  name?: string;
  lat?: number;
  lon?: number;
  lng?: number;
};

export type RouteSearch = Record<string, unknown> & {
  id?: string;
  plan_id?: string;
  from_label?: string;
  to_label?: string;
  date?: string;
  time?: string;
  optimized_for?: string;
  total_routes?: number;
  search_count?: number;
  created_at?: string;
  latest_created_at?: string;
  itineraries?: unknown;
  latest_itineraries?: unknown;
};

export type DashboardStats = {
  totals: {
    users: number;
    blockedUsers?: number;
    transitRoutes: number;
    transitStops: number;
    routeSearches: number;
    tickets: number;
    activeTickets?: number;
    refundIssues?: number;
    supportTickets?: number;
    openSupportTickets?: number;
  };
  routeSearchesByDay: Array<{ date: string; count: number }>;
  transitRoutesByMode: Array<{ mode: string; count: number }>;
  ticketsByStatus: Array<{ status: string; count: number }>;
  topSearchedRoutes: Array<{ from_label?: string; to_label?: string; search_count: number }>;
  recentRouteSearches: Array<{ from_label?: string; to_label?: string; created_at?: string; total_routes?: number }>;
};

export type AdminTicket = Record<string, unknown> & {
  id: string;
  ticketId: string;
  userId?: string;
  userName?: string;
  route?: string;
  from?: string;
  to?: string;
  status?: string;
  paymentStatus?: string;
  refundStatus?: string | null;
  created_at?: string;
  valid_until?: string;
  raw?: unknown;
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
  adminReply?: string;
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

export async function replySupportTicket(id: string, reply: string) {
  const data = await adminFetch(`/api/admin/support/tickets/${encodeURIComponent(id)}/reply`, {
    method: "POST",
    body: JSON.stringify({ reply }),
  });
  return data.ticket as SupportTicket;
}

export async function listAdminTickets() {
  const data = await adminFetch("/api/admin/tickets");
  return (data.tickets ?? []) as AdminTicket[];
}

export async function getAdminTicket(id: string) {
  const data = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}`);
  return data.ticket as AdminTicket;
}

export async function activateAdminTicket(id: string) {
  const data = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}/activate`, { method: "POST" });
  return data.ticket as AdminTicket;
}

export async function markAdminTicketRefunded(id: string) {
  const data = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}/mark-refunded`, { method: "POST" });
  return data.ticket as AdminTicket;
}

export async function markAdminTicketRefundFailed(id: string) {
  const data = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}/refund-failed`, { method: "POST" });
  return data.ticket as AdminTicket;
}

export async function listTransitRoutes() {
  const data = await adminFetch("/api/admin/transit/routes");
  return (data.routes ?? []) as TransitRoute[];
}

export async function listTransitStops() {
  const data = await adminFetch("/api/admin/transit/stops");
  return (data.stops ?? []) as TransitStop[];
}

export async function listRouteSearches() {
  const data = await adminFetch("/api/admin/routes/searches");
  return (data.searches ?? []) as RouteSearch[];
}

export async function getDashboardStats() {
  return (await adminFetch("/api/admin/dashboard/stats")) as DashboardStats;
}
