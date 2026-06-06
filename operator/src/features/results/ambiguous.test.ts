import { selectCandidateLegs } from "@/features/results/candidateLegs";
import type { ScannerProfile, Ticket } from "@/services/api";

const profile: ScannerProfile = {
  scannerProfileId: "scanner_bus_14",
  label: "Bus 14",
  operatorId: "operator_bus_001",
  deviceId: "device_001",
  mode: "BUS",
  routeShortName: "14"
};

function ticketWithLegs(legs: Ticket["legs"]): Ticket {
  return {
    ticketId: "ticket_123",
    status: "active",
    legs
  };
}

describe("ambiguous candidate leg selection", () => {
  it("returns only unused legs matching mode and route", () => {
    const ticket = ticketWithLegs([
      { ticketLegId: "ticket_leg_001", mode: "BUS", route: { shortName: "14" }, status: "unused", fareAmount: 5 },
      { ticketLegId: "ticket_leg_002", mode: "BUS", route: { shortName: "108" }, status: "unused", fareAmount: 5 },
      { ticketLegId: "ticket_leg_003", mode: "SUBWAY", status: "unused", fareAmount: 5 },
      { ticketLegId: "ticket_leg_004", mode: "BUS", route: { shortName: "14" }, status: "used", fareAmount: 5 }
    ]);

    expect(selectCandidateLegs(ticket, profile).map((leg) => leg.ticketLegId)).toEqual(["ticket_leg_001"]);
  });

  it("excludes WALK legs even when unused", () => {
    const genericProfile = { ...profile, routeShortName: undefined };
    const ticket = ticketWithLegs([
      { ticketLegId: "ticket_leg_001", mode: "WALK", status: "unused", fareAmount: 0 },
      { ticketLegId: "ticket_leg_002", mode: "BUS", status: "unused", fareAmount: 5 }
    ]);

    expect(selectCandidateLegs(ticket, genericProfile).map((leg) => leg.ticketLegId)).toEqual(["ticket_leg_002"]);
  });

  it("handles zero, one, and many candidate counts", () => {
    const genericProfile = { ...profile, routeShortName: undefined };
    const none = ticketWithLegs([{ ticketLegId: "ticket_leg_001", mode: "SUBWAY", status: "unused", fareAmount: 5 }]);
    const one = ticketWithLegs([{ ticketLegId: "ticket_leg_001", mode: "BUS", status: "unused", fareAmount: 5 }]);
    const many = ticketWithLegs([
      { ticketLegId: "ticket_leg_001", mode: "BUS", status: "unused", fareAmount: 5 },
      { ticketLegId: "ticket_leg_002", mode: "BUS", status: "unused", fareAmount: 5 }
    ]);

    expect(selectCandidateLegs(none, genericProfile)).toHaveLength(0);
    expect(selectCandidateLegs(one, genericProfile)).toHaveLength(1);
    expect(selectCandidateLegs(many, genericProfile)).toHaveLength(2);
  });
});
