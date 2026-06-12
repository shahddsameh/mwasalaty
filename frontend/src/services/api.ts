const COLOR_MAP: Record<string, { color: string; softColor: string }> = {
  walking: { color: 'var(--transport-walking)', softColor: 'var(--transport-walking-soft)' },
  metro:   { color: 'var(--transport-metro)',   softColor: 'var(--transport-metro-soft)' },
  bus:     { color: 'var(--transport-bus)',     softColor: 'var(--transport-bus-soft)' },
};

import {
  localizeMode,
  localizePlaceName,
  localizeRouteInstruction,
  resolveKnownPlace,
} from "./placeLocalization";
import { getCurrentSession } from "./supabaseAuth";

/**
 * Bearer auth header for the signed-in user, or an empty object when there is
 * no session. Ticket read/refund endpoints are now scoped to the token's user.
 */
async function authHeader(): Promise<Record<string, string>> {
  const session = await getCurrentSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

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
  // Stations this leg covers; for metro it is the combined count of the whole
  // metro journey (used to set the ticket's tier/station limit).
  stationCount?: number;
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
  searchLog?: { id?: string; status?: string; error?: string };
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
    instruction: localizeRouteInstruction(leg.instruction),
    duration: `${leg.durationMinutes} min`,
    ...(leg.mode === 'WALK' ? { distance: `${Math.round(leg.distanceMeters)}m` } : {}),
    from: localizePlaceName(leg.from?.name),
    to: localizePlaceName(leg.to?.name),
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
        ? `${localizeMode(OTP_MODE_TO_TYPE[leg.mode] === 'metro' ? 'Metro' : 'Bus')} ${leg.route.shortName}`
        : localizeRouteInstruction(leg.instruction),
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

export type PlaceResult = {
  label: string;
  lat: number;
  lng: number;
  source: string;
};

/**
 * Autocomplete place search against the backend (GET /api/places/search).
 * Pass an AbortSignal to cancel an in-flight request when the query changes.
 */
export async function searchPlaces(
  q: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`, {
    signal,
  });
  if (!res.ok) throw new Error('place_search_failed');
  const data = (await res.json()) as { places?: PlaceResult[] };
  return data.places ?? [];
}

export type TripWhen = {
  mode: 'now' | 'depart' | 'arrive';
  date?: string;
  time?: string;
};

const ANONYMOUS_SESSION_KEY = "mwasalaty:anonymous-session-id";

function anonymousSessionId() {
  try {
    const existing = localStorage.getItem(ANONYMOUS_SESSION_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(ANONYMOUS_SESSION_KEY, generated);
    return generated;
  } catch {
    return `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export type TripConstraints = {
  maxDurationMinutes?: number;
};

export async function planRoute(
  fromLabel: string,
  toLabel: string,
  filter: 'fastest' | 'cheapest' | 'comfortable' = 'fastest',
  coords: { fromCoords?: PlaceCoords; toCoords?: PlaceCoords } = {},
  when: TripWhen = { mode: 'now' },
  constraints: TripConstraints = {},
): Promise<ApiRouteOption[]> {
  const now = new Date();
  let date = now.toISOString().slice(0, 10);
  let time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const arriveBy = when.mode === 'arrive';

  if (when.mode !== 'now' && when.date && when.time) {
    // Scheduled trip: use the rider's chosen date/time directly.
    date = when.date;
    time = when.time.length === 5 ? when.time : when.time.slice(0, 5);
  } else if (import.meta.env.DEV) {
    // TODO: remove test default before final production demo if needed.
    time = '10:00';
    date = '2026-06-06';
  }

  const knownFrom = resolveKnownPlace(fromLabel);
  const knownTo = resolveKnownPlace(toLabel);
  const fromCoords = coords.fromCoords ?? (knownFrom ? { lat: knownFrom.lat, lng: knownFrom.lng } : undefined);
  const toCoords = coords.toCoords ?? (knownTo ? { lat: knownTo.lat, lng: knownTo.lng } : undefined);

  // When we have client-side coordinates, send them; otherwise send the label
  // only and let the backend geocoder (resolvePlace) resolve it.
  const from = fromCoords
    ? { lat: fromCoords.lat, lng: fromCoords.lng, label: knownFrom?.label ?? fromLabel }
    : { label: fromLabel };
  const to = toCoords
    ? { lat: toCoords.lat, lng: toCoords.lng, label: knownTo?.label ?? toLabel }
    : { label: toLabel };

  const payload = {
    from,
    to,
    date,
    time,
    timeMode: when.mode,
    arriveBy,
    anonymousSessionId: anonymousSessionId(),
    preferences: {
      modes: ['WALK', 'BUS', 'SUBWAY'],
      optimizeFor: FILTER_TO_OPTIMIZE[filter] ?? 'quickest',
    },
    ...(constraints.maxDurationMinutes ? { constraints } : {}),
  };

  if (import.meta.env.DEV) {
    console.log('PLAN PAYLOAD SENT TO BACKEND:', payload);
  }

  const session = await getCurrentSession().catch(() => null);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Anonymous-Session-Id': payload.anonymousSessionId,
  };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch('/api/plan', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    // An empty plan is a normal "no routes for this search" outcome, not a
    // failure — surface it as a stable sentinel so the UI can show friendly copy.
    if (error?.error?.code === 'OTP_EMPTY_PLAN') {
      throw new Error('NO_ROUTES_FOUND');
    }
    throw new Error(error?.error?.message ?? error?.message ?? 'Could not plan this route.');
  }
  const data = (await res.json()) as ApiPlanResponse;

  if (import.meta.env.DEV) {
    console.log('PLAN RESPONSE FROM BACKEND:', data);
    console.log('RESPONSE ITINERARIES:', data?.itineraries);
  }

  if (!data.itineraries?.length) {
    throw new Error('NO_ROUTES_FOUND');
  }
  return data.itineraries.map(mapItinerary);
}

export type AiRouteIntent = {
  from: string | null;
  to: string | null;
  filter: 'fastest' | 'cheapest' | 'comfortable';
  timeMode: 'now' | 'depart' | 'arrive';
  date: string | null;
  time: string | null;
  maxDurationMinutes: number | null;
};

export type AiRouteIntentResponse =
  | { status: 'ready'; intent: AiRouteIntent; source: string }
  | {
      status: 'needs_clarification';
      intent: AiRouteIntent;
      source: string;
      missingFields: string[];
      message: string;
    };

export async function parseAiRouteIntent(prompt: string): Promise<AiRouteIntentResponse> {
  const res = await fetch('/api/ai/route-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as AiRouteIntentResponse;
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
  refundedAt?: string;
};

export type Ticket = {
  ticketId: string;
  status: 'active' | 'used' | 'refunded' | 'partially_refunded';
  createdAt?: string;
  expiresAt?: string;
  departureAt?: string;
  sourcePlanId?: string;
  sourceItineraryId?: string;
  passenger?: { userId?: string; name?: string | null };
  payment: {
    paymentId?: string;
    method: string;
    status: string;
    amount: number;
    currency: string;
    paymobOrderId?: string | number;
    paymobTransactionId?: string | number;
    refundedAmount?: number;
    refundedAt?: string;
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
  stationCount?: number;
};

export type CreateCheckoutPayload = {
  planId: string;
  itineraryId: string;
  departureAt?: string;
  passenger: { userId: string; name?: string; email?: string; phone?: string };
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
  return (
    body?.error?.details?.paymobError ??
    body?.error?.message ??
    body?.message ??
    `Request failed (${res.status}).`
  );
}

export async function createCheckoutSession(
  payload: CreateCheckoutPayload,
): Promise<CheckoutSessionResponse> {
  const res = await fetch('/api/payments/checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
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

/**
 * Confirm a payment from PayMob's signed redirect params. Lets the success page
 * issue the ticket immediately instead of waiting on the (possibly late) webhook.
 * Returns the ticket on success; throws on failure or HMAC mismatch.
 */
export async function confirmCheckoutRedirect(
  params: Record<string, string>,
): Promise<{ ticket: Ticket }> {
  const res = await fetch('/api/payments/confirm-redirect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ticket: Ticket };
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Ticket;
}

export function subscribeToTicket(
  ticketId: string,
  onTicket: (ticket: Ticket) => void,
): () => void {
  if (typeof EventSource === 'undefined') return () => {};
  let source: EventSource | null = null;
  let closed = false;
  // EventSource can't set an Authorization header, so the access token is passed
  // as a query param. Resolving the session is async, so open the stream once it
  // is available and honour an early unsubscribe.
  void getCurrentSession().then((session) => {
    if (closed) return;
    const token = session?.access_token;
    const query = token ? `?access_token=${encodeURIComponent(token)}` : '';
    source = new EventSource(`/api/tickets/${encodeURIComponent(ticketId)}/events${query}`);
    source.addEventListener('ticket', (event) => {
      try {
        onTicket(JSON.parse((event as MessageEvent<string>).data) as Ticket);
      } catch {
        // Ignore malformed stream messages and wait for the next update.
      }
    });
  });
  return () => {
    closed = true;
    source?.close();
  };
}

export async function getTickets(): Promise<Ticket[]> {
  // The backend derives the user from the auth token; no userId query needed.
  const res = await fetch('/api/tickets', { headers: await authHeader() });
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { tickets?: Ticket[] };
  return data.tickets ?? [];
}

export type RefundResult = {
  ticketId: string;
  refundedLegs: Array<{
    ticketLegId: string;
    mode: string;
    fareAmount: number;
    refundedAt: string;
  }>;
  refundAmount: number;
  currency: string;
  remainingLegs: number;
  message: string;
};

export async function refundTicket(ticketId: string, legIds?: string[]): Promise<RefundResult> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(legIds?.length ? { legIds } : {}),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as RefundResult;
}
