import { liveQuery } from "dexie";
import { from, useObservable } from "@vueuse/rxjs";
import { db, type FavoritePlace } from "@/db/appDb";

export function useFavoritePlaces() {
  const favoritePlaces = useObservable(
    from(liveQuery(() => db.favoritePlaces.orderBy("name").toArray())),
    { initialValue: [] as FavoritePlace[] },
  );

  return {
    favoritePlaces,
    saveFavoritePlace: (place: FavoritePlace) => db.favoritePlaces.put(place),
    removeFavoritePlace: (id: string) => db.favoritePlaces.delete(id),
    clearFavoritePlaces: () => db.favoritePlaces.clear(),
  };
}
