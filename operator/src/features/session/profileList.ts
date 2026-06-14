import type { ScannerMode, ScannerProfile } from "@/services/api";

export type ProfileModeFilter = "ALL" | ScannerMode;

const routeCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base"
});

function isGeneric(profile: ScannerProfile): boolean {
  return !profile.routeShortName;
}

export function sortProfiles(profiles: ScannerProfile[]): ScannerProfile[] {
  return [...profiles].sort((a, b) => {
    const genericOrder = Number(isGeneric(b)) - Number(isGeneric(a));
    if (genericOrder !== 0) return genericOrder;

    const modeOrder = a.mode.localeCompare(b.mode);
    if (modeOrder !== 0) return modeOrder;

    return routeCollator.compare(
      a.routeShortName ?? a.scannerProfileId,
      b.routeShortName ?? b.scannerProfileId
    );
  });
}

export function filterProfiles(
  profiles: ScannerProfile[],
  mode: ProfileModeFilter,
  query: string
): ScannerProfile[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return sortProfiles(
    profiles.filter((profile) => {
      if (mode !== "ALL" && profile.mode !== mode) return false;
      if (!normalizedQuery) return true;

      return [
        profile.routeShortName,
        profile.label,
        profile.labelAr,
        profile.scannerProfileId
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
    })
  );
}

export function paginateProfiles(
  profiles: ScannerProfile[],
  page: number,
  pageSize: number
): ScannerProfile[] {
  const start = Math.max(0, page - 1) * pageSize;
  return profiles.slice(start, start + pageSize);
}
