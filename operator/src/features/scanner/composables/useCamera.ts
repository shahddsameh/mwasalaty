import { onUnmounted, ref } from "vue";

export type CameraStatus = "idle" | "starting" | "live" | "denied" | "error" | "no-camera";

export function useCamera() {
  const videoRef = ref<HTMLVideoElement | null>(null);
  const status = ref<CameraStatus>("idle");
  const stream = ref<MediaStream | null>(null);

  function stop() {
    stream.value?.getTracks().forEach((track) => track.stop());
    stream.value = null;
    if (videoRef.value) videoRef.value.srcObject = null;
    if (status.value === "live") status.value = "idle";
  }

  async function start() {
    stop();
    status.value = "starting";

    if (!navigator.mediaDevices?.getUserMedia) {
      status.value = "no-camera";
      return;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      stream.value = media;
      if (videoRef.value) {
        videoRef.value.srcObject = media;
        videoRef.value.setAttribute("playsinline", "true");
        await videoRef.value.play();
      }
      status.value = "live";
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        status.value = "denied";
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        status.value = "no-camera";
      } else {
        status.value = "error";
      }
    }
  }

  onUnmounted(stop);

  return { videoRef, status, start, stop };
}
