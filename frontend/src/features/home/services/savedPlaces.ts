export type SavedPlaceType = "home" | "work" | "school" | "other";
export type SavedPlaceIconKey =
  | "home"
  | "work"
  | "school"
  | "gym"
  | "airport"
  | "shopping"
  | "landmark"
  | "transit"
  | "district"
  | "place";

export type SavedPlace = {
  id: string;
  name: string;
  address: string;
  type: SavedPlaceType;
  iconKey: SavedPlaceIconKey;
  color: string;
  softColor: string;
};

const STORAGE_KEY = "mwasalaty:saved-places";

const PLACE_STYLES: Record<SavedPlaceType, { color: string; softColor: string }> = {
  home: { color: "var(--place-home)", softColor: "var(--place-home-soft)" },
  work: { color: "var(--place-work)", softColor: "var(--place-work-soft)" },
  school: { color: "var(--place-school)", softColor: "var(--place-school-soft)" },
  other: { color: "var(--place-gym)", softColor: "var(--place-gym-soft)" },
};

const DEFAULT_SAVED_PLACES: SavedPlace[] = [
  createPlace("Home", "Nasr City, Cairo", "home"),
  createPlace("Work", "Downtown Cairo", "work"),
  createPlace("School", "Heliopolis, Cairo", "school"),
  createPlace("Gym", "Maadi, Cairo", "other"),
];

let currentSavedPlaces: SavedPlace[] = [];

export function getSavedPlaces(): SavedPlace[] {
  if (currentSavedPlaces.length) return currentSavedPlaces;

  const saved = readLocalValue<SavedPlace[]>(STORAGE_KEY, []);
  currentSavedPlaces = saved.length
    ? saved.filter(isSavedPlace).map(normalizeSavedPlace)
    : DEFAULT_SAVED_PLACES;

  if (!saved.length) saveLocalValue(STORAGE_KEY, currentSavedPlaces);
  return currentSavedPlaces;
}

export function savePlace(input: {
  name: string;
  address: string;
  type?: SavedPlaceType;
}): SavedPlace[] {
  const name = input.name.trim();
  const address = input.address.trim();
  const type = input.type ?? "other";

  if (!name || !address) return getSavedPlaces();

  const nextPlace = createPlace(name, address, type);
  const nextKey = placeKey(nextPlace);
  currentSavedPlaces = [
    nextPlace,
    ...getSavedPlaces().filter((place) => placeKey(place) !== nextKey),
  ];

  saveLocalValue(STORAGE_KEY, currentSavedPlaces);
  return currentSavedPlaces;
}

export function deleteSavedPlace(placeId: string): SavedPlace[] {
  currentSavedPlaces = getSavedPlaces().filter((place) => place.id !== placeId);
  saveLocalValue(STORAGE_KEY, currentSavedPlaces);
  return currentSavedPlaces;
}

/**
 * Derive the display visuals (icon + colors) for a place from its name,
 * address, and type. Lets dynamic stores (e.g. IndexedDB favorite places)
 * reuse the same presentation rules without storing UI fields.
 */
export function describeSavedPlace(
  name: string,
  address: string,
  type: string = "other",
): { iconKey: SavedPlaceIconKey; color: string; softColor: string } {
  const placeType = normalizeSavedPlaceType(type);
  const styles = PLACE_STYLES[placeType];
  return {
    iconKey: inferIconKey(formatDefaultPlaceName(name), address, placeType),
    color: styles.color,
    softColor: styles.softColor,
  };
}

/**
 * Stable id for a saved place, derived from its name + address so the same
 * place is de-duplicated across saves.
 */
export function makeSavedPlaceId(name: string, address: string): string {
  return `${normalize(formatDefaultPlaceName(name))}-${normalize(address)}`;
}

export function normalizeSavedPlaceType(value: string): SavedPlaceType {
  const normalized = value.trim().toLowerCase();
  return normalized === "home" ||
    normalized === "work" ||
    normalized === "school" ||
    normalized === "other"
    ? normalized
    : "other";
}

function createPlace(name: string, address: string, type: SavedPlaceType): SavedPlace {
  const styles = PLACE_STYLES[type];
  const displayName = formatDefaultPlaceName(name);
  return {
    id: `${normalize(displayName)}-${normalize(address)}`,
    name: displayName,
    address,
    type,
    iconKey: inferIconKey(displayName, address, type),
    color: styles.color,
    softColor: styles.softColor,
  };
}

function normalizeSavedPlace(place: SavedPlace): SavedPlace {
  return createPlace(place.name, place.address, normalizeSavedPlaceType(place.type));
}

function placeKey(place: Pick<SavedPlace, "name" | "address">) {
  return `${normalize(place.name)}::${normalize(place.address)}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function formatDefaultPlaceName(value: string) {
  const normalized = normalize(value);
  if (normalized === "home") return "Home";
  if (normalized === "work") return "Work";
  if (normalized === "school") return "School";
  if (normalized === "other") return "Other";
  return value;
}

function inferIconKey(
  name: string,
  address: string,
  type: SavedPlaceType,
): SavedPlaceIconKey {
  if (type === "home") return "home";
  if (type === "work") return "work";
  if (type === "school") return "school";

  const text = normalize(`${name} ${address}`);
  if (
    text.includes("gym") ||
    text.includes("fitness") ||
    text.includes("نادي") ||
    text.includes("جيم")
  ) {
    return "gym";
  }
  if (text.includes("airport")) return "airport";
  if (text.includes("mall") || text.includes("market") || text.includes("khan")) {
    return "shopping";
  }
  if (
    text.includes("museum") ||
    text.includes("tower") ||
    text.includes("pyramid") ||
    text.includes("stadium")
  ) {
    return "landmark";
  }
  if (
    text.includes("metro") ||
    text.includes("station") ||
    text.includes("ramses") ||
    text.includes("sadat") ||
    text.includes("attaba")
  ) {
    return "transit";
  }
  if (
    text.includes("city") ||
    text.includes("cairo") ||
    text.includes("zamalek") ||
    text.includes("maadi") ||
    text.includes("heliopolis")
  ) {
    return "district";
  }

  return "place";
}

function isSavedPlace(value: unknown): value is SavedPlace {
  const place = value as Partial<SavedPlace>;
  return typeof place?.name === "string" && typeof place.address === "string";
}

function saveLocalValue(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The defaults still render if storage is unavailable.
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
