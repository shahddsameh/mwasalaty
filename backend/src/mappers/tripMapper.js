import { createHash } from "crypto";

const MODE_LABELS = {
  BUS: "Bus",
  SUBWAY: "Metro",
  RAIL: "Train",
  TRAM: "Tram",
  FERRY: "Ferry",
  CABLE_CAR: "Cable Car",
  GONDOLA: "Gondola",
  FUNICULAR: "Funicular",
};

function makePlanId(from, to, date, time) {
  const hash = createHash("sha256")
    .update(`${from.lat},${from.lng},${to.lat},${to.lng},${date},${time}`)
    .digest("hex")
    .slice(0, 8);
  return `plan_${hash}`;
}

function modeLabel(mode, route) {
  if (mode === "WALK") return "Walk";
  const prefix = MODE_LABELS[mode] || mode;
  return route?.shortName ? `${prefix} ${route.shortName}` : prefix;
}

function buildInstruction(mode, route, toName) {
  if (mode === "WALK") return `Walk to ${toName}`;
  const prefix = MODE_LABELS[mode] || mode;
  const name = route?.shortName ? `${prefix} ${route.shortName}` : prefix;
  const towards = route?.longName ? ` towards ${route.longName}` : "";
  return `Take ${name}${towards}`;
}

function calculateFare(mode, stopCount) {
  switch (mode) {
    case "BUS":
      return 13;
    case "RAIL":
      return 15;
    case "SUBWAY":
      if (stopCount <= 9) return 10;
      if (stopCount <= 16) return 12;
      if (stopCount <= 23) return 15;
      return 20;
    default:
      return 0;
  }
}

function decodePolyline(points) {
  if (!points || typeof points !== "string") return [];
  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < points.length) {
    let result = 0;
    let shift = 0;
    let b;

    do {
      b = points.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      b = points.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coords.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coords;
}

function mapLeg(leg, itinIdx, legIdx) {
  const legId = `leg_${String(itinIdx + 1).padStart(3, "0")}_${String(legIdx + 1).padStart(3, "0")}`;
  const durationSec = (leg.endTime - leg.startTime) / 1000;
  const toName = leg.to?.name || "destination";
  const stopCount = (leg.intermediateStops?.length ?? 0) + 2;
  const fareAmount = calculateFare(leg.mode, stopCount);

  return {
    legId,
    mode: leg.mode,
    from: { name: leg.from?.name || "Unknown" },
    to: { name: toName },
    distanceMeters: Math.round(leg.distance),
    durationMinutes: Math.round(durationSec / 60),
    startTime: new Date(leg.startTime).toISOString(),
    endTime: new Date(leg.endTime).toISOString(),
    route: leg.route
      ? {
          shortName: leg.route.shortName ?? null,
          longName: leg.route.longName ?? null,
        }
      : null,
    instruction: buildInstruction(leg.mode, leg.route, toName),
    geometry: leg.legGeometry?.points
      ? decodePolyline(leg.legGeometry.points)
      : undefined,
    fare: { amount: fareAmount, currency: "EGP" },
  };
}

function mapItinerary(itin, itinIdx) {
  const itineraryId = `itin_${String(itinIdx + 1).padStart(3, "0")}`;
  const legs = itin.legs.map((leg, legIdx) => mapLeg(leg, itinIdx, legIdx));

  const transitLegs = legs.filter((l) => l.mode !== "WALK");
  const transfers = Math.max(0, transitLegs.length - 1);
  const totalDistanceMeters = legs.reduce(
    (sum, l) => sum + l.distanceMeters,
    0,
  );
  const totalFareAmount = legs.reduce((sum, l) => sum + l.fare.amount, 0);
  const summary = legs.map((l) => modeLabel(l.mode, l.route)).join(" → ");

  return {
    itineraryId,
    durationMinutes: Math.round(itin.duration / 60),
    totalDistanceMeters,
    transfers,
    totalFare: { amount: totalFareAmount, currency: "EGP" },
    summary,
    legs,
  };
}

function routePattern(itin) {
  return itin.legs
    .filter((leg) => leg.mode !== "WALK")
    .map((leg) => `${leg.mode}:${leg.route?.shortName ?? "?"}`)
    .join("→");
}

function deduplicateByPattern(itineraries) {
  const seen = new Set();
  return itineraries.filter((itin) => {
    const pattern = routePattern(itin);
    if (seen.has(pattern)) return false;
    seen.add(pattern);
    return true;
  });
}

function walkDistance(itin) {
  return itin.legs
    .filter((l) => l.mode === "WALK")
    .reduce((sum, l) => sum + l.distanceMeters, 0);
}

function scoreReliable(itin) {
  let score = itin.durationMinutes;
  for (const leg of itin.legs) {
    if (leg.mode === "BUS") score += leg.durationMinutes * 0.35;
    if (leg.mode === "SUBWAY") score -= leg.durationMinutes * 0.15;
    if (leg.mode === "WALK" && leg.distanceMeters > 1000) score += 10;
  }
  score += itin.transfers * 4;
  return score;
}

function buildReliabilityNote(itin, isFallback) {
  if (isFallback) {
    return "No metro-heavy alternative found; showing the quickest available route.";
  }
  const subwayMins = itin.legs
    .filter((l) => l.mode === "SUBWAY")
    .reduce((sum, l) => sum + l.durationMinutes, 0);
  const busMins = itin.legs
    .filter((l) => l.mode === "BUS")
    .reduce((sum, l) => sum + l.durationMinutes, 0);
  if (subwayMins > busMins) {
    return "This route uses more metro and avoids long traffic-heavy bus segments.";
  }
  if (subwayMins > 0) {
    return "This route combines metro and bus to balance reliability and coverage.";
  }
  return "No metro alternative found for this corridor; this is the most reliable bus option available.";
}

function pickHighlights(itineraries) {
  const summarize = (itin) => ({
    itineraryId: itin.itineraryId,
    durationMinutes: itin.durationMinutes,
    totalFare: itin.totalFare,
    summary: itin.summary,
  });

  const best = (arr, compareFn) => summarize([...arr].sort(compareFn)[0]);

  return {
    fastest: best(itineraries, (a, b) => a.durationMinutes - b.durationMinutes),
    reliable: best(itineraries, (a, b) => scoreReliable(a) - scoreReliable(b)),
    cheapest: best(
      itineraries,
      (a, b) =>
        a.totalFare.amount - b.totalFare.amount ||
        a.durationMinutes - b.durationMinutes,
    ),
    leastWalking: best(
      itineraries,
      (a, b) =>
        walkDistance(a) - walkDistance(b) ||
        a.durationMinutes - b.durationMinutes,
    ),
  };
}

function sortItineraries(itineraries, strategy) {
  const copy = [...itineraries];
  if (strategy === "cheapest") {
    copy.sort(
      (a, b) =>
        a.totalFare.amount - b.totalFare.amount ||
        a.durationMinutes - b.durationMinutes,
    );
  } else if (strategy === "most_comfortable") {
    copy.sort(
      (a, b) =>
        a.transfers - b.transfers ||
        walkDistance(a) - walkDistance(b) ||
        a.durationMinutes - b.durationMinutes,
    );
  } else if (strategy === "reliable") {
    copy.sort((a, b) => scoreReliable(a) - scoreReliable(b));
  } else {
    copy.sort((a, b) => a.durationMinutes - b.durationMinutes);
  }
  return copy;
}

export function mapOtpPlan(
  otpPlan,
  from,
  to,
  date,
  time,
  optimizedFor = "quickest",
) {
  // Keep walk-only itineraries: for short, off-grid trips a direct walk is
  // often the genuine best option, and discarding it forces an absurd transit
  // detour to surface instead. deduplicateByPattern collapses walk-only
  // itineraries (their routePattern is "") down to a single entry, and the
  // quickest sort naturally ranks a short walk above a long transit route.
  const mapped = deduplicateByPattern(otpPlan.itineraries).map((itin, i) =>
    mapItinerary(itin, i),
  );

  const sorted = sortItineraries(mapped, optimizedFor).map((itin, i) => ({
    ...itin,
    itineraryId: `itin_${String(i + 1).padStart(3, "0")}`,
    legs: itin.legs.map((leg, j) => ({
      ...leg,
      legId: `leg_${String(i + 1).padStart(3, "0")}_${String(j + 1).padStart(3, "0")}`,
    })),
  }));

  const response = {
    planId: makePlanId(from, to, date, time),
    source: "opentripplanner",
    optimizedFor,
    from: { lat: from.lat, lng: from.lng, label: from.label ?? null },
    to: { lat: to.lat, lng: to.lng, label: to.label ?? null },
    itineraries: sorted,
  };

  if (optimizedFor === "reliable" && sorted.length > 0) {
    const isFallback = !sorted.some((itin) =>
      itin.legs.some((l) => l.mode === "SUBWAY"),
    );
    response.reliabilityNote = buildReliabilityNote(sorted[0], isFallback);
    if (sorted.length > 1) {
      response.highlights = pickHighlights(sorted);
    }
  }

  return response;
}
