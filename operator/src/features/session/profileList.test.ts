import { describe, expect, it } from "vitest";
import type { ScannerProfile } from "@/services/api";
import { filterProfiles, paginateProfiles } from "@/features/session/profileList";

function profile(
  scannerProfileId: string,
  mode: "BUS" | "SUBWAY",
  routeShortName?: string,
  label = scannerProfileId,
  labelAr = scannerProfileId
): ScannerProfile {
  return {
    scannerProfileId,
    mode,
    routeShortName,
    label,
    labelAr,
    operatorId: "operator",
    deviceId: `device_${scannerProfileId}`
  };
}

const profiles = [
  profile("scanner_bus_20", "BUS", "20", "Bus Twenty", "حافلة عشرون"),
  profile("scanner_subway_001", "SUBWAY", undefined, "Subway Scanner"),
  profile("scanner_bus_3", "BUS", "3", "Bus Three"),
  profile("scanner_bus_001", "BUS", undefined, "Bus Scanner")
];

describe("profile list", () => {
  it("pins generic profiles first and naturally sorts routes", () => {
    expect(filterProfiles(profiles, "ALL", "").map((item) => item.scannerProfileId)).toEqual([
      "scanner_bus_001",
      "scanner_subway_001",
      "scanner_bus_3",
      "scanner_bus_20"
    ]);
  });

  it("filters by mode and searches route, labels, Arabic labels, and id", () => {
    expect(filterProfiles(profiles, "SUBWAY", "")).toHaveLength(1);
    expect(filterProfiles(profiles, "ALL", "20")).toHaveLength(1);
    expect(filterProfiles(profiles, "ALL", "Twenty")).toHaveLength(1);
    expect(filterProfiles(profiles, "ALL", "عشرون")).toHaveLength(1);
    expect(filterProfiles(profiles, "ALL", "scanner_bus_3")).toHaveLength(1);
  });

  it("paginates the filtered profiles", () => {
    expect(paginateProfiles(filterProfiles(profiles, "ALL", ""), 2, 2).map((item) => item.scannerProfileId)).toEqual([
      "scanner_bus_3",
      "scanner_bus_20"
    ]);
  });
});
