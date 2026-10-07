"use client";

import { useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2, LuLockKeyhole as LockKeyhole } from "react-icons/lu";
import axios from "axios";
import api from "@/lib/api/client";
import { useGeoCountries } from "@/hooks/useGeo";
import { useToast } from "@/hooks/useToast";

type InvoicingForm = {
  contact_name: string;
  email: string;
  phone: string;
  preferred_payment_method: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_branch: string;
  swift_code: string;
  iban: string;
  bank_country_id: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  country_id: string;
};

const emptyForm: InvoicingForm = {
  contact_name: "",
  email: "",
  phone: "",
  preferred_payment_method: "",
  account_name: "",
  account_number: "",
  bank_name: "",
  bank_branch: "",
  swift_code: "",
  iban: "",
  bank_country_id: "",
  billing_address: "",
  billing_city: "",
  billing_state: "",
  billing_postal_code: "",
  country_id: "",
};

function errorMessage(error: unknown) {
  return axios.isAxiosError(error)
    ? error.response?.data?.detail || error.response?.data?.message || "Could not save these details."
    : "Could not save these details.";
}

const fieldClass =
  "w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{children}</span>
);

export default function AgentBankAndInvoicingTab() {
  const toast = useToast();
  const { countries } = useGeoCountries();
  const [form, setForm] = useState<InvoicingForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [bankLocked, setBankLocked] = useState(false);
  const [primary, setPrimary] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    api
      .get("/agents/me")
      .then((response) => {
        const agent = response.data?.data ?? response.data ?? {};
        const invoice = agent.invoicing ?? {};
        const primaryContact = Array.isArray(agent.contacts)
          ? agent.contacts.find((c: { is_primary?: boolean }) => c.is_primary) ?? agent.contacts[0] ?? {}
          : agent.contact ?? {};

        setPrimary({
          name:
            primaryContact.contact_name ||
            [primaryContact.first_name, primaryContact.last_name].filter(Boolean).join(" "),
          email: primaryContact.email || "",
          phone: primaryContact.phone || "",
        });

        setForm({
          contact_name: invoice.contact_name || "",
          email: invoice.email || "",
          phone: invoice.phone || "",
          preferred_payment_method: invoice.preferred_payment_method || "",
          account_name: invoice.account_name || "",
          account_number: invoice.account_number || "",
          bank_name: invoice.bank_name || "",
          bank_branch: invoice.bank_branch || "",
          swift_code: invoice.swift_code || "",
          iban: invoice.iban || "",
          bank_country_id: String(invoice.bank_country_id || ""),
          billing_address: invoice.billing_address || "",
          billing_city: invoice.billing_city || "",
          billing_state: invoice.billing_state || "",
          billing_postal_code: invoice.billing_postal_code || "",
          country_id: String(invoice.country_id || agent.country_id || ""),
        });
        setBankLocked(Boolean(invoice.bank_details_locked));
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, [toast]);

  const set = (key: keyof InvoicingForm, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const copyPrimary = () =>
    setForm((previous) => ({
      ...previous,
      contact_name: primary.name,
      email: primary.email,
      phone: primary.phone,
    }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.contact_name || !form.email || !form.phone || !form.billing_address) {
      toast.error("Complete the required accounts and billing details.");
      return;
    }
    if (
      !bankLocked &&
      (!form.preferred_payment_method ||
        !form.account_name ||
        !form.account_number ||
        !form.bank_name)
    ) {
      toast.error("Complete all required bank details before saving.");
      return;
    }

    const invoicing: Record<string, string | number | null> = {
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone,
      billing_address: form.billing_address,
      billing_city: form.billing_city,
      billing_state: form.billing_state,
      billing_postal_code: form.billing_postal_code,
      country_id: form.country_id ? Number(form.country_id) : null,
    };

    if (!bankLocked) {
      Object.assign(invoicing, {
        preferred_payment_method: form.preferred_payment_method,
        account_name: form.account_name,
        account_number: form.account_number,
        bank_name: form.bank_name,
        bank_branch: form.bank_branch,
        swift_code: form.swift_code,
        iban: form.iban,
        bank_country_id: form.bank_country_id ? Number(form.bank_country_id) : null,
      });
    }

    setSaving(true);
    try {
      const response = await api.patch("/agents/me", { invoicing });
      const saved = response.data?.data?.invoicing;
      if (saved) {
        setForm((previous) => ({
          ...previous,
          account_number: saved.account_number || previous.account_number,
          iban: saved.iban || previous.iban,
          swift_code: saved.swift_code || previous.swift_code,
        }));
        setBankLocked(Boolean(saved.bank_details_locked));
      }
      toast.success("Bank, invoicing and billing details saved.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-dash-text">Invoicing &amp; Billing Details</h3>
        <p className="mt-1 text-sm text-dash-muted">
          All booking commission payouts, statements, and financial notices will be sent to this billing contact.
        </p>
      </div>

      <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dash-border pb-4">
          <h4 className="text-sm font-bold text-dash-text">Finance &amp; Accounts Contact</h4>
          {primary.name && (
            <button
              type="button"
              onClick={copyPrimary}
              className="text-xs font-bold text-dash-brand hover:underline"
            >
              Copy from primary contact
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Contact Name *</Label>
            <input
              required
              value={form.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
              placeholder="e.g. Finance Dept / John Doe"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <Label>Finance Email *</Label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="accounts@agency.com"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <Label>Finance Phone *</Label>
            <input
              required
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 234 567 8900"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <Label>Country</Label>
            <select
              value={form.country_id}
              onChange={(e) => set("country_id", e.target.value)}
              className={fieldClass}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <Label>Registered Billing Address *</Label>
            <input
              required
              value={form.billing_address}
              onChange={(e) => set("billing_address", e.target.value)}
              placeholder="Street address, suite, or building"
              className={fieldClass}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-dash-border pb-4">
          <div>
            <h4 className="text-sm font-bold text-dash-text">Bank Settlement Account</h4>
            <p className="mt-1 text-xs text-dash-muted">
              Used for Tourvaa commission payouts and booking credit settlements.
            </p>
          </div>
          {bankLocked && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
              <LockKeyhole size={13} /> Locked
            </span>
          )}
        </div>

        {bankLocked && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            Bank account, IBAN, and SWIFT/BIC values are masked after saving. To update banking details, please contact Tourvaa support.
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Preferred Settlement Method *</Label>
            <select
              disabled={bankLocked}
              value={form.preferred_payment_method}
              onChange={(e) => set("preferred_payment_method", e.target.value)}
              className={fieldClass}
            >
              <option value="">Select method</option>
              <option value="bank_transfer">Bank Transfer (Wire / ACH)</option>
              <option value="paypal">PayPal</option>
            </select>
          </label>
          <label className="block">
            <Label>Account Holder Name *</Label>
            <input
              disabled={bankLocked}
              value={form.account_name}
              onChange={(e) => set("account_name", e.target.value)}
              placeholder="Legal agency or individual name"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <Label>Bank Name *</Label>
            <input
              disabled={bankLocked}
              value={form.bank_name}
              onChange={(e) => set("bank_name", e.target.value)}
              placeholder="e.g. JPMorgan Chase / Barclays"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <Label>Bank Branch / City</Label>
            <input
              disabled={bankLocked}
              value={form.bank_branch}
              onChange={(e) => set("bank_branch", e.target.value)}
              placeholder="Branch name or location"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <Label>Account Number / IBAN *</Label>
            <input
              disabled={bankLocked}
              value={form.account_number}
              onChange={(e) => set("account_number", e.target.value)}
              placeholder="Bank account number or IBAN"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <Label>SWIFT / BIC Code</Label>
            <input
              disabled={bankLocked}
              value={form.swift_code}
              onChange={(e) => set("swift_code", e.target.value)}
              placeholder="8 or 11 character SWIFT code"
              className={fieldClass}
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-dash-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
          Save Bank &amp; Invoicing Details
        </button>
      </div>
    </form>
  );
}
