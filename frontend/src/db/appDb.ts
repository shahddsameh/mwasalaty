import Dexie, { type Table } from "dexie";
import type { Ticket, ApiRouteOption, ApiPlanResponse } from "@/services/api";

export type SavedTrip = {
  id: string;
  start: string;
  destination: string;
  filter: string;
  duration?: string;
  cost?: string;
  createdAt: number;
};

export type RecentSearchRecord = {
  id?: number;
  from: string;
  to: string;
  filter: string;
  searchedAt: number;
};

export type FavoritePlace = {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  type?: string;
  createdAt: number;
  updatedAt?: number;
};

export type OfflineTicket = Ticket & {
  savedAt: number;
};

export type AppSetting = {
  key: string;
  value: string;
  updatedAt: number;
};

// Offline-first cache types
export type CachedRoute = {
  cacheKey: string; // Composite key: from|to|filter
  from: string;
  to: string;
  filter: string;
  routes: ApiRouteOption[];
  planData?: ApiPlanResponse;
  cachedAt: number;
  expiresAt: number;
};

export type CachedPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
  metadata?: Record<string, unknown>;
  cachedAt: number;
};

export type SyncMetadata = {
  key: string; // Entity type, e.g., 'favoritePlaces', 'recentSearches'
  lastSyncAt: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
};

export type PendingAction = {
  id?: number;
  actionType: 'create' | 'update' | 'delete';
  entityType: 'favoritePlace' | 'recentSearch' | 'savedTrip' | 'setting';
  entityId?: string;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastAttemptAt?: number;
  error?: string;
};

class MwasalatyDb extends Dexie {
  savedTrips!: Table<SavedTrip, string>;
  recentSearches!: Table<RecentSearchRecord, number>;
  favoritePlaces!: Table<FavoritePlace, string>;
  tickets!: Table<OfflineTicket, string>;
  settings!: Table<AppSetting, string>;
  cachedRoutes!: Table<CachedRoute, string>;
  cachedPlaces!: Table<CachedPlace, string>;
  syncMetadata!: Table<SyncMetadata, string>;
  pendingActions!: Table<PendingAction, number>;

  constructor() {
    super("mwasalaty-offline");

    this.version(1).stores({
      savedTrips: "id, createdAt, start, destination",
      recentSearches: "++id, searchedAt, from, to",
      favoritePlaces: "id, name, address, createdAt",
      tickets: "ticketId, status, createdAt, expiresAt, savedAt",
    });

    this.version(2).stores({
      savedTrips: "id, createdAt, start, destination",
      recentSearches: "++id, searchedAt, from, to",
      favoritePlaces: "id, name, address, createdAt",
      tickets: "ticketId, status, createdAt, expiresAt, savedAt",
      settings: "key, updatedAt",
    });

    // Version 3: Add offline-first caching and sync tables
    this.version(3).stores({
      savedTrips: "id, createdAt, start, destination",
      recentSearches: "++id, searchedAt, from, to",
      favoritePlaces: "id, name, address, createdAt, updatedAt",
      tickets: "ticketId, status, createdAt, expiresAt, savedAt",
      settings: "key, updatedAt",
      cachedRoutes: "cacheKey, cachedAt, expiresAt, from, to",
      cachedPlaces: "id, name, cachedAt",
      syncMetadata: "key, lastSyncAt, syncStatus",
      pendingActions: "++id, createdAt, entityType, actionType, retryCount",
    });

    // Version 4: compound [from+to+filter] index so recentSearchesRepository
    // can dedupe a search by its full identity.
    this.version(4).stores({
      recentSearches: "++id, searchedAt, from, to, [from+to+filter]",
    });
  }
}

export const db = new MwasalatyDb();
