import { BrowserQRCodeReader } from "@zxing/library";

let nativeDetector: BarcodeDetector | null = null;
let zxingReader: BrowserQRCodeReader | null = null;

function getNativeDetector(): BarcodeDetector | null {
  if (typeof window === "undefined" || !window.BarcodeDetector) return null;
  if (!nativeDetector) {
    nativeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
  }
  return nativeDetector;
}

function getZxingReader(): BrowserQRCodeReader {
  zxingReader ??= new BrowserQRCodeReader();
  return zxingReader;
}

export async function decodeFromVideo(video: HTMLVideoElement): Promise<string | null> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  const detector = getNativeDetector();
  if (detector) {
    const results = await detector.detect(video).catch(() => []);
    const raw = results[0]?.rawValue;
    if (raw) return raw;
  }

  try {
    const result = getZxingReader().decode(video);
    return result.getText();
  } catch {
    return null;
  }
}
