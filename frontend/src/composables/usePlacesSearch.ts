import { ref } from "vue";
import { searchPlaces, type PlaceResult } from "@/services/api";

/**
 * Debounced place autocomplete backed by GET /api/places/search.
 *
 * Cancels the previous in-flight request whenever a newer query comes in, so
 * results never arrive out of order. Empty/short queries clear the list.
 */
export function usePlacesSearch(debounceMs = 250) {
  const results = ref<PlaceResult[]>([]);
  const loading = ref(false);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;

  function search(query: string) {
    if (timer) clearTimeout(timer);
    const trimmed = query.trim();

    timer = setTimeout(async () => {
      controller?.abort();
      controller = new AbortController();
      loading.value = true;
      try {
        results.value = await searchPlaces(trimmed, controller.signal);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") results.value = [];
      } finally {
        loading.value = false;
      }
    }, debounceMs);
  }

  function clear() {
    if (timer) clearTimeout(timer);
    controller?.abort();
    results.value = [];
    loading.value = false;
  }

  return { results, loading, search, clear };
}
