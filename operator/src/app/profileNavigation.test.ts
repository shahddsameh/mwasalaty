import { describe, expect, it } from "vitest";
import type { ScannerProfile } from "@/services/api";
import { profileRouteRedirect } from "@/app/profileNavigation";

const profile = {
  scannerProfileId: "scanner_bus_001",
  mode: "BUS",
  operatorId: "operator_bus_001",
  deviceId: "scanner_web_demo_bus"
} satisfies ScannerProfile;

describe("profile navigation", () => {
  it("redirects a selected operator from normal profile selection", () => {
    expect(profileRouteRedirect("profile-select", {}, profile, true)).toEqual({ name: "dashboard" });
  });

  it("allows explicit scanner changes", () => {
    expect(profileRouteRedirect("profile-select", { change: "1" }, profile, true)).toBeNull();
  });

  it("requires profile selection when no scanner is stored", () => {
    expect(profileRouteRedirect("dashboard", {}, null, true)).toEqual({ name: "profile-select" });
  });
});
