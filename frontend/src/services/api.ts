const COLOR_MAP: Record<string, { color: string; softColor: string }> = {
  walking: { color: 'var(--transport-walking)', softColor: 'var(--transport-walking-soft)' },
  metro:   { color: 'var(--transport-metro)',   softColor: 'var(--transport-metro-soft)' },
  bus:     { color: 'var(--transport-bus)',     softColor: 'var(--transport-bus-soft)' },
};

const OTP_MODE_TO_TYPE: Record<string, string> = {
  WALK:   'walking',
  SUBWAY: 'metro',
  BUS:    'bus',
  RAIL:   'metro',
  TRAM:   'bus',
};

export type ApiFare = {
  amount: number;
  currency: string;
};

export type ApiLeg = {
  legId: string;
  mode: string;
  from: { name: string };
  to: { name: string };
  distanceMeters: number;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  route: null | { shortName?: string; longName?: string };
  instruction: string;
  geometry?: { lat: number; lng: number }[];
  fare: ApiFare;
};

export type ApiItinerary = {
  itineraryId: string;
  durationMinutes: number;
  totalDistanceMeters: number;
  transfers: number;
  totalFare: ApiFare;
  summary: string;
  legs: ApiLeg[];
};

export type ApiPlanResponse = {
  planId: string;
  source: string;
  optimizedFor: string;
  from: { lat: number; lng: number; label: string | null };
  to: { lat: number; lng: number; label: string | null };
  itineraries: ApiItinerary[];
  reliabilityNote?: string;
  highlights?: Record<string, unknown>;
};

export type RouteStep = { type: string; label: string };

export type RouteDetailStep = {
  type: string;
  instruction: string;
  duration: string;
  distance?: string;
  stops?: number;
  from?: string;
  to?: string;
  color: string;
  softColor: string;
  geometry?: { lat: number; lng: number }[];
};

export type ApiRouteOption = ApiItinerary & {
  id: string;
  duration: string;
  cost: string;
  walkingDistance: string;
  steps: RouteStep[];
  detailSteps: RouteDetailStep[];
};

function legToStep(leg: ApiLeg): RouteDetailStep {
  const type = OTP_MODE_TO_TYPE[leg.mode] ?? 'bus';
  const colors = COLOR_MAP[type] ?? COLOR_MAP.bus;
  return {
    type,
    instruction: leg.instruction,
    duration: `${leg.durationMinutes} min`,
    ...(leg.mode === 'WALK' ? { distance: `${Math.round(leg.distanceMeters)}m` } : {}),
    from: leg.from?.name,
    to: leg.to?.name,
    color: colors.color,
    softColor: colors.softColor,
    geometry: leg.geometry,
  };
}

function mapItinerary(itin: ApiItinerary): ApiRouteOption {
  const walkLegs = itin.legs.filter((leg) => leg.mode === 'WALK');
  const totalWalkM = walkLegs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const walkingDistance = totalWalkM >= 1000
    ? `${(totalWalkM / 1000).toFixed(1)} km`
    : `${Math.round(totalWalkM)} m`;

  return {
    ...itin,
    id: itin.itineraryId,
    duration: `${itin.durationMinutes} min`,
    cost: `${itin.totalFare.amount} EGP`,
    walkingDistance,
    steps: itin.legs.map((leg) => ({
      type: OTP_MODE_TO_TYPE[leg.mode] ?? 'bus',
      label: leg.route?.shortName
        ? `${OTP_MODE_TO_TYPE[leg.mode] === 'metro' ? 'Metro' : 'Bus'} ${leg.route.shortName}`
        : leg.instruction,
    })),
    detailSteps: itin.legs.map(legToStep),
  };
}

const FILTER_TO_OPTIMIZE: Record<string, string> = {
  fastest:     'quickest',
  cheapest:    'cheapest',
  comfortable: 'most_comfortable',
};

export type PlaceCoords = { lat: number; lng: number };

export async function planRoute(
  fromLabel: string,
  toLabel: string,
  filter: 'fastest' | 'cheapest' | 'comfortable' = 'fastest',
  coords: { fromCoords?: PlaceCoords; toCoords?: PlaceCoords } = {},
): Promise<ApiRouteOption[]> {
  const now = new Date();
  let date = now.toISOString().slice(0, 10);
  let time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // TODO: remove test default before final production demo if needed.
  if (import.meta.env.DEV) {
    time = '10:00';
    date = '2026-06-06';
  }

  // Send lat/lng when we have them (e.g. current location); the backend accepts
  // either coordinates or a label it geocodes server-side.
  const from = coords.fromCoords
    ? { lat: coords.fromCoords.lat, lng: coords.fromCoords.lng, label: fromLabel }
    : { label: fromLabel };
  const to = coords.toCoords
    ? { lat: coords.toCoords.lat, lng: coords.toCoords.lng, label: toLabel }
    : { label: toLabel };

  const payload = {
    from,
    to,
    date,
    time,
    preferences: {
      modes: ['WALK', 'BUS', 'SUBWAY'],
      optimizeFor: FILTER_TO_OPTIMIZE[filter] ?? 'quickest',
    },
  };

  if (import.meta.env.DEV) {
    console.log('PLAN PAYLOAD SENT TO BACKEND:', payload);
  }

  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error?.message ?? error?.message ?? 'Could not plan this route.');
  }
  const data = (await res.json()) as ApiPlanResponse;

  if (import.meta.env.DEV) {
    console.log('PLAN RESPONSE FROM BACKEND:', data);
    console.log('RESPONSE ITINERARIES:', data?.itineraries);
  }

  if (!data.itineraries?.length) {
    throw new Error('No routes were returned for this search.');
  }
  return data.itineraries.map(mapItinerary);
}

/* ------------------------------------------------------------------ *
 * Payments + Ticketing (PayMob test checkout)
 * ------------------------------------------------------------------ */

export type TicketQrPayload = {
  type: string;
  ticketId: string;
  signature: string;
};

export type TicketLegStatus = 'unused' | 'used' | 'refunded';

export type TicketLeg = {
  ticketLegId: string;
  mode: string;
  route?: { shortName?: string; longName?: string } | null;
  from?: { name?: string };
  to?: { name?: string };
  fareAmount: number;
  currency?: string;
  status: TicketLegStatus;
};

export type Ticket = {
  ticketId: string;
  status: 'active' | 'used' | 'refunded' | 'partially_refunded';
  createdAt?: string;
  expiresAt?: string;
  passenger?: { userId?: string; name?: string | null };
  payment: {
    paymentId?: string;
    method: string;
    status: string;
    amount: number;
    currency: string;
    paymobOrderId?: string | number;
    paymobTransactionId?: string | number;
  };
  qrPayload: TicketQrPayload;
  legs: TicketLeg[];
};

export type CheckoutSessionResponse = {
  sessionId: string;
  checkoutUrl: string;
};

export type CheckoutLeg = {
  legId: string;
  mode: string;
  route: { shortName?: string; longName?: string };
  from: { name: string };
  to: { name: string };
  fareAmount: number;
  currency: string;
};

export type CreateCheckoutPayload = {
  planId: string;
  itineraryId: string;
  passenger: { userId: string; name: string; email?: string; phone?: string };
  paymentBreakdown: {
    fareAmount: number;
    serviceFee: number;
    totalAmount: number;
    operatorReceivable: number;
    platformCommission: number;
    monetizationMode: string;
    currency: string;
  };
  itinerary: { itineraryId: string; legs: CheckoutLeg[] };
};

async function readApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error?.message ?? body?.message ?? `Request failed (${res.status}).`;
}

export async function createCheckoutSession(
  payload: CreateCheckoutPayload,
): Promise<CheckoutSessionResponse> {
  const res = await fetch('/api/payments/checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as CheckoutSessionResponse;
}

export type CheckoutResult =
  | { status: 'pending' }
  | { status: 'ready'; ticket: Ticket };

export async function getCheckoutSessionResult(sessionId: string): Promise<CheckoutResult> {
  const res = await fetch(`/api/payments/checkout-session/${encodeURIComponent(sessionId)}/result`);
  if (res.status === 202) return { status: 'pending' };
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { ticket: Ticket };
  return { status: 'ready', ticket: data.ticket };
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Ticket;
}
