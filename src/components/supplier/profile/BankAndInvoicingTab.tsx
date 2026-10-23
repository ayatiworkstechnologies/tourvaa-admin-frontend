"use client";

import { useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2, LuLockKeyhole as LockKeyhole } from "react-icons/lu";
import axios from "axios";
import api from "@/lib/api/client";
import { useGeoCountries } from "@/hooks/useGeo";
import { useToast } from "@/hooks/useToast";
import CountryPhoneInput from "@/components/ui/CountryPhoneInput";
import { combinePhone, validateMobile } from "@/lib/utils/validators";
import { dialCodeForIso, isoForCountryCode, isoForDialCode } from "@/lib/utils/phoneCountries";
import type { CountryCode } from "libphonenumber-js/min";

type Form = {
  contact_name: string; email: string; phone: string;
  preferred_payment_method: string; account_name: string; account_number: string;
  bank_name: string; bank_branch: string; swift_code: string; iban: string;
  bank_country_id: string; billing_address: string; billing_city: string;
  billing_state: string; billing_postal_code: string; country_id: string;
};

const emptyForm: Form = {
  contact_name: "", email: "", phone: "", preferred_payment_method: "",
  account_name: "", account_number: "", bank_name: "", bank_branch: "", swift_code: "", iban: "", bank_country_id: "",
  billing_address: "", billing_city: "", billing_state: "", billing_postal_code: "", country_id: "",
};

function errorMessage(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.data?.detail || error.response?.data?.message || "Could not save these details." : "Could not save these details.";
}

const fieldClass = "w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
const Label = ({ children }: { children: React.ReactNode }) => <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{children}</span>;

export default function BankAndInvoicingTab({ onSaved }: { onSaved?: () => void }) {
  const toast = useToast();
  const { countries } = useGeoCountries();
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [bankLocked, setBankLocked] = useState(false);
  const [primary, setPrimary] = useState({ name: "", email: "", phone: "" });
  const [accountsPhoneCountryIso, setAccountsPhoneCountryIso] = useState<CountryCode>("IN");
  const [accountsPhoneNumber, setAccountsPhoneNumber] = useState("");

  useEffect(() => {
    api.get("/suppliers/me").then((response) => {
      const supplier = response.data?.data ?? response.data ?? {};
      const invoice = supplier.invoicing ?? {};
      const primaryContact = supplier.contacts?.find?.((contact: { is_primary?: boolean }) => contact.is_primary) ?? supplier.contacts?.[0] ?? {};
      if (invoice.phone) {
        const iso = isoForDialCode(invoice.phone);
        const dial = dialCodeForIso(iso);
        setAccountsPhoneCountryIso(iso);
        setAccountsPhoneNumber(invoice.phone.startsWith(dial) ? invoice.phone.slice(dial.length) : invoice.phone.replace(/^\+/, ""));
      }
      setPrimary({
        name: primaryContact.contact_name || [primaryContact.first_name, primaryContact.last_name].filter(Boolean).join(" "),
        email: primaryContact.email || "",
        phone: primaryContact.phone || "",
      });
      setForm({
        contact_name: invoice.contact_name || "", email: invoice.email || "", phone: invoice.phone || "",
        preferred_payment_method: invoice.preferred_payment_method || "", account_name: invoice.account_name || "",
        account_number: invoice.account_number || "", bank_name: invoice.bank_name || "", bank_branch: invoice.bank_branch || "",
        swift_code: invoice.swift_code || "", iban: invoice.iban || "", bank_country_id: String(invoice.bank_country_id || ""),
        billing_address: invoice.billing_address || "", billing_city: invoice.billing_city || "", billing_state: invoice.billing_state || "",
        billing_postal_code: invoice.billing_postal_code || "", country_id: String(invoice.country_id || supplier.country_id || ""),
      });
      setBankLocked(Boolean(invoice.bank_details_locked) && !invoice.bank_edit_unlocked);
    }).catch((error) => toast.error(errorMessage(error)));
  }, [toast]);

  const set = (key: keyof Form, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const copyPrimary = () => {
    const iso = isoForDialCode(primary.phone);
    const dial = dialCodeForIso(iso);
    setAccountsPhoneCountryIso(iso);
    setAccountsPhoneNumber(primary.phone.startsWith(dial) ? primary.phone.slice(dial.length) : primary.phone.replace(/^\+/, ""));
    setForm((previous) => ({ ...previous, contact_name: primary.name, email: primary.email, phone: primary.phone }));
  };

  async function requestBankDetailEdit() {
    try {
      await api.post("/suppliers/me/bank-details/edit-request");
      toast.success("Request sent. Tourvaa will review your bank-detail edit request.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (!form.contact_name || !form.email || !accountsPhoneNumber || !form.billing_address || !form.billing_city || !form.country_id) {
      toast.error("Complete the required accounts and billing details.");
      return;
    }
    const phone = combinePhone(dialCodeForIso(accountsPhoneCountryIso), accountsPhoneNumber);
    if (!validateMobile(phone, true)) {
      toast.error("Enter the accounts phone with its country code, for example +919876543210.");
      return;
    }
    if (!bankLocked && (!form.preferred_payment_method || !form.account_name || !form.account_number || !form.bank_name || !form.bank_branch || !form.bank_country_id)) {
      toast.error("Complete all required bank details before saving.");
      return;
    }
    const invoicing: Record<string, string | number | null> = {
      contact_name: form.contact_name, email: form.email, phone,
      billing_address: form.billing_address, billing_city: form.billing_city,
      billing_state: form.billing_state, billing_postal_code: form.billing_postal_code,
      country_id: Number(form.country_id),
    };
    if (!bankLocked) {
      Object.assign(invoicing, {
        preferred_payment_method: form.preferred_payment_method, account_name: form.account_name,
        account_number: form.account_number, bank_name: form.bank_name, bank_branch: form.bank_branch,
        swift_code: form.swift_code, iban: form.iban, bank_country_id: Number(form.bank_country_id),
      });
    }
    setSaving(true);
    try {
      const response = await api.patch("/suppliers/me", { invoicing });
      const saved = response.data?.data?.invoicing;
      if (saved) {
        setForm((previous) => ({ ...previous, account_number: saved.account_number || previous.account_number, iban: saved.iban || previous.iban }));
        setBankLocked(Boolean(saved.bank_details_locked));
      }
      toast.success("Bank, invoicing and billing details saved.");
      onSaved?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
    <section className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-dash-text">Bank Details</h3><p className="mt-1 text-sm text-dash-subtle">Your payment destination. Bank details are locked after the first save.</p></div>{bankLocked && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"><LockKeyhole size={13} /> Locked</span>}</div>
      {bankLocked && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Bank details have been saved and masked. <button type="button" onClick={requestBankDetailEdit} className="font-bold underline underline-offset-2">Request a one-time edit</button> for Tourvaa approval.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label><Label>Preferred Payment Method <b className="text-red-500">*</b></Label><select required disabled={bankLocked} value={form.preferred_payment_method} onChange={(e) => set("preferred_payment_method", e.target.value)} className={fieldClass}><option value="">Select payment method</option><option value="bank_transfer">Bank Transfer</option><option value="paypal">PayPal</option></select></label>
        <label><Label>Bank Account Name <b className="text-red-500">*</b></Label><input required disabled={bankLocked} value={form.account_name} onChange={(e) => set("account_name", e.target.value)} className={fieldClass} /></label>
        <label><Label>Bank Name <b className="text-red-500">*</b></Label><input required disabled={bankLocked} value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} className={fieldClass} /></label>
        <label><Label>Bank Country <b className="text-red-500">*</b></Label><select required disabled={bankLocked} value={form.bank_country_id} onChange={(e) => set("bank_country_id", e.target.value)} className={fieldClass}><option value="">Select country</option>{countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select></label>
        <label><Label>Bank Branch Address <b className="text-red-500">*</b></Label><input required disabled={bankLocked} value={form.bank_branch} onChange={(e) => set("bank_branch", e.target.value)} className={fieldClass} /></label>
        <label><Label>Account Number / IBAN <b className="text-red-500">*</b></Label><input required disabled={bankLocked} value={form.account_number} onChange={(e) => set("account_number", e.target.value)} className={fieldClass} /></label>
        <label><Label>SWIFT / BIC <span className="normal-case font-normal">(where applicable)</span></Label><input disabled={bankLocked} value={form.swift_code} onChange={(e) => set("swift_code", e.target.value)} className={fieldClass} /></label>
        <label><Label>IBAN <span className="normal-case font-normal">(where applicable)</span></Label><input disabled={bankLocked} value={form.iban} onChange={(e) => set("iban", e.target.value)} className={fieldClass} /></label>
      </div>
    </section>

    <section className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-dash-text">Invoicing & Accounts Details</h3><p className="mt-1 text-sm text-dash-subtle">All invoices will be emailed to this accounts contact.</p></div><button type="button" onClick={copyPrimary} className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50">Use Primary Contact</button></div><div className="grid gap-4 md:grid-cols-2"><label><Label>Accounts / Finance Contact Name <b className="text-red-500">*</b></Label><input required value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={fieldClass} /></label><label><Label>Accounts Email Address <b className="text-red-500">*</b></Label><input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={fieldClass} /></label><CountryPhoneInput className="md:col-span-2" countryIso={accountsPhoneCountryIso} number={accountsPhoneNumber} onCountryChange={setAccountsPhoneCountryIso} onNumberChange={setAccountsPhoneNumber} countryLabel="Accounts contact country" label="Accounts Phone Number *" required helpText="Select country code, then enter the local mobile number." /></div></section>

    <section className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm"><div className="mb-4"><h3 className="text-lg font-bold text-dash-text">Business Billing Address</h3><p className="mt-1 text-sm text-dash-subtle">The address that appears on invoices and billing records.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="md:col-span-2"><Label>Billing / Invoice Address <b className="text-red-500">*</b></Label><input required value={form.billing_address} onChange={(e) => set("billing_address", e.target.value)} className={fieldClass} /></label><label><Label>City <b className="text-red-500">*</b></Label><input required value={form.billing_city} onChange={(e) => set("billing_city", e.target.value)} className={fieldClass} /></label><label><Label>Country <b className="text-red-500">*</b></Label><select required value={form.country_id} onChange={(e) => { const countryId = e.target.value; const phoneIso = isoForCountryCode(countries.find((country) => String(country.id) === countryId)?.code); if (phoneIso) setAccountsPhoneCountryIso(phoneIso); set("country_id", countryId); }} className={fieldClass}><option value="">Select country</option>{countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select></label><label><Label>State / Province / Region <span className="normal-case font-normal">(conditional)</span></Label><input value={form.billing_state} onChange={(e) => set("billing_state", e.target.value)} className={fieldClass} /></label><label><Label>Postcode / ZIP Code <span className="normal-case font-normal">(conditional)</span></Label><input value={form.billing_postal_code} onChange={(e) => set("billing_postal_code", e.target.value)} className={fieldClass} /></label></div></section>
    <div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save Details</button></div>
  </form>;
}
