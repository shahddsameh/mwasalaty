export type ScannerMode = "BUS" | "SUBWAY";

export type ScannerProfile = {
  scannerProfileId: string;
  label?: string;
  mode: ScannerMode;
  routeShortName?: string;
  operatorId: string;
  deviceId: string;
};

export type TicketQrPayload = {
  ticketId: string;
  type: "MWASALATY_MVP_TICKET";
  signature: string;
};

export type TicketLegStatus = "unused" | "used" | "refunded";

export type TicketLeg = {
  ticketLegId: string;
  plannedLegId?: string;
  mode: string;
  route?: string | { shortName?: string; longName?: string } | null;
  from?: { name?: string };
  to?: { name?: string };
  fareAmount: number;
  currency?: string;
  status: TicketLegStatus;
  validatedAt?: string | null;
  validatedBy?: Record<string, unknown> | null;
  refundedAt?: string | null;
};

export type Ticket = {
  ticketId: string;
  status: "active" | "used" | "refunded" | "partially_refunded";
  createdAt?: string;
  expiresAt?: string;
  passenger?: { userId?: string; name?: string | null };
  payment?: {
    paymentId?: string;
    method?: string;
    status?: string;
    amount?: number;
    currency?: string;
    paymobOrderId?: string | number;
    paymobTransactionId?: string | number;
  };
  qrPayload?: TicketQrPayload;
  legs: TicketLeg[];
};

export type ScanValidateResult = {
  ticketId: string;
  ticketLegId: string;
  status: "used";
  validatedAt: string;
  validatedBy?: Record<string, unknown>;
  message?: string;
  remainingLegs?: number;
  passenger?: Ticket["passenger"];
};

export type LegValidateResult = Omit<ScanValidateResult, "remainingLegs" | "passenger">;

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  message?: string;
};

export class ApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  httpStatus: number;

  constructor(code: string, message: string, details: Record<string, unknown>, httpStatus: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus;
  }
}

async function readBody(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

function toApiError(body: unknown, httpStatus: number): ApiError {
  const candidate = body as ApiErrorBody;
  const envelope = candidate?.error;

  return new ApiError(
    envelope?.code ?? "UNKNOWN_ERROR",
    envelope?.message ?? candidate?.message ?? `Request failed (${httpStatus}).`,
    envelope?.details ?? {},
    httpStatus
  );
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (error) {
    throw new ApiError(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Network request failed.",
      {},
      0
    );
  }

  const body = await readBody(res);
  if (!res.ok) throw toApiError(body, res.status);
  return body as T;
}

export async function getScannerProfiles(): Promise<ScannerProfile[]> {
  const body = await request<{ profiles?: ScannerProfile[] }>("/api/scanner-profiles");
  return body.profiles ?? [];
}

export async function scanValidate(
  qrPayload: TicketQrPayload,
  scannerProfileId: string
): Promise<ScanValidateResult> {
  return request<ScanValidateResult>("/api/tickets/scan/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qrPayload, scannerProfileId })
  });
}

export async function validateLeg(
  ticketId: string,
  legId: string,
  body: { operatorId: string; deviceId: string }
): Promise<LegValidateResult> {
  return request<LegValidateResult>(
    `/api/tickets/${encodeURIComponent(ticketId)}/legs/${encodeURIComponent(legId)}/validate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${encodeURIComponent(ticketId)}`);
}
