import { clearAdminToken, getAdminToken } from "./adminAuth";

export type AdminPlace = {
  id: string;
  name: string;
  type: "stop" | "station";
  aliases?: string[];
  location: { lat: number; lng: number };
  routeIds: string[];
  line?: string;
  status: "active" | "inactive";
};

export type Dashboard = {
  totals: { stops: number; stations: number; total: number };
  activeInactive: { active: number; inactive: number };
};
export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  last_sign_in_at?: string;
  status: "active" | "blocked";
};
export type RouteSearch = {
  id?: string;
  plan_id: string;
  from_label: string | null;
  to_label: string | null;
  date: string;
  time: string;
  optimized_for: string;
  total_routes: number;
  itineraries?: unknown;
  created_at?: string;
};

async function adminFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAdminToken()}`,
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (res.status === 401) {
    clearAdminToken();
    throw new Error("Admin session expired. Sign in again with ADMIN_SECRET.");
  }
  if (!res.ok) throw new Error(data?.error?.message ?? data?.message ?? `Admin request failed (${res.status}).`);
  return data;
}

export async function getDashboard(): Promise<Dashboard> {
  return adminFetch("/api/admin/dashboard");
}

export async function listPlaces(type: "stop" | "station") {
  const data = await adminFetch(`/api/admin/places?type=${type}`);
  return (data.places ?? []) as AdminPlace[];
}

export async function createPlace(place: Partial<AdminPlace>) {
  return adminFetch("/api/admin/places", { method: "POST", body: JSON.stringify(place) });
}

export async function updatePlace(id: string, place: Partial<AdminPlace>) {
  return adminFetch(`/api/admin/places/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(place) });
}

export async function deletePlace(id: string) {
  return adminFetch(`/api/admin/places/${encodeURIComponent(id)}`, { method: "DELETE" });
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

export async function listRouteSearches() {
  const data = await adminFetch("/api/admin/routes");
  return (data.routes ?? []) as RouteSearch[];
}
