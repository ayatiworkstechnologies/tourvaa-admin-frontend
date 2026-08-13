"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCreditCard as CreditCard, LuPlus as Plus, LuStar as Star, LuTrash2 as Trash2 } from "react-icons/lu";
import { useToast } from "@/hooks/useToast";
import {
  createPayoutMethod,
  deletePayoutMethod,
  getPayoutMethods,
  updatePayoutMethod,
  type AffiliatePayoutMethod,
} from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const inputCls = "w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100";
const labelCls = "mb-1 block text-xs font-bold text-dash-body";

export default function PayoutMethodsPage() {
  const toast = useToast();
  const [methods, setMethods] = useState<AffiliatePayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ method_type: "bank_transfer", account_holder_name: "", bank_name: "", account_number: "", ifsc: "", swift_code: "", bank_country: "", paypal_email: "", is_default: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMethods(await getPayoutMethods());
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not load payout methods.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPayoutMethod(form);
      toast.success("Payout method added.");
      setShowForm(false);
      setForm({ method_type: "bank_transfer", account_holder_name: "", bank_name: "", account_number: "", ifsc: "", swift_code: "", bank_country: "", paypal_email: "", is_default: false });
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not add payout method.");
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(id: number) {
    try {
      await updatePayoutMethod(id, { is_default: true });
      toast.success("Default payout method updated.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not update payout method.");
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Remove this payout method?")) return;
    try {
      await deletePayoutMethod(id);
      toast.success("Payout method removed.");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not remove payout method.");
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-dash-text">Payout Methods</h1>
          <p className="mt-1 text-sm text-dash-muted">Add a bank account or PayPal address to receive your commission payouts.</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
          <Plus size={16} /> Add Method
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Method Type</label>
              <select value={form.method_type} onChange={(e) => setForm((f) => ({ ...f, method_type: e.target.value }))} className={inputCls}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            {form.method_type === "paypal" ? (
              <div>
                <label className={labelCls}>PayPal Email</label>
                <input value={form.paypal_email} onChange={(e) => setForm((f) => ({ ...f, paypal_email: e.target.value }))} className={inputCls} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input value={form.account_holder_name} onChange={(e) => setForm((f) => ({ ...f, account_holder_name: e.target.value }))} className={inputCls} />
              </div>
            )}
            {form.method_type === "bank_transfer" && (
              <>
                <div>
                  <label className={labelCls}>Bank Name</label>
                  <input value={form.bank_name} onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Account Number</label>
                  <input value={form.account_number} onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>IFSC / Routing Code</label>
                  <input value={form.ifsc} onChange={(e) => setForm((f) => ({ ...f, ifsc: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>SWIFT Code</label>
                  <input value={form.swift_code} onChange={(e) => setForm((f) => ({ ...f, swift_code: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bank Country</label>
                  <input value={form.bank_country} onChange={(e) => setForm((f) => ({ ...f, bank_country: e.target.value }))} className={inputCls} />
                </div>
              </>
            )}
          </div>
          <label className="mt-4 flex items-center gap-2 text-xs font-bold text-dash-body">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} />
            Set as default payout method
          </label>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save Method"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:bg-white">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="animate-pulse rounded-xl border border-dash-border bg-white h-16" />)}</div>
      ) : methods.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D0D5DD] bg-white py-16 text-center">
          <CreditCard size={36} className="text-[#D0D5DD]" />
          <p className="mt-4 font-bold text-dash-text">No payout methods yet</p>
          <p className="mt-1 text-sm text-dash-muted">Add a payout method before requesting a payout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-dash-border bg-white p-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-dash-text capitalize">{m.method_type.replace("_", " ")}</p>
                  {m.is_default && <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700"><Star size={10} /> Default</span>}
                </div>
                <p className="mt-0.5 text-xs text-dash-muted">
                  {m.method_type === "paypal" ? m.paypal_email : `${m.bank_name || ""} · ${m.account_number_masked}`}
                </p>
              </div>
              <div className="flex gap-2">
                {!m.is_default && (
                  <button onClick={() => makeDefault(m.id)} className="rounded-lg border border-dash-border px-2.5 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg-muted">
                    Make Default
                  </button>
                )}
                <button onClick={() => remove(m.id)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
