import Dexie, { type Table } from "dexie";
import type { Ticket } from "@/services/api";

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
  createdAt: number;
};

export type OfflineTicket = Ticket & {
  savedAt: number;
};

class MwasalatyDb extends Dexie {
  savedTrips!: Table<SavedTrip, string>;
  recentSearches!: Table<RecentSearchRecord, number>;
  favoritePlaces!: Table<FavoritePlace, string>;
  tickets!: Table<OfflineTicket, string>;

  constructor() {
    super("mwasalaty-offline");

    this.version(1).stores({
      savedTrips: "id, createdAt, start, destination",
      recentSearches: "++id, searchedAt, from, to",
      favoritePlaces: "id, name, address, createdAt",
      tickets: "ticketId, status, createdAt, expiresAt, savedAt",
    });
  }
}

export const db = new MwasalatyDb();
