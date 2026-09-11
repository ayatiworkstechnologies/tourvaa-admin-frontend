"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LuPlus as Plus,
  LuPencil as Pencil,
  LuTrash2 as Trash2,
  LuSave as Save,
  LuX as X,
  LuCircleCheck as CheckCircle,
  LuRotateCcw as RotateCcw,
} from "react-icons/lu";
import { CalendarEntry, getCalendar, createCalendarEntry, updateCalendarEntry, deleteCalendarEntry, UnavailableDate, getUnavailableDates, createUnavailableDate, deleteUnavailableDate, AvailabilityConfig, getAvailabilityConfig, saveAvailabilityConfig } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import DataTable from "@/components/ui/DataTable";
import DatePicker from "@/components/ui/DatePicker";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const STATUSES = ["available", "unavailable", "sold_out", "blocked"];
const emptyEntry = (): CalendarEntry => ({ tour_date: "", available_seats: 10, booked_seats: 0, status: "available" });

const MONTH_OPTIONS = [
  { value: "all", label: "All Months" },
  { value: "01", label: "January (01)" },
  { value: "02", label: "February (02)" },
  { value: "03", label: "March (03)" },
  { value: "04", label: "April (04)" },
  { value: "05", label: "May (05)" },
  { value: "06", label: "June (06)" },
  { value: "07", label: "July (07)" },
  { value: "08", label: "August (08)" },
  { value: "09", label: "September (09)" },
  { value: "10", label: "October (10)" },
  { value: "11", label: "November (11)" },
  { value: "12", label: "December (12)" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "sold_out", label: "Sold Out" },
  { value: "unavailable", label: "Unavailable" },
  { value: "blocked", label: "Blocked" },
];

const WEEKDAYS = [
  { value: 0, label: "Monday" }, { value: 1, label: "Tuesday" }, { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" }, { value: 4, label: "Friday" }, { value: 5, label: "Saturday" }, { value: 6, label: "Sunday" },
];
const FREQUENCIES = [
  { value: "weekly" as const, label: "Weekly", note: "Tour runs every week" },
  { value: "fortnightly" as const, label: "Fortnightly", note: "Tour runs every two weeks" },
  { value: "monthly" as const, label: "Monthly", note: "Tour runs every month" },
];
const emptyAvailability = (): AvailabilityConfig => ({
  availability_start_date: null, availability_end_date: null, min_advance_booking_days: 0,
  agent_no_deposit_buffer_weeks: 4,
  frequency: null, frequency_week: null, frequency_days: [], seats_per_occurrence: 10,
});

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function earliestBookableDate(minDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + minDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TourCalendarTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [blocked, setBlocked] = useState<UnavailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CalendarEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [newBlockStart, setNewBlockStart] = useState("");
  const [newBlockEnd, setNewBlockEnd] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [schedule, setSchedule] = useState<AvailabilityConfig>(emptyAvailability());
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [syncingSeats, setSyncingSeats] = useState(false);

  // Filters & Pagination state for Tour Calendar
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Dynamically extract all years from calendar entries
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear.toString());
    years.add((currentYear + 1).toString());

    for (const entry of entries) {
      if (entry.tour_date) {
        const match = entry.tour_date.toString().match(/^(\d{4})/);
        if (match) years.add(match[1]);
      }
    }
    return Array.from(years).sort();
  }, [entries]);

  // Filtered calendar entries based on Year, Month, Status & "Available Only"
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const dateStr = item.tour_date ? item.tour_date.toString().slice(0, 10) : "";
      if (!dateStr) return false;

      if (selectedYear !== "all") {
        if (!dateStr.startsWith(selectedYear)) return false;
      }

      if (selectedMonth !== "all") {
        const m = dateStr.slice(5, 7);
        if (m !== selectedMonth) return false;
      }

      if (onlyAvailable) {
        if (item.status !== "available") return false;
      } else if (statusFilter !== "all") {
        if (item.status !== statusFilter) return false;
      }

      return true;
    });
  }, [entries, selectedYear, selectedMonth, onlyAvailable, statusFilter]);

  // Pagination calculation
  const total = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [selectedYear, selectedMonth, onlyAvailable, statusFilter, pageSize]);

  // Ensure current page does not exceed totalPages
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Paginated slice for current page
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page, pageSize]);

  const hasActiveFilters =
    selectedYear !== "all" ||
    selectedMonth !== "all" ||
    onlyAvailable ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
    setOnlyAvailable(false);
    setStatusFilter("all");
  };

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cal, unav, availability] = await Promise.all([getCalendar(tourId), getUnavailableDates(tourId), getAvailabilityConfig(tourId)]);
      setEntries(cal);
      setBlocked(unav);
      if (availability) setSchedule(availability);
    } catch {
      toastRef.current.error("Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleWeekday = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      frequency_days: prev.frequency_days.includes(day) ? prev.frequency_days.filter((d) => d !== day) : [...prev.frequency_days, day],
    }));
  };

  const saveSchedule = async () => {
    if (!schedule.availability_start_date || !schedule.availability_end_date) {
      toast.error("Set the Tour Start Date and Tour End Date.");
      return;
    }
    if (schedule.frequency && schedule.frequency_days.length === 0) {
      toast.error("Select at least one day of the week for the chosen frequency.");
      return;
    }
    setSavingSchedule(true);
    try {
      const targetSeats = sanitizeNumber(schedule.seats_per_occurrence) || 10;
      const saved = await saveAvailabilityConfig(tourId, {
        ...schedule,
        min_advance_booking_days: sanitizeNumber(schedule.min_advance_booking_days),
        agent_no_deposit_buffer_weeks: sanitizeNumber(schedule.agent_no_deposit_buffer_weeks),
        seats_per_occurrence: targetSeats,
      });
      setSchedule(saved);
      await load();
      toast.success(`Schedule saved. Calendar dates updated with ${targetSeats} available seats.`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      toast.error(message?.detail || message?.message || "Failed to save schedule.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const syncSeatsToAll = async () => {
    const targetSeats = sanitizeNumber(schedule.seats_per_occurrence) || 10;
    if (
      !(await confirm({
        title: "Apply Available Seats to All Dates",
        message: `Set available seats to ${targetSeats} for all unbooked dates in the calendar?`,
        confirmLabel: `Apply ${targetSeats} Seats`,
      }))
    ) {
      return;
    }

    setSyncingSeats(true);
    try {
      if (schedule.availability_start_date && schedule.availability_end_date) {
        await saveAvailabilityConfig(tourId, {
          ...schedule,
          min_advance_booking_days: sanitizeNumber(schedule.min_advance_booking_days),
          agent_no_deposit_buffer_weeks: sanitizeNumber(schedule.agent_no_deposit_buffer_weeks),
          seats_per_occurrence: targetSeats,
        });
      } else {
        const unbooked = entries.filter((e) => !e.booked_seats || e.booked_seats === 0);
        await Promise.all(
          unbooked.map((entry) =>
            entry.id
              ? updateCalendarEntry(tourId, entry.id, {
                  ...entry,
                  available_seats: targetSeats,
                  status: entry.status === "sold_out" ? "available" : entry.status,
                })
              : Promise.resolve()
          )
        );
      }
      await load();
      toast.success(`Updated all unbooked dates to ${targetSeats} available seats.`);
    } catch {
      toast.error("Failed to update seats for all dates.");
    } finally {
      setSyncingSeats(false);
    }
  };

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.tour_date) {
      toast.error("Select a date.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing, available_seats: sanitizeNumber(editing.available_seats), booked_seats: sanitizeNumber(editing.booked_seats) };
      if (editing.id) {
        const updated = await updateCalendarEntry(tourId, editing.id, payload);
        setEntries((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createCalendarEntry(tourId, payload);
        setEntries((prev) => [...prev, created]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch {
      toast.error("Failed.");
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: number) => {
    if (!(await confirm({ title: "Delete calendar entry", message: "Delete this calendar entry?", confirmLabel: "Delete", danger: true }))) return;
    try {
      await deleteCalendarEntry(tourId, id);
      setEntries((previousEntries) => previousEntries.filter((entry) => entry.id !== id));
    }
    catch {
      toast.error("Failed.");
    }
  };

  const datesInRange = (start: string, end: string) => {
    const dates: string[] = [];
    const cursor = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (cursor <= last) {
      dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const addBlock = async () => {
    if (!newBlockStart) {
      toast.error("Select a start date.");
      return;
    }
    const end = newBlockEnd || newBlockStart;
    if (end < newBlockStart) {
      toast.error("End date must be on or after the start date.");
      return;
    }
    setBlocking(true);
    try {
      const created = await Promise.all(
        datesInRange(newBlockStart, end).map((date) =>
          createUnavailableDate(tourId, { unavailable_date: date, reason: newBlockReason })
        )
      );
      setBlocked((prev) => [...prev, ...created]);
      setNewBlockStart("");
      setNewBlockEnd("");
      setNewBlockReason("");
      toast.success(created.length > 1 ? `${created.length} dates blocked.` : "Date blocked.");
    } catch {
      toast.error("Failed.");
    } finally {
      setBlocking(false);
    }
  };

  const removeBlock = async (id: number) => {
    try {
      await deleteUnavailableDate(tourId, id);
      setBlocked((previousDates) => previousDates.filter((date) => date.id !== id));
    }
    catch {
      toast.error("Failed.");
    }
  };

  if (loading) return <Loader label="Loading calendar..." />;

  return (
    <div className="space-y-6">
      {/* Recurring availability schedule */}
      <div className="rounded-2xl border border-dash-border bg-white p-6">
        <h2 className="text-xl font-bold text-dash-text">Tour Calendar &amp; Availability</h2>
        <p className="mt-1 text-sm text-dash-subtle">Set the dates and schedule when your tour is available.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour Start Date</span>
            <DatePicker
              value={schedule.availability_start_date?.slice(0, 10) ?? ""}
              onChange={(date) => setSchedule((p) => ({ ...p, availability_start_date: date || null }))}
              minDate={todayStr()}
              placeholder="Select start date"
            />
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour End Date</span>
            <DatePicker
              value={schedule.availability_end_date?.slice(0, 10) ?? ""}
              onChange={(date) => setSchedule((p) => ({ ...p, availability_end_date: date || null }))}
              minDate={schedule.availability_start_date?.slice(0, 10) || todayStr()}
              placeholder="Select end date"
            />
          </div>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Minimum Advance Booking (Days)</span>
            <input type="number" min={0} value={numberInputValue(schedule.min_advance_booking_days)}
              onChange={(e) => setSchedule((p) => ({ ...p, min_advance_booking_days: parseNumberInput(e.target.value) }))}
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            <span className="mt-1 block text-xs text-dash-subtle">
              {schedule.min_advance_booking_days > 0
                ? `Guests can book this tour from ${earliestBookableDate(schedule.min_advance_booking_days)} onwards.`
                : "Guests can book any available date immediately."}
            </span>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Agent No-Deposit Buffer (Weeks)</span>
            <input type="number" min={0} value={numberInputValue(schedule.agent_no_deposit_buffer_weeks)}
              onChange={(e) => setSchedule((p) => ({ ...p, agent_no_deposit_buffer_weeks: parseNumberInput(e.target.value) }))}
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            <span className="mt-1 block text-xs text-dash-subtle">
              An agent booking more than {schedule.agent_no_deposit_buffer_weeks} week{schedule.agent_no_deposit_buffer_weeks === 1 ? "" : "s"} before the Minimum Advance Booking cutoff can Reserve Now with no deposit; the balance is then due that many weeks before travel. Closer than that, agents only see Pay in Full Today.
            </span>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Available Seats</span>
            <input type="number" min={0} value={numberInputValue(schedule.seats_per_occurrence)}
              onChange={(e) => setSchedule((p) => ({ ...p, seats_per_occurrence: parseNumberInput(e.target.value) }))}
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            <span className="mt-1 block text-xs text-dash-subtle">Applied to each generated date below.</span>
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>How it works:</strong> Guests must book at least the number of days entered above in advance. For example, if you enter 90 days, the tour will be available for booking from the 91st day from today.
        </div>

        <div className="mt-5 rounded-xl border border-dash-border p-4">
          <h3 className="font-bold text-dash-text">Tour Frequency / Available Days</h3>
          <p className="text-sm text-dash-subtle">Choose how often the tour runs and select the days you are available.</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {FREQUENCIES.map((f) => (
              <button key={f.value} type="button"
                onClick={() => setSchedule((p) => ({ ...p, frequency: f.value, frequency_week: f.value === "weekly" ? null : p.frequency_week || 1 }))}
                className={`rounded-xl border-2 p-4 text-left transition ${schedule.frequency === f.value ? "border-dash-brand bg-dash-brand/5" : "border-dash-border hover:border-dash-brand/40"}`}
              >
                <span className={`block font-bold ${schedule.frequency === f.value ? "text-dash-brand" : "text-dash-text"}`}>{f.label}</span>
                <span className="text-xs text-dash-subtle">{f.note}</span>
              </button>
            ))}
          </div>

          {schedule.frequency && (
            <div className="mt-4 space-y-4">
              {schedule.frequency !== "weekly" && (
                <div>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Select Week</span>
                  <div className="flex flex-wrap gap-2">
                    {(schedule.frequency === "fortnightly" ? [1, 2] : [1, 2, 3, 4]).map((week) => (
                      <button key={week} type="button" onClick={() => setSchedule((p) => ({ ...p, frequency_week: week }))}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold ${schedule.frequency_week === week ? "border-dash-brand bg-dash-brand text-white" : "border-dash-border text-dash-text hover:bg-[#F2F4F7]"}`}>
                        Week {week}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Select Days of the Week</span>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <label key={day.value} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${schedule.frequency_days.includes(day.value) ? "border-dash-brand bg-dash-brand/5" : "border-dash-border"}`}>
                      <input type="checkbox" checked={schedule.frequency_days.includes(day.value)} onChange={() => toggleWeekday(day.value)} />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={saveSchedule} disabled={savingSchedule}
            className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            <Save size={14} /> {savingSchedule ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </div>

      {/* Available dates */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-dash-text">Tour Calendar</h2>
            <p className="mt-0.5 text-xs text-dash-subtle">
              Manage individual dates, seat capacities, and availability status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={syncSeatsToAll}
                disabled={syncingSeats}
                title={`Apply ${schedule.seats_per_occurrence || 10} available seats to all unbooked calendar dates`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text shadow-2xs hover:bg-slate-50 hover:border-dash-brand/50 transition cursor-pointer disabled:opacity-60"
              >
                <RotateCcw size={13} className={syncingSeats ? "animate-spin text-dash-brand" : "text-dash-muted"} />
                <span>Apply {schedule.seats_per_occurrence || 10} Seats to All</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing({ ...emptyEntry(), available_seats: schedule.seats_per_occurrence || 10 })}
              className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} /> Add Date
            </button>
          </div>
        </div>

        {/* Filter Bar when entries exist */}
        {entries.length > 0 && (
          <div className="mb-4 rounded-2xl border border-dash-border bg-white p-4 shadow-2xs">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Year selector */}
                <div className="flex items-center gap-1.5">
                  <label htmlFor="calendar-year-filter" className="text-xs font-bold text-dash-subtle uppercase">
                    Year:
                  </label>
                  <select
                    id="calendar-year-filter"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-semibold text-dash-text outline-none transition focus:border-dash-brand focus:ring-2 focus:ring-dash-brand/10 cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Month selector */}
                <div className="flex items-center gap-1.5">
                  <label htmlFor="calendar-month-filter" className="text-xs font-bold text-dash-subtle uppercase">
                    Month:
                  </label>
                  <select
                    id="calendar-month-filter"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-semibold text-dash-text outline-none transition focus:border-dash-brand focus:ring-2 focus:ring-dash-brand/10 cursor-pointer shadow-2xs"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-1.5">
                  <label htmlFor="calendar-status-filter" className="text-xs font-bold text-dash-subtle uppercase">
                    Status:
                  </label>
                  <select
                    id="calendar-status-filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      if (e.target.value !== "all") {
                        setOnlyAvailable(false);
                      }
                    }}
                    className="rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-semibold text-dash-text outline-none transition focus:border-dash-brand focus:ring-2 focus:ring-dash-brand/10 cursor-pointer shadow-2xs"
                  >
                    {STATUS_FILTER_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Available Only quick pill */}
                <button
                  type="button"
                  onClick={() => {
                    setOnlyAvailable((prev) => !prev);
                    if (!onlyAvailable) {
                      setStatusFilter("all");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    onlyAvailable
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 scale-[1.02]"
                      : "border border-dash-border bg-slate-50/80 text-dash-text hover:bg-white hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                >
                  <CheckCircle size={14} className={onlyAvailable ? "text-white" : "text-emerald-600"} />
                  <span>Available Only</span>
                </button>

                {/* Reset Filters button */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Right: Counter & Page Size */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <span data-testid="calendar-dates-count" className="text-xs text-dash-subtle font-medium">
                  Showing <strong className="text-dash-text font-bold">{filteredEntries.length}</strong> of{" "}
                  <strong className="text-dash-text font-bold">{entries.length}</strong> date{entries.length === 1 ? "" : "s"}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-dash-subtle font-medium">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-xl border border-dash-border bg-white px-2.5 py-1.5 text-xs font-semibold text-dash-text outline-none focus:border-dash-brand cursor-pointer shadow-2xs"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {entries.length === 0 && !editing && (
          <div className="rounded-xl border border-dashed border-dash-border p-8 text-center text-sm text-dash-subtle">
            No calendar entries yet.
          </div>
        )}

        {entries.length > 0 && filteredEntries.length === 0 && (
          <div className="rounded-xl border border-dashed border-dash-border bg-white p-8 text-center text-sm text-dash-subtle">
            <p className="font-semibold text-slate-700">No dates match your selected filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-dash-brand px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer"
            >
              <RotateCcw size={13} /> Clear Filters
            </button>
          </div>
        )}

        {filteredEntries.length > 0 && (
          <div className="rounded-xl border border-dash-border bg-white p-0">
            <DataTable
              ariaLabel="Tour Calendar"
              columns={[
                {
                  key: "date",
                  header: "Date",
                  render: (item) => (
                    <span className="font-semibold text-slate-900">
                      {item.tour_date?.toString().slice(0, 10)}
                    </span>
                  ),
                },
                { key: "available", header: "Available", render: (item) => item.available_seats },
                { key: "booked", header: "Booked", render: (item) => item.booked_seats },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                        item.status === "available"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.status === "sold_out"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : item.status === "blocked"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.status === "available"
                            ? "bg-emerald-600"
                            : item.status === "sold_out"
                              ? "bg-rose-600"
                              : item.status === "blocked"
                                ? "bg-slate-500"
                                : "bg-amber-600"
                        }`}
                      />
                      {item.status.replace("_", " ")}
                    </span>
                  ),
                },
              ]}
              rows={paginatedRows}
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              actions={(item) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...item })}
                    aria-label="Edit calendar entry"
                    title="Edit calendar entry"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-sky-50 hover:text-dash-brand-hover cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(item.id!)}
                    aria-label="Delete calendar entry"
                    title="Delete calendar entry"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            />
          </div>
        )}

        {editing && (
          <form onSubmit={saveEntry} className="mt-4 rounded-xl border-2 border-dash-brand bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">{editing.id ? "Edit Entry" : "New Calendar Entry"}</h3>
              <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Date</span>
                <DatePicker
                  value={editing.tour_date?.toString().slice(0, 10) ?? ""}
                  onChange={(date) => setEditing((previous) => previous ? { ...previous, tour_date: date || "" } : previous)}
                  minDate={todayStr()}
                  placeholder="Select date"
                  clearable={false}
                />
              </div>
              {[["available_seats", "Available seats"], ["booked_seats", "Booked seats"]].map(([key, lbl]) => (
                <label key={key}>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{lbl}</span>
                  <input type="number" value={numberInputValue((editing as Record<string, unknown>)[key] as number)}
                    onChange={(e) => setEditing((p) => p ? { ...p, [key]: parseNumberInput(e.target.value) } : p)}
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </label>
              ))}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
                <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Blocked dates */}
      <div className="rounded-xl border border-dash-border bg-white p-6">
        <h3 className="mb-4 font-bold text-dash-text">Blocked / Unavailable Dates</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <DatePicker value={newBlockStart} onChange={setNewBlockStart} minDate={todayStr()} placeholder="Start date" className="min-w-40 flex-1" />
          <DatePicker value={newBlockEnd} onChange={setNewBlockEnd} minDate={newBlockStart || todayStr()} placeholder="End date (optional)" clearable className="min-w-40 flex-1" />
          <input placeholder="Reason" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)}
            className="min-w-40 flex-1 rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
          <button type="button" onClick={addBlock} disabled={blocking}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">
            <Plus size={16} /> {blocking ? "Blocking..." : "Block"}
          </button>
        </div>
        {blocked.length === 0 ? (
          <p className="text-sm text-dash-subtle">No blocked dates.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blocked.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-sm">
                <span className="text-red-700 font-semibold">{d.unavailable_date?.toString().slice(0, 10)}</span>
                {d.reason && <span className="text-red-500">- {d.reason}</span>}
                <button type="button" onClick={() => removeBlock(d.id!)} className="text-red-400 hover:text-red-700"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
