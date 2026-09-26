import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/client", () => ({
  default: { get: vi.fn(() => new Promise(() => undefined)) },
}));

describe("country-driven currency selection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("keeps the country's currency when rates are still loading", async () => {
    const { setDisplayCountry } = await import("@/hooks/useCurrency");

    await setDisplayCountry("NZ", "NZD");

    expect(localStorage.getItem("tourvaa_display_country")).toBe("NZ");
    expect(localStorage.getItem("tourvaa_display_currency")).toBe("NZD");
  });
});
