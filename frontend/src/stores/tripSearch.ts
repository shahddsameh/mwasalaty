import { defineStore } from "pinia";

export type TripSearchFilter = "fastest" | "cheapest" | "comfortable";

export type TripSearchState = {
  start: string;
  destination: string;
  filter: TripSearchFilter;
  date: string;
  time: string;
};

export const useTripSearchStore = defineStore("tripSearch", {
  state: (): TripSearchState => ({
    start: "",
    destination: "",
    filter: "fastest",
    date: "",
    time: "",
  }),
  actions: {
    setSearch(search: Partial<TripSearchState>) {
      this.start = search.start?.trim() ?? this.start;
      this.destination = search.destination?.trim() ?? this.destination;
      this.filter = search.filter ?? this.filter;
      this.date = search.date ?? this.date;
      this.time = search.time ?? this.time;
    },
    clearSearch() {
      this.start = "";
      this.destination = "";
      this.filter = "fastest";
      this.date = "";
      this.time = "";
    },
  },
});
