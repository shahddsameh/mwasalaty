export type RouteSearch = {
  start: string;
  destination: string;
  filter: "fastest" | "cheapest" | "comfortable";
};

export type SelectedRoute = RouteSearch & {
  route: unknown;
  steps?: unknown;
  // ISO timestamp of a scheduled (future) departure/arrival, if the rider
  // picked one. Drives the ticket's validity window at booking time.
  departureAt?: string;
};

/**
 * Combine the time-picker mode + date + time into an ISO timestamp.
 * Returns undefined for "now" or incomplete input (i.e. depart immediately).
 */
export function computeDepartureAt(
  timeMode: "now" | "depart" | "arrive",
  date?: string,
  time?: string,
): string | undefined {
  if (timeMode === "now" || !date || !time) return undefined;
  const parsed = new Date(`${date}T${time.length === 5 ? time : time.slice(0, 5)}`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export type RecentRouteSearch = {
  from: string;
  to: string;
  filter: RouteSearch["filter"];
  searchedAt: number;
};

const STORAGE_KEY = "mwasalaty:last-route-search";
const SELECTED_ROUTE_KEY = "mwasalaty:selected-route";
const RECENT_SEARCHES_KEY = "mwasalaty:recent-route-searches";
const PLACE_COORDS_KEY = "mwasalaty:place-coords";
const RECENT_SEARCH_LIMIT = 8;
const DEFAULT_ROUTE_SEARCH: RouteSearch = {
  start: "",
  destination: "",
  filter: "fastest",
};

let currentRouteSearch: Partial<RouteSearch> = {};
let currentSelectedRoute: Partial<SelectedRoute> = {};
let currentRecentSearches: RecentRouteSearch[] = [];

export function saveRouteSearch(search: Partial<RouteSearch>) {
  const start = search.start?.trim();
  const destination = search.destination?.trim();

  if (
    !start ||
    !destination ||
    start === "Unknown start" ||
    destination === "Unknown destination"
  ) {
    return;
  }

  currentRouteSearch = {
    start,
    destination,
    filter: normalizeFilter(search.filter),
  };

  saveSessionValue(STORAGE_KEY, currentRouteSearch);
}

export function getSavedRouteSearch(): Partial<RouteSearch> {
  if (currentRouteSearch.start && currentRouteSearch.destination) {
    return currentRouteSearch;
  }

  const parsed = readSessionValue<Partial<RouteSearch>>(STORAGE_KEY);
  currentRouteSearch = {
    start: parsed.start,
    destination: parsed.destination,
    filter: normalizeFilter(parsed.filter),
  };

  return currentRouteSearch;
}

export function saveSelectedRoute(selection: SelectedRoute) {
  saveRouteSearch(selection);
  currentSelectedRoute = {
    ...selection,
    filter: normalizeFilter(selection.filter),
  };
  saveSessionValue(SELECTED_ROUTE_KEY, currentSelectedRoute);
}

export function getSelectedRoute(): Partial<SelectedRoute> {
  if (currentSelectedRoute.route) return currentSelectedRoute;

  currentSelectedRoute =
    readSessionValue<Partial<SelectedRoute>>(SELECTED_ROUTE_KEY);
  return currentSelectedRoute;
}

export function saveRecentRouteSearch(search: Partial<RouteSearch>) {
  const start = search.start?.trim();
  const destination = search.destination?.trim();

  if (
    !start ||
    !destination ||
    start === "Unknown start" ||
    destination === "Unknown destination"
  ) {
    return;
  }

  const normalizedFrom = normalizePlaceKey(start);
  const normalizedTo = normalizePlaceKey(destination);
  const existingSearches = getRecentRouteSearches();
  const alreadyExists = existingSearches.some(
    (recent) =>
      normalizePlaceKey(recent.from) === normalizedFrom &&
      normalizePlaceKey(recent.to) === normalizedTo,
  );

  if (alreadyExists) return;

  currentRecentSearches = [
    {
      from: start,
      to: destination,
      filter: normalizeFilter(search.filter),
      searchedAt: Date.now(),
    },
    ...existingSearches,
  ].slice(0, RECENT_SEARCH_LIMIT);

  saveLocalValue(RECENT_SEARCHES_KEY, currentRecentSearches);
}

export function getRecentRouteSearches(): RecentRouteSearch[] {
  if (currentRecentSearches.length) return currentRecentSearches;

  currentRecentSearches = readLocalValue<RecentRouteSearch[]>(
    RECENT_SEARCHES_KEY,
    [],
  )
    .filter(isRecentRouteSearch)
    .slice(0, RECENT_SEARCH_LIMIT);

  return currentRecentSearches;
}

export type PlaceCoords = { lat: number; lng: number };

// Coordinates for picked places (currently used by "Use current location").
// Keyed by the lowercased label so plan calls can attach lat/lng when available.
export function setPlaceCoords(label: string, coords: PlaceCoords) {
  const key = label.trim().toLowerCase();
  if (!key) return;
  const map = readSessionValue<Record<string, PlaceCoords>>(PLACE_COORDS_KEY) as Record<
    string,
    PlaceCoords
  >;
  map[key] = coords;
  saveSessionValue(PLACE_COORDS_KEY, map);
}

export function getPlaceCoords(label: string | undefined): PlaceCoords | undefined {
  if (!label) return undefined;
  const key = label.trim().toLowerCase();
  const map = readSessionValue<Record<string, PlaceCoords>>(PLACE_COORDS_KEY) as Record<
    string,
    PlaceCoords
  >;
  const coords = map?.[key];
  return coords && typeof coords.lat === "number" && typeof coords.lng === "number"
    ? coords
    : undefined;
}

export function deleteRecentRouteSearch(search: RecentRouteSearch) {
  const normalizedFrom = normalizePlaceKey(search.from);
  const normalizedTo = normalizePlaceKey(search.to);

  currentRecentSearches = getRecentRouteSearches().filter(
    (recent) =>
      !(
        normalizePlaceKey(recent.from) === normalizedFrom &&
        normalizePlaceKey(recent.to) === normalizedTo
      ),
  );

  saveLocalValue(RECENT_SEARCHES_KEY, currentRecentSearches);
}

export function normalizeFilter(value: unknown): RouteSearch["filter"] {
  return value === "cheapest" || value === "comfortable" || value === "fastest"
    ? value
    : DEFAULT_ROUTE_SEARCH.filter;
}

function normalizePlaceKey(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function isRecentRouteSearch(value: unknown): value is RecentRouteSearch {
  const recent = value as Partial<RecentRouteSearch>;
  return (
    typeof recent?.from === "string" &&
    typeof recent.to === "string" &&
    typeof recent.searchedAt === "number"
  );
}

function saveSessionValue(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The in-memory copy still covers same-session SPA navigation.
  }
}

function readSessionValue<T>(key: string): Partial<T> {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as Partial<T>) : {};
  } catch {
    return {};
  }
}

function saveLocalValue(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The in-memory copy still covers this page session.
  }
}

function readLocalValue<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}
