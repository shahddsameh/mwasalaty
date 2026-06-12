import { vi } from "vitest";

Object.defineProperty(window.navigator, "onLine", {
  configurable: true,
  value: true
});

Object.defineProperty(window.navigator, "vibrate", {
  configurable: true,
  value: vi.fn()
});

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}
