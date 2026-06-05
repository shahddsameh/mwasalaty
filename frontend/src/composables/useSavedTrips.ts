import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type SavedTrip } from "@/db/appDb";

export function useSavedTrips() {
  const savedTrips = useObservable(
    from(liveQuery(() => db.savedTrips.orderBy("createdAt").reverse().toArray())),
    { initialValue: [] as SavedTrip[] },
  );

  return {
    savedTrips,
    saveTrip: (trip: SavedTrip) => db.savedTrips.put(trip),
    removeTrip: (id: string) => db.savedTrips.delete(id),
    clearSavedTrips: () => db.savedTrips.clear(),
  };
}
