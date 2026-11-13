export type GroupPriceTier = {
  persons_from: number;
  persons_to: number | null;
};

/** Return the price tier matching the current party size, falling back to the first tier. */
export function selectGroupPriceTier<T extends GroupPriceTier>(
  tiers: readonly T[],
  travellerCount: number,
): T | undefined {
  return (
    tiers.find(
      (tier) =>
        travellerCount >= tier.persons_from &&
        (tier.persons_to == null || travellerCount <= tier.persons_to),
    ) ?? tiers[0]
  );
}
