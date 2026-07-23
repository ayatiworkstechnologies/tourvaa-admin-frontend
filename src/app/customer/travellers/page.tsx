"use client";

import { useEffect, useState } from "react";
import { LuLoaderCircle as Loader2, LuPlus as Plus, LuTrash2 as Trash2, LuUsersRound as UsersRound } from "react-icons/lu";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";

type Traveller = {
  id: number;
  traveller_name: string;
  email?: string;
  phone?: string;
  traveller_type?: string;
  age?: number | null;
  gender?: string;
  passport_number?: string;
  allergies?: string;
  special_notes?: string;
};

const emptyForm = {
  traveller_name: "",
  email: "",
  phone: "",
  traveller_type: "adult",
  age: "",
  gender: "",
  passport_number: "",
  allergies: "",
  special_notes: "",
};

export default function CustomerTravellersPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Traveller[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/customer/travellers");
      setRows(res.data?.items ?? res.data?.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.traveller_name.trim()) return;
    setSaving(true);
    try {
      await api.post("/customer/travellers", { ...form, age: form.age ? Number(form.age) : null });
      setForm(emptyForm);
      toast.success("Traveller saved.");
      await load();
    } catch {
      toast.error("Could not save traveller.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setDeletingId(id);
    try {
      await api.delete(`/customer/travellers/${id}`);
      setRows((current) => current.filter((row) => row.id !== id));
      toast.success("Traveller removed.");
    } catch {
      toast.error("Could not remove traveller.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Travellers"
        description="Save traveller details once and reuse them for faster, more accurate bookings."
        icon={UsersRound}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[390px_1fr]">
        <form id="add-traveller" onSubmit={save} className="scroll-mt-28 rounded-2xl border border-[#DDE7F3] bg-white p-5 shadow-[0_8px_30px_-25px_rgba(24,68,126,.6)]">
          <div className="mb-5 flex items-center gap-3 border-b border-[#E6EDF6] pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0865D9]"><Plus size={18} /></span>
            <span><h2 className="font-black text-[#0C2043]">Add Traveller</h2><p className="mt-0.5 text-[10px] text-[#6B7F9D]">Create a reusable passenger profile</p></span>
          </div>
          <div className="space-y-3">
            <input required value={form.traveller_name} onChange={(e) => setForm((f) => ({ ...f, traveller_name: e.target.value }))} placeholder="Full name" className="customer-input w-full" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <select value={form.traveller_type} onChange={(e) => setForm((f) => ({ ...f, traveller_type: e.target.value }))} className="customer-input">
                <option value="adult">Adult</option>
                <option value="child">Child</option>
                <option value="infant">Infant</option>
              </select>
              <input value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value.replace(/\D/g, "") }))} placeholder="Age" className="customer-input" />
            </div>
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="customer-input w-full" />
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="customer-input w-full" />
            <input value={form.passport_number} onChange={(e) => setForm((f) => ({ ...f, passport_number: e.target.value }))} placeholder="Passport number" className="customer-input w-full" />
            <textarea value={form.special_notes} onChange={(e) => setForm((f) => ({ ...f, special_notes: e.target.value }))} placeholder="Special notes" rows={3} className="customer-input w-full resize-none" />
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0868E8] px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-[#075AC9] disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save Traveller
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-[#DDE7F3] bg-white shadow-[0_8px_30px_-25px_rgba(24,68,126,.6)]">
          <div className="border-b border-[#E6EDF6] px-5 py-4"><p className="font-black text-[#0C2043]">Saved Travellers</p><p className="mt-1 text-[10px] text-[#6B7F9D]">{rows.length} reusable profile{rows.length === 1 ? "" : "s"}</p></div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-dash-brand" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-dash-muted"><UsersRound className="mx-auto mb-3 text-dash-subtle" />No saved travellers yet.</div>
          ) : (
            <div className="divide-y divide-[#F0F2F5]">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-blue-50/35">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3FF] text-sm font-black text-[#0865D9]">{row.traveller_name.charAt(0).toUpperCase()}</span>
                    <span>
                    <p className="font-bold text-dash-text">{row.traveller_name}</p>
                    <p className="mt-0.5 text-xs capitalize text-dash-muted">{row.traveller_type || "traveller"}{row.age ? `, age ${row.age}` : ""}{row.passport_number ? `, passport ${row.passport_number}` : ""}</p>
                    {(row.email || row.phone) && <p className="mt-1 text-xs text-dash-subtle">{[row.email, row.phone].filter(Boolean).join(" | ")}</p>}
                    </span>
                  </div>
                  <button type="button" onClick={() => remove(row.id)} disabled={deletingId === row.id} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60">
                    {deletingId === row.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerPageShell>
  );
}
