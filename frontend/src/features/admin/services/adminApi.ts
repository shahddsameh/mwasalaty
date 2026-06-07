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
