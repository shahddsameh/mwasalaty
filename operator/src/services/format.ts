import type { ScannerProfile, TicketLeg } from "@/services/api";
import type { Outcome } from "@/services/outcome";
import { routeShortName } from "@/features/results/candidateLegs";
import { getCurrentLocale, type Locale } from "@/i18n";

export function displayMode(mode?: string | null, locale: Locale = getCurrentLocale()): string {
  if (mode === "SUBWAY") return locale === "ar" ? "مترو" : "Subway";
  if (mode === "BUS") return locale === "ar" ? "حافلة" : "Bus";
  return mode ?? "-";
}

export function displayProfile(profile: ScannerProfile | null, locale: Locale = getCurrentLocale()): string {
  if (!profile) return "-";
  const localizedLabel = locale === "ar" ? profile.labelAr : profile.label;
  if (localizedLabel) return localizedLabel;
  const route = profile.routeShortName ? ` ${profile.routeShortName}` : "";
  return `${displayMode(profile.mode, locale)}${route}`;
}

export function displayLeg(leg?: TicketLeg | null): string {
  if (!leg) return "-";
  const route = routeShortName(leg);
  const endpoints = [leg.from?.name, leg.to?.name].filter(Boolean).join(" -> ");
  return [displayMode(leg.mode), route, endpoints].filter(Boolean).join(" / ");
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(date);
}

export function formatDuration(start?: string | null, end?: string | null): string {
  if (!start) return "-";
  const from = new Date(start).getTime();
  const to = end ? new Date(end).getTime() : Date.now();
  if (Number.isNaN(from) || Number.isNaN(to)) return "-";
  const minutes = Math.max(0, Math.round((to - from) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

export function outcomeTone(outcome: Outcome): string {
  const tones: Record<Outcome, string> = {
    valid: "bg-success-soft text-success",
    already_used: "bg-warning-soft text-warning",
    invalid: "bg-danger-soft text-destructive",
    no_match: "bg-muted text-foreground",
    ambiguous: "bg-primary-soft text-primary-hover",
    unverified: "bg-muted text-muted-foreground"
  };
  return tones[outcome];
}
