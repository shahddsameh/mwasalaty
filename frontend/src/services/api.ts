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

export async function planRoute(
  fromLabel: string,
  toLabel: string,
  filter: 'fastest' | 'cheapest' | 'comfortable' = 'fastest',
): Promise<ApiRouteOption[]> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { label: fromLabel },
      to: { label: toLabel },
      date,
      time,
      preferences: {
        modes: ['WALK', 'BUS', 'SUBWAY'],
        optimizeFor: FILTER_TO_OPTIMIZE[filter] ?? 'quickest',
      },
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error?.message ?? error?.message ?? 'Could not plan this route.');
  }
  const data = (await res.json()) as ApiPlanResponse;
  if (!data.itineraries?.length) {
    throw new Error('No routes were returned for this search.');
  }
  return data.itineraries.map(mapItinerary);
}
