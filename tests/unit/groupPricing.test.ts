import { describe, expect, it } from "vitest";
import { selectGroupPriceTier } from "@/lib/utils/groupPricing";

const tiers = [
  { persons_from: 1, persons_to: 2, price_per_person: 895.05 },
  { persons_from: 3, persons_to: 6, price_per_person: 845.32 },
  { persons_from: 7, persons_to: 10, price_per_person: 795.5 },
];

describe("selectGroupPriceTier", () => {
  it.each([
    [1, 895.05],
    [2, 895.05],
    [3, 845.32],
    [6, 845.32],
    [7, 795.5],
    [10, 795.5],
  ])("uses the correct rate for %i travellers", (travellers, expectedPrice) => {
    expect(selectGroupPriceTier(tiers, travellers)?.price_per_person).toBe(expectedPrice);
  });

  it("falls back to the first tier when no configured range matches", () => {
    expect(selectGroupPriceTier(tiers, 11)?.price_per_person).toBe(895.05);
  });
});
