import { describe, expect, it } from "vitest";
import { generateScheduleDates } from "@/lib/tours/availabilitySchedule";

const range = { start: "2026-10-01", end: "2026-12-31" };
const SAT = 5;
const FRI = 4;

describe("generateScheduleDates (mirrors the backend expansion)", () => {
  it("weekly: every chosen weekday", () => {
    expect(generateScheduleDates({ ...range, frequency: "weekly", frequencyWeek: null, weeks: [], weekdays: [SAT] }).slice(0, 3)).toEqual(["2026-10-03", "2026-10-10", "2026-10-17"]);
  });

  it("fortnightly: week 1 vs week 2 alternate", () => {
    const w1 = generateScheduleDates({ ...range, frequency: "fortnightly", frequencyWeek: 1, weeks: [], weekdays: [SAT] });
    const w2 = generateScheduleDates({ ...range, frequency: "fortnightly", frequencyWeek: 2, weeks: [], weekdays: [SAT] });
    expect(w1.slice(0, 3)).toEqual(["2026-10-03", "2026-10-17", "2026-10-31"]);
    expect(w2.slice(0, 3)).toEqual(["2026-10-10", "2026-10-24", "2026-11-07"]);
  });

  it("monthly: several weeks of the month, e.g. 1st and 3rd Saturday", () => {
    expect(generateScheduleDates({ ...range, frequency: "monthly", frequencyWeek: 1, weeks: [1, 3], weekdays: [SAT] })).toEqual([
      "2026-10-03", "2026-10-17", "2026-11-07", "2026-11-21", "2026-12-05", "2026-12-19",
    ]);
  });

  it("monthly: 'Last' is the final such weekday of each month", () => {
    expect(generateScheduleDates({ ...range, frequency: "monthly", frequencyWeek: null, weeks: [5], weekdays: [FRI] })).toEqual(["2026-10-30", "2026-11-27", "2026-12-25"]);
  });

  it("returns nothing for an empty or reversed range", () => {
    expect(generateScheduleDates({ start: "2026-12-01", end: "2026-10-01", frequency: "weekly", frequencyWeek: null, weeks: [], weekdays: [SAT] })).toEqual([]);
    expect(generateScheduleDates({ ...range, frequency: "weekly", frequencyWeek: null, weeks: [], weekdays: [] })).toEqual([]);
  });
});
