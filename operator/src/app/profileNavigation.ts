import type { ScannerProfile } from "@/services/api";

export function profileRouteRedirect(
  routeName: unknown,
  query: Record<string, unknown>,
  profile: ScannerProfile | null,
  online: boolean
): { name: string } | null {
  const changingProfile = routeName === "profile-select" && query.change === "1";
  const globalFallback = routeName === "account" && query.fallback === "error";

  if (routeName !== "profile-select" && !profile && !globalFallback) {
    return { name: "profile-select" };
  }

  if (routeName === "profile-select" && profile && !changingProfile) {
    return { name: online ? "dashboard" : "scan" };
  }

  return null;
}
