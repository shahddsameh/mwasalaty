export type RouteSearch = {
  start: string;
  destination: string;
  filter: "fastest" | "cheapest" | "comfortable";
};

export type SelectedRoute = RouteSearch & {
  route: unknown;
  steps?: unknown;
};

const STORAGE_KEY = "mwasalaty:last-route-search";
const SELECTED_ROUTE_KEY = "mwasalaty:selected-route";
const DEFAULT_ROUTE_SEARCH: RouteSearch = {
  start: "",
  destination: "",
  filter: "fastest",
};

let currentRouteSearch: Partial<RouteSearch> = {};
let currentSelectedRoute: Partial<SelectedRoute> = {};

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

export function normalizeFilter(value: unknown): RouteSearch["filter"] {
  return value === "cheapest" || value === "comfortable" || value === "fastest"
    ? value
    : DEFAULT_ROUTE_SEARCH.filter;
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
