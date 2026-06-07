const TOKEN_KEY = "mwasalaty:admin-token";

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function isAdminLoggedIn() {
  return Boolean(getAdminToken());
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminLogin(secret: string) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "Admin login failed. Check ADMIN_SECRET in backend/.env and restart backend."
        : data?.error?.message ?? data?.message ?? "Admin login failed.",
    );
  }
  setAdminToken(data.token);
  return data;
}

export async function adminLogout() {
  const token = getAdminToken();
  if (token) {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
  }
  clearAdminToken();
}
