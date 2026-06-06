import type { ScannerProfile, Ticket, TicketLeg } from "@/services/api";

export function routeShortName(leg: TicketLeg): string | null {
  if (typeof leg.route === "string") return leg.route;
  return leg.route?.shortName ?? null;
}

function normalizeMode(mode: string): string {
  return mode === "METRO" ? "SUBWAY" : mode;
}

function normalizeRoute(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, " ");
  const lineMatch = normalized.match(/^(?:METRO\s+)?LINE\s*(\d+)$/);
  if (lineMatch) return `M${lineMatch[1]}`;
  const spacedMetroMatch = normalized.match(/^M\s*(\d+)$/);
  if (spacedMetroMatch) return `M${spacedMetroMatch[1]}`;
  return normalized;
}

export function selectCandidateLegs(
  ticket: Ticket,
  profile: ScannerProfile,
  matchingLegIds?: string[]
): TicketLeg[] {
  const idFilter = matchingLegIds?.length ? new Set(matchingLegIds) : null;

  return ticket.legs.filter((leg) => {
    if (leg.mode === "WALK") return false;
    if (leg.status !== "unused") return false;
    if (normalizeMode(leg.mode) !== normalizeMode(profile.mode)) return false;
    if (profile.routeShortName && normalizeRoute(routeShortName(leg)) !== normalizeRoute(profile.routeShortName)) return false;
    if (idFilter && !idFilter.has(leg.ticketLegId)) return false;
    return true;
  });
}
