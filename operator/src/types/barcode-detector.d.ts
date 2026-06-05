type BarcodeDetectorFormat = "qr_code";

type BarcodeDetectorOptions = {
  formats?: BarcodeDetectorFormat[];
};

type DetectedBarcode = {
  rawValue: string;
};

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats?: () => Promise<BarcodeDetectorFormat[]>;
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
