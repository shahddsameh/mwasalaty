import type { ApiError, ScanValidateResult, TicketQrPayload } from "@/services/api";

export const OUTCOMES = [
  "valid",
  "already_used",
  "invalid",
  "no_match",
  "ambiguous",
  "unverified"
] as const;

export type Outcome = (typeof OUTCOMES)[number];

export type ScanOutcome = {
  kind: Outcome;
  at: string;
  ticketId: string | null;
  ticketLegId: string | null;
  mode: string | null;
  route: string | null;
  detail: Record<string, unknown>;
};

const INVALID_CODES = new Set([
  "INVALID_QR_PAYLOAD",
  "TICKET_EXPIRED",
  "TICKET_NOT_FOUND",
  "LEG_ALREADY_REFUNDED",
  "STATION_LIMIT_EXCEEDED",
  "SCANNER_PROFILE_NOT_FOUND",
  "VALIDATION_ERROR",
  "LEG_NOT_FOUND"
]);

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function base(kind: Outcome, detail: Record<string, unknown> = {}): ScanOutcome {
  return {
    kind,
    at: new Date().toISOString(),
    ticketId: asString(detail.ticketId),
    ticketLegId: asString(detail.ticketLegId),
    mode: asString(detail.mode),
    route: asString(detail.routeShortName) ?? asString(detail.route),
    detail
  };
}

export function mapResultToOutcome(result: ScanValidateResult): ScanOutcome {
  return {
    kind: "valid",
    at: new Date().toISOString(),
    ticketId: result.ticketId,
    ticketLegId: result.ticketLegId,
    mode: null,
    route: null,
    detail: {
      validatedAt: result.validatedAt,
      validatedBy: result.validatedBy ?? null,
      remainingLegs: result.remainingLegs ?? null,
      passenger: result.passenger ?? null,
      message: result.message ?? null
    }
  };
}

export function mapErrorToOutcome(error: ApiError): ScanOutcome {
  const detail = {
    ...error.details,
    code: error.code,
    reason: error.message,
    httpStatus: error.httpStatus
  };

  if (error.code === "LEG_ALREADY_USED") {
    return base("already_used", detail);
  }

  if (error.code === "NO_MATCHING_LEG") {
    return base("no_match", detail);
  }

  if (error.code === "AMBIGUOUS_LEG_MATCH") {
    return base("ambiguous", detail);
  }

  if (INVALID_CODES.has(error.code)) {
    return base("invalid", detail);
  }

  return base("invalid", detail);
}

export function isTicketQrPayload(value: unknown): value is TicketQrPayload {
  const payload = value as Partial<TicketQrPayload>;
  return (
    payload?.type === "MWASALATY_MVP_TICKET" &&
    typeof payload.ticketId === "string" &&
    typeof payload.signature === "string"
  );
}

export function createLocalInvalidOutcome(reason: string, detail: Record<string, unknown> = {}): ScanOutcome {
  return base("invalid", {
    code: "INVALID_QR_PAYLOAD",
    reason,
    ...detail
  });
}

export function createUnverifiedOutcome(
  payload: TicketQrPayload,
  detail: Record<string, unknown> = {}
): ScanOutcome {
  return {
    kind: "unverified",
    at: new Date().toISOString(),
    ticketId: payload.ticketId,
    ticketLegId: null,
    mode: null,
    route: null,
    detail: {
      scannedWhileOffline: true,
      ...detail
    }
  };
}
