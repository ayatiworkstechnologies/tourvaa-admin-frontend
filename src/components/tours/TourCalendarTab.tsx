"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { CalendarEntry, getCalendar, createCalendarEntry, updateCalendarEntry, deleteCalendarEntry, UnavailableDate, getUnavailableDates, createUnavailableDate, deleteUnavailableDate, AvailabilityConfig, getAvailabilityConfig, saveAvailabilityConfig } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DataTable from "@/components/ui/DataTable";
import DatePicker from "@/components/ui/DatePicker";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const STATUSES = ["available", "unavailable", "sold_out", "blocked"];
const emptyEntry = (): CalendarEntry => ({ tour_date: "", available_seats: 10, booked_seats: 0, status: "available" });

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cal, unav, availability] = await Promise.all([getCalendar(tourId), getUnavailableDates(tourId), getAvailabilityConfig(tourId)]);
      setEntries(cal);
      setBlocked(unav);
      if (availability) setSchedule(availability);
    } catch {
      toast.error("Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

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
      const saved = await saveAvailabilityConfig(tourId, {
        ...schedule,
        min_advance_booking_days: sanitizeNumber(schedule.min_advance_booking_days),
        agent_no_deposit_buffer_weeks: sanitizeNumber(schedule.agent_no_deposit_buffer_weeks),
        seats_per_occurrence: sanitizeNumber(schedule.seats_per_occurrence),
      });
      setSchedule(saved);
      await load();
      toast.success("Schedule saved. Calendar dates generated for the selected frequency.");
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      toast.error(message?.detail || message?.message || "Failed to save schedule.");
    } finally {
      setSavingSchedule(false);
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
    if (!confirm("Delete this calendar entry?")) return;
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dash-text">Tour Calendar</h2>
          <button type="button" onClick={() => setEditing(emptyEntry())}
            className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white">
            <Plus size={16} /> Add Date
          </button>
        </div>

        {entries.length === 0 && !editing && (
          <div className="rounded-xl border border-dashed border-dash-border p-8 text-center text-sm text-dash-subtle">No calendar entries yet.</div>
        )}

        {entries.length > 0 && (
          <div className="rounded-xl border border-dash-border bg-white p-0">
            <DataTable
              ariaLabel="Tour Calendar"
              columns={[
                { key: "date", header: "Date", render: (item) => item.tour_date?.toString().slice(0, 10) },
                { key: "available", header: "Available", render: (item) => item.available_seats },
                { key: "booked", header: "Booked", render: (item) => item.booked_seats },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === "available" ? "bg-green-100 text-green-700" : item.status === "sold_out" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {item.status}
                    </span>
                  ),
                },
              ]}
              rows={entries}
              actions={(item) => (
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setEditing({ ...item })} aria-label="Edit calendar entry" title="Edit calendar entry" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-sky-50 hover:text-dash-brand-hover"><Pencil size={15} /></button>
                  <button type="button" onClick={() => removeEntry(item.id!)} aria-label="Delete calendar entry" title="Delete calendar entry" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
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
    </div>
  );
}
