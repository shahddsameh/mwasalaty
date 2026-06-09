import { defineStore } from "pinia";

export type TripSearchFilter = "fastest" | "cheapest" | "comfortable";
export type TripTimeMode = "now" | "depart" | "arrive";
export type TripCoords = { lat: number; lng: number };

export type TripSearchState = {
  start: string;
  destination: string;
  filter: TripSearchFilter;
  timeMode: TripTimeMode;
  date: string;
  time: string;
  fromCoords: TripCoords | null;
  toCoords: TripCoords | null;
};

export const useTripSearchStore = defineStore("tripSearch", {
  state: (): TripSearchState => ({
    start: "",
    destination: "",
    filter: "fastest",
    timeMode: "now",
    date: "",
    time: "",
    fromCoords: null,
    toCoords: null,
  }),
  actions: {
    setSearch(search: Partial<TripSearchState>) {
      this.start = search.start?.trim() ?? this.start;
      this.destination = search.destination?.trim() ?? this.destination;
      this.filter = search.filter ?? this.filter;
      this.timeMode = search.timeMode ?? this.timeMode;
      this.date = search.date ?? this.date;
      this.time = search.time ?? this.time;
      if (search.fromCoords !== undefined) this.fromCoords = search.fromCoords;
      if (search.toCoords !== undefined) this.toCoords = search.toCoords;
    },
    clearSearch() {
      this.start = "";
      this.destination = "";
      this.filter = "fastest";
      this.timeMode = "now";
      this.date = "";
      this.time = "";
      this.fromCoords = null;
      this.toCoords = null;
    },
  },
});
