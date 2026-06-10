import { describe, expect, it } from "vitest";
import { displayProfile } from "@/services/format";
import type { ScannerProfile } from "@/services/api";

const profile: ScannerProfile = {
  scannerProfileId: "scanner_bus_108",
  label: "Bus 108 - Long route name",
  labelAr: "حافلة 108",
  mode: "BUS",
  routeShortName: "108",
  operatorId: "operator_bus_001",
  deviceId: "scanner_web_108"
};

describe("displayProfile", () => {
  it("uses the profile label for the requested locale", () => {
    expect(displayProfile(profile, "en")).toBe("Bus 108 - Long route name");
    expect(displayProfile(profile, "ar")).toBe("حافلة 108");
  });
});
