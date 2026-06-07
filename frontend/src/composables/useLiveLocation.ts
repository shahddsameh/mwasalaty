import { ref } from "vue";

export type LiveLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

export function useLiveLocation() {
  const location = ref<LiveLocation | null>(null);
  const error = ref("");
  const isTracking = ref(false);
  let watchId: number | null = null;

  function startTracking() {
    if (watchId !== null) return;
    if (!("geolocation" in navigator)) {
      error.value = "Geolocation is not supported.";
      return;
    }

    isTracking.value = true;
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        location.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        error.value = "";
      },
      (nextError) => {
        error.value = nextError.message || "Location unavailable.";
        isTracking.value = false;
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }

  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    isTracking.value = false;
  }

  return { location, error, isTracking, startTracking, stopTracking };
}
