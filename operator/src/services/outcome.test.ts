import { ApiError, type ScanValidateResult } from "@/services/api";
import { mapErrorToOutcome, mapResultToOutcome } from "@/services/outcome";

function apiError(code: string, details: Record<string, unknown> = {}) {
  return new ApiError(code, `${code} message`, details, 409);
}

describe("outcome mapper", () => {
  it("maps a successful scan to valid and carries validation details", () => {
    const result: ScanValidateResult = {
      ticketId: "ticket_123",
      ticketLegId: "ticket_leg_001",
      status: "used",
      validatedAt: "2026-06-05T08:00:00.000Z",
      validatedBy: { scannerProfileId: "scanner_bus_001" },
      remainingLegs: 2
    };

    const outcome = mapResultToOutcome(result);

    expect(outcome.kind).toBe("valid");
    expect(outcome.ticketId).toBe("ticket_123");
    expect(outcome.detail.remainingLegs).toBe(2);
  });

  it("maps LEG_ALREADY_USED to already_used and carries prior validation time", () => {
    const outcome = mapErrorToOutcome(
      apiError("LEG_ALREADY_USED", {
        ticketId: "ticket_123",
        ticketLegId: "ticket_leg_001",
        validatedAt: "2026-06-05T08:00:00.000Z"
      })
    );

    expect(outcome.kind).toBe("already_used");
    expect(outcome.detail.validatedAt).toBe("2026-06-05T08:00:00.000Z");
  });

  it.each([
    ["INVALID_QR_PAYLOAD"],
    ["TICKET_EXPIRED"],
    ["TICKET_NOT_FOUND"],
    ["LEG_ALREADY_REFUNDED"],
    ["STATION_LIMIT_EXCEEDED"],
    ["SCANNER_PROFILE_NOT_FOUND"],
    ["VALIDATION_ERROR"]
  ])("maps %s to invalid with the code preserved", (code) => {
    const outcome = mapErrorToOutcome(apiError(code, { ticketId: "ticket_123" }));

    expect(outcome.kind).toBe("invalid");
    expect(outcome.detail.code).toBe(code);
  });

  it("maps NO_MATCHING_LEG to no_match and carries scanner context", () => {
    const outcome = mapErrorToOutcome(
      apiError("NO_MATCHING_LEG", {
        scannerProfileId: "scanner_bus_14",
        mode: "BUS",
        routeShortName: "14"
      })
    );

    expect(outcome.kind).toBe("no_match");
    expect(outcome.mode).toBe("BUS");
    expect(outcome.route).toBe("14");
  });

  it("maps AMBIGUOUS_LEG_MATCH to ambiguous and carries matching leg IDs", () => {
    const outcome = mapErrorToOutcome(
      apiError("AMBIGUOUS_LEG_MATCH", {
        scannerProfileId: "scanner_bus_001",
        matchingLegIds: ["ticket_leg_001", "ticket_leg_002"]
      })
    );

    expect(outcome.kind).toBe("ambiguous");
    expect(outcome.detail.matchingLegIds).toEqual(["ticket_leg_001", "ticket_leg_002"]);
  });
});
