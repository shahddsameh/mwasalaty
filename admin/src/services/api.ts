import { clearSession, getToken } from "@/services/session";

export type PlaceType = "stop" | "station";
export type PlaceStatus = "active" | "inactive";
export type CatalogPlace = {
  id: string; type: PlaceType; name: string; aliases: string[];
  location: { lat: number; lng: number }; routeIds: string[]; status: PlaceStatus;
  line?: string; createdAt: string; updatedAt: string;
};
export type PlaceInput = Omit<CatalogPlace, "id" | "createdAt" | "updatedAt">;
export type Route = { routeId: string; mode: "BUS" | "SUBWAY"; shortName: string; longName: string };
export type PlaceWarning = { code: "POSSIBLE_DUPLICATE" | "OUT_OF_COVERAGE"; message: string; details: { conflictId?: string } };
export type DashboardSummary = {
  totals: { stops: number; stations: number; total: number };
  byLine: Record<string, number>;
  activeInactive: { active: number; inactive: number };
  recent: Pick<CatalogPlace, "id" | "type" | "name" | "status" | "updatedAt">[];
};

export class ApiError extends Error {
  constructor(public code: string, message: string, public details: unknown = {}, public status = 0) {
    super(message);
    this.name = "ApiError";
  }
}

let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: () => void): void { unauthorizedHandler = handler; }

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers }
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.");
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string; details?: unknown } };
  if (!response.ok) {
    const error = new ApiError(body.error?.code ?? "REQUEST_FAILED", body.error?.message ?? `Request failed (${response.status})`, body.error?.details, response.status);
    if (response.status === 401 || error.code === "ADMIN_UNAUTHORIZED") {
      clearSession();
      unauthorizedHandler?.();
    }
    throw error;
  }
  return body as T;
}

export const login = (secret: string) => request<{ token: string; expiresAt: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ secret }) });
export const logout = () => request<void>("/api/admin/logout", { method: "POST" });
export const listPlaces = (params: { type?: PlaceType; includeInactive?: boolean } = {}) => {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.includeInactive !== undefined) query.set("includeInactive", String(params.includeInactive));
  return request<{ places: CatalogPlace[] }>(`/api/admin/places?${query}`);
};
export const getPlace = (id: string) => request<{ place: CatalogPlace }>(`/api/admin/places/${encodeURIComponent(id)}`);
export const createPlace = (body: PlaceInput) => request<{ place: CatalogPlace; warnings: PlaceWarning[] }>("/api/admin/places", { method: "POST", body: JSON.stringify(body) });
export const updatePlace = (id: string, body: PlaceInput) => request<{ place: CatalogPlace; warnings: PlaceWarning[] }>(`/api/admin/places/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
export const deletePlace = (id: string) => request<{ deleted: true; id: string }>(`/api/admin/places/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getRoutes = () => request<{ routes: Route[] }>("/api/admin/routes");
export const getDashboard = () => request<DashboardSummary>("/api/admin/dashboard");
