// Client-side twin of the backend's recurring-availability expansion
// (services/tour_availability._generate_dates) so the editor can preview the exact
// dates a schedule will create before it is saved. Keep the two in step.
//
// weekdays: 0 = Monday .. 6 = Sunday.
// fortnightly: week 1 = the week of the start date, 2 = the following week, then every 2 weeks.
// monthly: weeks = which occurrence of each weekday, 1-4 = 1st-4th, 5 = the last one in the month.

export type ScheduleInput = {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  frequency: "weekly" | "fortnightly" | "monthly";
  frequencyWeek: number | null;
  weeks: number[];
  weekdays: number[];
};

const DAY_MS = 86_400_000;

function parse(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Monday = 0 like Python's date.weekday(). */
function weekday(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

export function generateScheduleDates(input: ScheduleInput): string[] {
  const start = parse(input.start);
  const end = parse(input.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start || input.weekdays.length === 0) return [];
  const weekdays = new Set(input.weekdays);
  const out = new Set<string>();

  if (input.frequency === "weekly") {
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      const day = new Date(t);
      if (weekdays.has(weekday(day))) out.add(iso(day));
    }
  } else if (input.frequency === "fortnightly") {
    const anchor = start.getTime() - weekday(start) * DAY_MS;
    let weekStart = anchor + ((input.frequencyWeek ?? 1) === 1 ? 0 : 7) * DAY_MS;
    while (weekStart <= end.getTime()) {
      for (const wd of weekdays) {
        const candidate = weekStart + wd * DAY_MS;
        if (candidate >= start.getTime() && candidate <= end.getTime()) out.add(iso(new Date(candidate)));
      }
      weekStart += 14 * DAY_MS;
    }
  } else {
    const nths = input.weeks.length ? input.weeks : [input.frequencyWeek ?? 1];
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cursor.getTime() <= end.getTime()) {
      const y = cursor.getUTCFullYear();
      const m = cursor.getUTCMonth();
      const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const firstWeekday = weekday(cursor);
      const lastWeekday = (firstWeekday + daysInMonth - 1) % 7;
      for (const wd of weekdays) {
        for (const nth of nths) {
          const dayNumber = nth === 5 ? daysInMonth - ((((lastWeekday - wd) % 7) + 7) % 7) : 1 + ((((wd - firstWeekday) % 7) + 7) % 7) + (nth - 1) * 7;
          if (dayNumber >= 1 && dayNumber <= daysInMonth) {
            const candidate = new Date(Date.UTC(y, m, dayNumber));
            if (candidate >= start && candidate <= end) out.add(iso(candidate));
          }
        }
      }
      cursor = new Date(Date.UTC(y, m + 1, 1));
    }
  }
  return [...out].sort();
}

export const MONTH_WEEK_OPTIONS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: 5, label: "Last" },
] as const;
