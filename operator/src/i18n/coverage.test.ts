import ar from "@/i18n/ar";
import en from "@/i18n/en";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object") return flattenKeys(child, path);
    return [path];
  });
}

describe("i18n coverage", () => {
  it("keeps Arabic and English message trees in lockstep", () => {
    const arKeys = flattenKeys(ar).sort();
    const enKeys = flattenKeys(en).sort();

    expect(arKeys).toEqual(enKeys);
  });
});
