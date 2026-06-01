import { routeOptions, type RouteOption } from './data';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

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

export type ApiRouteOption = RouteOption & { detailSteps: RouteDetailStep[] };

async function geocode(place: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${place}, Cairo, Egypt`);
    const res = await fetch(`${NOMINATIM_URL}?q=${q}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'Mwasalaty/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function legToStep(leg: any): RouteDetailStep {
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

function mapItinerary(itin: any, index: number): ApiRouteOption {
  const walkLegs = itin.legs.filter((l: any) => l.mode === 'WALK');
  const totalWalkM = walkLegs.reduce((sum: number, l: any) => sum + l.distanceMeters, 0);
  const walkingDistance = totalWalkM >= 1000
    ? `${(totalWalkM / 1000).toFixed(1)} km`
    : `${Math.round(totalWalkM)} m`;

  return {
    id: index + 1,
    duration: `${itin.durationMinutes} min`,
    cost: `${itin.totalFare.amount} EGP`,
    transfers: itin.transfers,
    walkingDistance,
    steps: itin.legs.map((leg: any) => ({
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
  const [from, to] = await Promise.all([geocode(fromLabel), geocode(toLabel)]);
  if (!from || !to) return [];

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { ...from, label: fromLabel },
        to: { ...to, label: toLabel },
        date,
        time,
        preferences: {
          modes: ['WALK', 'BUS', 'SUBWAY'],
          optimizeFor: FILTER_TO_OPTIMIZE[filter] ?? 'quickest',
        },
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.itineraries?.length) return [];
    return data.itineraries.map(mapItinerary);
  } catch {
    return [];
  }
}

export { routeOptions };
