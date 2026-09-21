import { describe, expect, it } from "vitest";
import { diffTourSnapshots } from "@/lib/tours/tourDiff";

const base = {
  title: "Doha", number_of_days: 2, short_description: "Old",
  itinerary: [{ id: 1, day_number: 1, day_title: "Arrive", updated_at: "x" }],
  pricing: [{ id: 5, passenger_from: 1, passenger_to: 1, adult_price: 100, booked_seats: 0 }],
  calendar: [{ id: 9, tour_date: "2026-10-02T00:00:00Z", available_seats: 15, booked_seats: 3 }],
};

describe("diffTourSnapshots", () => {
  it("reports nothing when only bookkeeping fields differ", () => {
    const next = { ...base, calendar: [{ id: 9, tour_date: "2026-10-02T00:00:00Z", available_seats: 15, booked_seats: 7 }] };
    expect(diffTourSnapshots(base, next)).toEqual([]);
  });

  it("groups scalar, changed, added and removed items by editor section", () => {
    const next = {
      ...base,
      title: "Doha City",
      itinerary: [{ id: 1, day_number: 1, day_title: "Arrive & explore" }, { id: 2, day_number: 2, day_title: "Souq" }],
      pricing: [{ id: 5, passenger_from: 1, passenger_to: 1, adult_price: 120 }],
      calendar: [],
    };
    const sections = Object.fromEntries(diffTourSnapshots(base, next).map((s) => [s.key, s]));
    expect(Object.keys(sections)).toEqual(["basic", "itinerary", "pricing", "calendar"]);
    expect(sections.basic.items[0].fields[0]).toMatchObject({ field: "Title", before: "Doha", after: "Doha City" });
    expect(sections.itinerary.items.map((i) => i.kind)).toEqual(["changed", "added"]);
    expect(sections.pricing.items[0].fields[0]).toMatchObject({ field: "Adult price", before: "100", after: "120" });
    expect(sections.calendar.items[0].kind).toBe("removed");
  });

  it("treats a first submission as all new", () => {
    const sections = diffTourSnapshots(undefined, base);
    expect(sections.find((s) => s.key === "itinerary")?.items[0].kind).toBe("added");
  });
});
