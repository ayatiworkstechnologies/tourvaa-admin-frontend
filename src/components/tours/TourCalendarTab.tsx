"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { CalendarEntry, getCalendar, createCalendarEntry, updateCalendarEntry, deleteCalendarEntry, UnavailableDate, getUnavailableDates, createUnavailableDate, deleteUnavailableDate } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import DatePicker from "@/components/ui/DatePicker";

const STATUSES = ["available", "unavailable", "sold_out", "blocked"];
const emptyEntry = (): CalendarEntry => ({ tour_date: "", start_date: null, end_date: null, available_seats: 10, booked_seats: 0, status: "available" });

export default function TourCalendarTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [blocked, setBlocked] = useState<UnavailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CalendarEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cal, unav] = await Promise.all([getCalendar(tourId), getUnavailableDates(tourId)]);
      setEntries(cal);
      setBlocked(unav);
    } catch {
      toast.error("Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.tour_date) {
      toast.error("Select a date.");
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateCalendarEntry(tourId, editing.id, editing);
        setEntries((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createCalendarEntry(tourId, editing);
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

  const addBlock = async () => {
    if (!newBlockDate) {
      toast.error("Select a date.");
      return;
    }
    try {
      const d = await createUnavailableDate(tourId, { unavailable_date: newBlockDate, reason: newBlockReason });
      setBlocked((prev) => [...prev, d]);
      setNewBlockDate("");
      setNewBlockReason("");
      toast.success("Date blocked.");
    } catch {
      toast.error("Failed.");
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
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-dash-border p-1.5 hover:bg-[#F2F4F7]"><Pencil size={13} /></button>
                  <button type="button" onClick={() => removeEntry(item.id!)} className="rounded-lg border border-[#FFCDD2] p-1.5 text-red-500"><Trash2 size={13} /></button>
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
              {[["tour_date", "Tour date"], ["start_date", "Start date"], ["end_date", "End date"]].map(([key, lbl]) => (
                <div key={key}>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{lbl}</span>
                  <DatePicker
                    value={(editing as Record<string, unknown>)[key]?.toString().slice(0, 10) ?? ""}
                    onChange={(date) => setEditing((previous) => previous ? { ...previous, [key]: date || null } : previous)}
                    minDate={key === "end_date" ? editing.start_date?.toString().slice(0, 10) || undefined : undefined}
                    maxDate={key === "start_date" ? editing.end_date?.toString().slice(0, 10) || undefined : undefined}
                    placeholder={`Select ${lbl.toLowerCase()}`}
                    clearable={key !== "tour_date"}
                  />
                </div>
              ))}
              {[["available_seats", "Available seats"], ["booked_seats", "Booked seats"]].map(([key, lbl]) => (
                <label key={key}>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{lbl}</span>
                  <input type="number" value={(editing as Record<string, unknown>)[key] as number ?? 0}
                    onChange={(e) => setEditing((p) => p ? { ...p, [key]: Number(e.target.value) } : p)}
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
        <div className="flex gap-3 mb-4">
          <DatePicker value={newBlockDate} onChange={setNewBlockDate} placeholder="Select date to block" className="min-w-56 flex-1" />
          <input placeholder="Reason" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)}
            className="flex-1 rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
          <button type="button" onClick={addBlock}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600">
            <Plus size={16} /> Block
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
