"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LuBuilding as Building,
  LuCheck as Check,
  LuCircleCheck as CircleCheck,
  LuDownload as Download,
  LuEye as Eye,
  LuFileText as FileText,
  LuInfo as Info,
  LuPalette as Palette,
  LuRotateCcw as RotateCcw,
  LuSave as Save,
  LuShieldCheck as ShieldCheck,
  LuSlidersHorizontal as SlidersHorizontal,
  LuSparkles as Sparkles,
  LuUser as UserIcon,
} from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

export type TemplateKey = "customer_full" | "customer_deposit" | "agent_reserve" | "agent_full";

export interface TemplateConfig {
  id: TemplateKey;
  apiType: string;
  name: string;
  scenario: string;
  recipientCategory: "Customer" | "Travel Agent";
  docNumberPrefix: string;
  recipientType: "agent" | "customer";
  recipientHeader: "BILL TO" | "RECEIVED FROM";
  samplePaid: number;
  sampleDue: number;
  sampleTotal: number;
  sampleDueDate: string;
  bookingStatus: string;
  paymentStatus: string;
  badgeText: string;
  badgeColorClass: string;
  description: string;
  noteText: string;
  closingDisclaimer: string;
}

export const TEMPLATES: Record<TemplateKey, TemplateConfig> = {
  customer_full: {
    id: "customer_full",
    apiType: "customer_full_receipt",
    name: "PAYMENT RECEIPT",
    scenario: "Customer Full Payment",
    recipientCategory: "Customer",
    docNumberPrefix: "Receipt No.",
    recipientType: "customer",
    recipientHeader: "RECEIVED FROM",
    samplePaid: 1565.0,
    sampleDue: 0,
    sampleTotal: 1565.0,
    sampleDueDate: "",
    bookingStatus: "Booking Confirmed",
    paymentStatus: "Paid in Full",
    badgeText: "PAID",
    badgeColorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Official receipt acknowledging full online or card settlement by traveler",
    noteText: "Payment has been received in full for this booking. Thank you for choosing Tourvaa.",
    closingDisclaimer:
      "This receipt confirms payment received; it does not by itself confirm supplier acceptance if the booking status above is not confirmed.",
  },
  customer_deposit: {
    id: "customer_deposit",
    apiType: "deposit_receipt",
    name: "BOOKING INVOICE & PAYMENT RECEIPT",
    scenario: "Customer Deposit (Partial)",
    recipientCategory: "Customer",
    docNumberPrefix: "Document No.",
    recipientType: "customer",
    recipientHeader: "BILL TO",
    samplePaid: 450.0,
    sampleDue: 1115.0,
    sampleTotal: 1565.0,
    sampleDueDate: "2026-11-10",
    bookingStatus: "Booking Confirmed",
    paymentStatus: "Deposit Received",
    badgeText: "PARTIALLY PAID",
    badgeColorClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Initial deposit receipt documenting paid amount and remaining balance deadline",
    noteText:
      "Your payment of {{Currency}} {{Amount_Paid_To_Date}} has been received. The remaining balance of {{Currency}} {{Outstanding_Balance}} must be paid by {{Balance_Due_Date}}.",
    closingDisclaimer:
      "This document records the payment received to date and the remaining balance as at the issue date.",
  },
  agent_reserve: {
    id: "agent_reserve",
    apiType: "agent_reservation_invoice",
    name: "BOOKING INVOICE",
    scenario: "Agent Reserve Now",
    recipientCategory: "Travel Agent",
    docNumberPrefix: "Invoice No.",
    recipientType: "agent",
    recipientHeader: "BILL TO",
    samplePaid: 0,
    sampleDue: 1565.0,
    sampleTotal: 1565.0,
    sampleDueDate: "2026-11-05",
    bookingStatus: "Booking Confirmed",
    paymentStatus: "Outstanding",
    badgeText: "OUTSTANDING",
    badgeColorClass: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Payment request invoice issued after travel agent confirms booking reservation",
    noteText:
      "Your booking has been reserved. Full payment of {{Currency}} {{Outstanding_Balance}} is due by {{Payment_Due_Date}}. Please ensure payment is received by the due date. Any consequences of late or non-payment are subject to the applicable Tourvaa terms and booking conditions.",
    closingDisclaimer:
      "This invoice reflects the booking and payment information available at the issue date. Please retain it for your records.",
  },
  agent_full: {
    id: "agent_full",
    apiType: "agent_full_receipt",
    name: "PAYMENT RECEIPT",
    scenario: "Agent Full Settlement",
    recipientCategory: "Travel Agent",
    docNumberPrefix: "Receipt No.",
    recipientType: "agent",
    recipientHeader: "RECEIVED FROM",
    samplePaid: 1565.0,
    sampleDue: 0,
    sampleTotal: 1565.0,
    sampleDueDate: "",
    bookingStatus: "Booking Confirmed",
    paymentStatus: "Paid in Full",
    badgeText: "PAID",
    badgeColorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "B2B settlement payment receipt acknowledging agent balance clearance",
    noteText: "Payment has been received in full for this booking. Thank you for booking through Tourvaa.",
    closingDisclaimer:
      "This receipt confirms payment received; it does not by itself confirm supplier acceptance if the booking status above is not confirmed.",
  },
};

const THEME_PRESETS = [
  {
    name: "Tourvaa Navy & Teal",
    header: "#0B263D",
    primary: "#07566A",
    accent: "#159C96",
  },
  {
    name: "Modern Slate & Blue",
    header: "#0F172A",
    primary: "#1E293B",
    accent: "#2563EB",
  },
  {
    name: "Classic Emerald",
    header: "#0F3D2C",
    primary: "#1B5E46",
    accent: "#1E7A3D",
  },
];

const CURRENCY_OPTIONS = [
  { code: "AUD", label: "AUD ($) - Australian Dollar" },
  { code: "NZD", label: "NZD ($) - New Zealand Dollar" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "SGD", label: "SGD ($) - Singapore Dollar" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "JPY", label: "JPY (¥) - Japanese Yen" },
  { code: "AED", label: "AED (AED) - UAE Dirham" },
];

type SettingItem = {
  id: number;
  key: string;
  value: string | null;
  label: string;
  group: string;
};

type RealBooking = {
  id: number;
  booking_code?: string;
  tour_name?: string;
  currency?: string;
  total_cost?: string | number;
  base_amount?: string | number;
  optional_activity_amount?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  tour_start_date?: string;
  adults_count?: number;
  children_count?: number;
  customer?: {
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  agent?: {
    agent_name?: string;
    user?: {
      name?: string;
      email?: string;
    };
  };
};

export default function InvoiceTemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("customer_full");
  const [editorSection, setEditorSection] = useState<"sample" | "company" | "branding" | "copy">("sample");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Real bookings from API for quick loading
  const [realBookings, setRealBookings] = useState<RealBooking[]>([]);

  // Form state holding the editable settings
  const [form, setForm] = useState<Record<string, string>>({
    company_legal_name: "Tourvaa Ltd",
    company_address: "Level 1, 123 Queen Street, Auckland 1010, New Zealand",
    support_email: "support@tourvaa.com",
    website: "www.tourvaa.com",
    company_gst_number: "GST-987654321",
    invoice_brand_name: "Tourvaa",
    invoice_brand_tagline: "Curated journeys, effortlessly booked.",
    invoice_header_layout: "both",
    invoice_logo_url: "",
    invoice_header_color: "#0B263D",
    invoice_primary_color: "#07566A",
    invoice_accent_color: "#159C96",
    invoice_footer_thanks: "Thank you for booking with Tourvaa.",
    invoice_footer_legal: "This is a system-generated invoice and does not require a signature.",
    terms_url: "https://www.tourvaa.com/terms#cancellation-terms",
    payment_link: "https://www.tourvaa.com/payments?booking_id=sample",
  });

  // Fully dynamic simulation data for live preview & PDF generation
  const [sampleData, setSampleData] = useState({
    bookingCode: "TVA-BK-2026-0089",
    tourName: "Rotorua Geothermal & Maori Cultural Experience",
    travelDate: "2026-11-25",
    currency: "AUD",
    adults: 2,
    children: 1,
    leadTraveller: "David Miller",
    pickupLocation: "08:30 AM Hotel Lobby Pick-up",
    tourPrice: 1450.0,
    addonsTotal: 180.0,
    discountTotal: 65.0,
    taxAmount: 156.5,
    // Dynamic Recipient fields
    agentBusinessName: "Apex Voyages & Holidays Pty Ltd",
    agentContactName: "Sarah Jenkins",
    agentAddress: "45 St Georges Terrace, Perth WA 6000, Australia",
    agentEmail: "accounts@apexvoyages.com",
    agentPhone: "+61 8 9222 1100",
    customerName: "David & Emily Miller",
    customerAddress: "12 Ocean Drive, Manly NSW 2095, Australia",
    customerEmail: "david.miller@example.com",
    customerPhone: "+61 412 345 678",
  });

  const loadSettingsAndBookings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, bookingsRes] = await Promise.allSettled([
        api.get("/settings/"),
        api.get("/bookings", { params: { limit: 15 } }),
      ]);

      if (settingsRes.status === "fulfilled") {
        const items: SettingItem[] = settingsRes.value.data?.data || [];
        const values: Record<string, string> = {};
        items.forEach((item) => {
          if (item.value !== null && item.value !== undefined) {
            values[item.key] = item.value;
          }
        });
        setForm((prev) => ({ ...prev, ...values }));
      }

      if (bookingsRes.status === "fulfilled") {
        const bList: RealBooking[] = bookingsRes.value.data?.data || [];
        setRealBookings(bList);
      }
    } catch {
      // Fallback to initial defaults if settings fetch encounters an error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettingsAndBookings();
  }, [loadSettingsAndBookings]);

  const handleFieldChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSampleChange = (key: keyof typeof sampleData, value: string | number) => {
    setSampleData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectRealBooking = (bookingIdStr: string) => {
    if (!bookingIdStr) return;
    const bId = parseInt(bookingIdStr, 10);
    const b = realBookings.find((x) => x.id === bId);
    if (!b) return;

    const basePrice = typeof b.base_amount === "number" ? b.base_amount : parseFloat(String(b.base_amount || b.total_cost || 0));
    const addons = typeof b.optional_activity_amount === "number" ? b.optional_activity_amount : parseFloat(String(b.optional_activity_amount || 0));
    const discount = typeof b.discount_amount === "number" ? b.discount_amount : parseFloat(String(b.discount_amount || 0));
    const tax = typeof b.tax_amount === "number" ? b.tax_amount : parseFloat(String(b.tax_amount || 0));

    setSampleData((prev) => ({
      ...prev,
      bookingCode: b.booking_code || `TVA-BK-${b.id}`,
      tourName: b.tour_name || prev.tourName,
      currency: b.currency || prev.currency,
      travelDate: b.tour_start_date || prev.travelDate,
      adults: b.adults_count || prev.adults,
      children: b.children_count || prev.children,
      tourPrice: basePrice > 0 ? basePrice : prev.tourPrice,
      addonsTotal: addons,
      discountTotal: discount,
      taxAmount: tax,
      customerName: b.customer?.full_name || prev.customerName,
      customerEmail: b.customer?.email || prev.customerEmail,
      customerPhone: b.customer?.phone || prev.customerPhone,
      customerAddress: b.customer?.address || prev.customerAddress,
      agentBusinessName: b.agent?.agent_name || prev.agentBusinessName,
      agentContactName: b.agent?.user?.name || prev.agentContactName,
      agentEmail: b.agent?.user?.email || prev.agentEmail,
    }));

    setMessage({ type: "success", text: `Loaded real booking data for ${b.booking_code || `#${b.id}`}` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/settings/", { settings: form });
      setMessage({ type: "success", text: "Invoice template settings updated successfully across all 4 templates." });
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setMessage({ type: "error", text: "Failed to save settings. Please verify administrator permissions." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setForm((prev) => ({
      ...prev,
      company_legal_name: "Tourvaa Ltd",
      company_address: "Level 1, 123 Queen Street, Auckland 1010, New Zealand",
      support_email: "support@tourvaa.com",
      website: "www.tourvaa.com",
      company_gst_number: "GST-987654321",
      invoice_brand_name: "Tourvaa",
      invoice_brand_tagline: "Curated journeys, effortlessly booked.",
      invoice_header_layout: "both",
      invoice_header_color: "#0B263D",
      invoice_primary_color: "#07566A",
      invoice_accent_color: "#159C96",
      invoice_footer_thanks: "Thank you for booking with Tourvaa.",
      invoice_footer_legal: "This is a system-generated invoice and does not require a signature.",
    }));
    setMessage({ type: "success", text: "Reset fields to default Tourvaa brand template values." });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDownloadSamplePdf = async () => {
    setDownloadingPdf(true);
    try {
      const template = TEMPLATES[activeTemplate];
      const isAgent = template.recipientType === "agent";

      const recBiz = isAgent ? sampleData.agentBusinessName : "";
      const recContact = isAgent ? sampleData.agentContactName : sampleData.customerName;
      const recAddr = isAgent ? sampleData.agentAddress : sampleData.customerAddress;
      const recEmail = isAgent ? sampleData.agentEmail : sampleData.customerEmail;
      const recPhone = isAgent ? sampleData.agentPhone : sampleData.customerPhone;

      const params = new URLSearchParams({
        template_type: template.apiType,
        currency: sampleData.currency,
        tour_name: sampleData.tourName,
        booking_code: sampleData.bookingCode,
        recipient_business_name: recBiz,
        recipient_contact_name: recContact,
        recipient_address: recAddr,
        recipient_email: recEmail,
        recipient_phone: recPhone,
        tour_price: sampleData.tourPrice.toString(),
        addons_total: sampleData.addonsTotal.toString(),
        discount_total: sampleData.discountTotal.toString(),
        tax_amount: sampleData.taxAmount.toString(),
        adult_count: sampleData.adults.toString(),
        child_count: sampleData.children.toString(),
        travel_date: sampleData.travelDate,
        lead_traveller: sampleData.leadTraveller,
        pickup: sampleData.pickupLocation,
      });

      const res = await api.get(`/invoices/sample-pdf?${params.toString()}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tourvaa_${template.apiType}_${sampleData.currency}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", text: "Failed to download sample PDF. Ensure backend server is running." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const currentTemplate = TEMPLATES[activeTemplate];

  // Calculated dynamic amounts
  const calculatedBookingTotal = Math.max(0, sampleData.tourPrice + sampleData.addonsTotal - sampleData.discountTotal);
  const isAgent = currentTemplate.recipientType === "agent";
  const isReserve = activeTemplate === "agent_reserve";
  const isDeposit = activeTemplate === "customer_deposit";
  const isFull = activeTemplate === "agent_full" || activeTemplate === "customer_full";

  const displayPaid = isReserve
    ? 0
    : isDeposit
    ? Math.min(calculatedBookingTotal * 0.3, calculatedBookingTotal)
    : calculatedBookingTotal;

  const displayDue = isFull ? 0 : Math.max(0, calculatedBookingTotal - displayPaid);

  const formatMoney = (val: number) => {
    return `${sampleData.currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const templateList = Object.values(TEMPLATES);

  if (loading) {
    return <Loader label="Loading invoice template settings..." fullScreen />;
  }

  return (
    <ModuleWrapper title="Invoice Templates" requiredPermission={["invoices.view", "settings.view"]}>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <section className="rounded-2xl border border-sky-100 bg-gradient-to-r from-[#F4F9FD] via-white to-[#F0F7FC] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-sky-100/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-dash-brand">
                <Sparkles size={13} />
                Financial Document Engine
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
                Invoice &amp; Receipt Templates
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-dash-muted">
                Review and customize Tourvaa&rsquo;s 4 core approved financial documents: Customer Full Payment Receipt, Customer Deposit &amp; Schedule, Agent Reservation Invoice, and Agent Settlement Receipt.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadSamplePdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                title="Download this template as a compiled PDF"
              >
                <Download size={15} />
                {downloadingPdf ? "Generating..." : `Download Test PDF (${sampleData.currency})`}
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                title="Reset colors and company labels to defaults"
              >
                <RotateCcw size={14} />
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#07566A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B263D] disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? "Saving Changes..." : "Save Template Settings"}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mt-4 rounded-xl border p-3 text-xs font-semibold ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Compliance & Standards Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-sky-100/80 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
              <ShieldCheck size={14} /> 4 Core Approved Templates
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
              <CircleCheck size={14} /> Booking &amp; Payment Status Separation
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
              Zero Internal Commission Disclosed
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800">
              Multi-Currency &amp; Dynamic Bill-To
            </span>
          </div>
        </section>

        {/* 4 Core Template Selector Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {templateList.map((t) => {
            const isSelected = activeTemplate === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTemplate(t.id)}
                className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-[#07566A] bg-white shadow-md ring-2 ring-[#07566A]/15"
                    : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? "bg-[#07566A] text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t.recipientCategory}
                  </span>
                  <FileText className={isSelected ? "text-[#07566A]" : "text-slate-400"} size={17} />
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{t.name}</h3>
                <span className="text-[11px] font-semibold text-slate-600">{t.scenario}</span>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                  {t.description}
                </p>
                <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-slate-100 text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-bold border ${t.badgeColorClass}`}>
                    {t.badgeText}
                  </span>
                  <span className="font-mono text-slate-400">{t.docNumberPrefix}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column: Left Editor, Right Live Preview */}
        <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
          {/* Left Column: Config Editor */}
          <div className="space-y-4">
            {/* Sub-navigation for Editor Sections */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              {[
                { id: "sample", label: "Dynamic Data", icon: SlidersHorizontal },
                { id: "company", label: "Company", icon: Building },
                { id: "branding", label: "Branding", icon: Palette },
                { id: "copy", label: "Copy & Notes", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = editorSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditorSection(tab.id as typeof editorSection)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Section: Dynamic Preview Simulation Data */}
            {editorSection === "sample" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Preview Simulation Data</h3>
                  <p className="text-xs text-slate-500">
                    Adjust mock amounts and booking details to see how the layout handles diverse figures.
                  </p>
                </div>

                {/* Quick Auto-Fill from Real Bookings */}
                {realBookings.length > 0 && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-dash-brand flex items-center gap-1">
                      <Sparkles size={13} />
                      Auto-Fill From Real Platform Booking
                    </span>
                    <select
                      onChange={(e) => handleSelectRealBooking(e.target.value)}
                      defaultValue=""
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                    >
                      <option value="">-- Choose a real booking from database --</option>
                      {realBookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          #{b.id} - {b.booking_code || `TVA-${b.id}`} | {b.tour_name || "Tour"} ({b.currency || "AUD"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Dynamic Currency & Booking Reference */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">CURRENCY</span>
                      <select
                        value={sampleData.currency}
                        onChange={(e) => handleSampleChange("currency", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#07566A]"
                      >
                        {CURRENCY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">BOOKING REF</span>
                      <input
                        type="text"
                        value={sampleData.bookingCode}
                        onChange={(e) => handleSampleChange("bookingCode", e.target.value)}
                        placeholder="e.g. TVA-BK-2026-0089"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </label>
                  </div>

                  {/* Dynamic Tour Name */}
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">TOUR NAME</span>
                    <input
                      type="text"
                      value={sampleData.tourName}
                      onChange={(e) => handleSampleChange("tourName", e.target.value)}
                      placeholder="e.g. Rotorua Geothermal & Maori Cultural Experience"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  {/* Price Calculation inputs */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Price Components ({sampleData.currency})
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Tour Price</span>
                        <input
                          type="number"
                          value={sampleData.tourPrice}
                          onChange={(e) => handleSampleChange("tourPrice", parseFloat(e.target.value) || 0)}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Add-ons</span>
                        <input
                          type="number"
                          value={sampleData.addonsTotal}
                          onChange={(e) => handleSampleChange("addonsTotal", parseFloat(e.target.value) || 0)}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Discount</span>
                        <input
                          type="number"
                          value={sampleData.discountTotal}
                          onChange={(e) => handleSampleChange("discountTotal", parseFloat(e.target.value) || 0)}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">GST / Tax</span>
                        <input
                          type="number"
                          value={sampleData.taxAmount}
                          onChange={(e) => handleSampleChange("taxAmount", parseFloat(e.target.value) || 0)}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Dynamic Recipient Details */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <UserIcon size={14} className="text-[#07566A]" />
                        {currentTemplate.recipientHeader} ({currentTemplate.recipientCategory})
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isAgent ? "Agent Entity" : "Registered Customer"}
                      </span>
                    </div>

                    {isAgent ? (
                      <div className="space-y-2">
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Agent Business Name</span>
                          <input
                            type="text"
                            value={sampleData.agentBusinessName}
                            onChange={(e) => handleSampleChange("agentBusinessName", e.target.value)}
                            placeholder="Apex Voyages & Holidays Pty Ltd"
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Attn: Billing Contact</span>
                          <input
                            type="text"
                            value={sampleData.agentContactName}
                            onChange={(e) => handleSampleChange("agentContactName", e.target.value)}
                            placeholder="Sarah Jenkins"
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Business Address</span>
                          <textarea
                            rows={2}
                            value={sampleData.agentAddress}
                            onChange={(e) => handleSampleChange("agentAddress", e.target.value)}
                            placeholder="45 St Georges Terrace, Perth WA 6000, Australia"
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Billing Email</span>
                            <input
                              type="email"
                              value={sampleData.agentEmail}
                              onChange={(e) => handleSampleChange("agentEmail", e.target.value)}
                              placeholder="accounts@apexvoyages.com"
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Billing Phone</span>
                            <input
                              type="text"
                              value={sampleData.agentPhone}
                              onChange={(e) => handleSampleChange("agentPhone", e.target.value)}
                              placeholder="+61 8 9222 1100"
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Customer Full Name</span>
                          <input
                            type="text"
                            value={sampleData.customerName}
                            onChange={(e) => handleSampleChange("customerName", e.target.value)}
                            placeholder="David & Emily Miller"
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Billing Address</span>
                          <textarea
                            rows={2}
                            value={sampleData.customerAddress}
                            onChange={(e) => handleSampleChange("customerAddress", e.target.value)}
                            placeholder="12 Ocean Drive, Manly NSW 2095, Australia"
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Billing Email</span>
                            <input
                              type="email"
                              value={sampleData.customerEmail}
                              onChange={(e) => handleSampleChange("customerEmail", e.target.value)}
                              placeholder="david.miller@example.com"
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Billing Phone</span>
                            <input
                              type="text"
                              value={sampleData.customerPhone}
                              onChange={(e) => handleSampleChange("customerPhone", e.target.value)}
                              placeholder="+61 412 345 678"
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Lead Traveller Name</span>
                            <input
                              type="text"
                              value={sampleData.leadTraveller}
                              onChange={(e) => handleSampleChange("leadTraveller", e.target.value)}
                              placeholder="David Miller"
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Pickup Location</span>
                            <input
                              type="text"
                              value={sampleData.pickupLocation}
                              onChange={(e) => handleSampleChange("pickupLocation", e.target.value)}
                              placeholder="08:30 AM Hotel Lobby"
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Travel details */}
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Travel Date</span>
                      <input
                        type="date"
                        value={sampleData.travelDate}
                        onChange={(e) => handleSampleChange("travelDate", e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Adults</span>
                      <input
                        type="number"
                        min={1}
                        value={sampleData.adults}
                        onChange={(e) => handleSampleChange("adults", parseInt(e.target.value, 10) || 1)}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Children</span>
                      <input
                        type="number"
                        min={0}
                        value={sampleData.children}
                        onChange={(e) => handleSampleChange("children", parseInt(e.target.value, 10) || 0)}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Company & Statutory Entity Details (FROM Panel) */}
            {editorSection === "company" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Legal Business &amp; Entity (FROM Box)</h3>
                  <p className="text-xs text-slate-500">
                    Appears in the left &ldquo;FROM&rdquo; panel on every invoice and receipt.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Legal Business Name</span>
                    <input
                      type="text"
                      value={form.company_legal_name || ""}
                      onChange={(e) => handleFieldChange("company_legal_name", e.target.value)}
                      placeholder="e.g. Tourvaa Ltd"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Business Address</span>
                    <textarea
                      rows={2}
                      value={form.company_address || ""}
                      onChange={(e) => handleFieldChange("company_address", e.target.value)}
                      placeholder="Level 1, 123 Queen Street, Auckland 1010, New Zealand"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Support Email</span>
                      <input
                        type="email"
                        value={form.support_email || ""}
                        onChange={(e) => handleFieldChange("support_email", e.target.value)}
                        placeholder="support@tourvaa.com"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Website URL</span>
                      <input
                        type="text"
                        value={form.website || ""}
                        onChange={(e) => handleFieldChange("website", e.target.value)}
                        placeholder="www.tourvaa.com"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">GST / Tax Number</span>
                      <span className="text-[10px] text-slate-400">Omitted if blank (Statutory)</span>
                    </div>
                    <input
                      type="text"
                      value={form.company_gst_number || ""}
                      onChange={(e) => handleFieldChange("company_gst_number", e.target.value)}
                      placeholder="e.g. GST-987654321"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Section: Branding & Appearance */}
            {editorSection === "branding" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Header Branding &amp; Palette</h3>
                  <p className="text-xs text-slate-500">Customize the top brand logo and table bar colors.</p>
                </div>

                {/* Theme presets */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Color Presets</span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {THEME_PRESETS.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            invoice_header_color: t.header,
                            invoice_primary_color: t.primary,
                            invoice_accent_color: t.accent,
                          }));
                        }}
                        className="rounded-xl border border-slate-200 p-2 text-left transition hover:border-slate-300"
                      >
                        <div className="flex h-4 w-full gap-1 overflow-hidden rounded">
                          <span className="flex-1" style={{ backgroundColor: t.header }} />
                          <span className="flex-1" style={{ backgroundColor: t.primary }} />
                          <span className="flex-1" style={{ backgroundColor: t.accent }} />
                        </div>
                        <span className="mt-1 block text-[10px] font-semibold text-slate-700 truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Header Bar Color</span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={form.invoice_header_color || "#0B263D"}
                        onChange={(e) => handleFieldChange("invoice_header_color", e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={form.invoice_header_color || "#0B263D"}
                        onChange={(e) => handleFieldChange("invoice_header_color", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Accent Highlight</span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={form.invoice_accent_color || "#159C96"}
                        onChange={(e) => handleFieldChange("invoice_accent_color", e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={form.invoice_accent_color || "#159C96"}
                        onChange={(e) => handleFieldChange("invoice_accent_color", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-[#07566A]"
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Brand Name</span>
                    <input
                      type="text"
                      value={form.invoice_brand_name || ""}
                      onChange={(e) => handleFieldChange("invoice_brand_name", e.target.value)}
                      placeholder="Tourvaa"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Brand Tagline</span>
                    <input
                      type="text"
                      value={form.invoice_brand_tagline || ""}
                      onChange={(e) => handleFieldChange("invoice_brand_tagline", e.target.value)}
                      placeholder="Curated journeys, effortlessly booked."
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Logo Image URL</span>
                    <input
                      type="text"
                      value={form.invoice_logo_url || ""}
                      onChange={(e) => handleFieldChange("invoice_logo_url", e.target.value)}
                      placeholder="https://... or /logo.png"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Section: Text Copy & Footers */}
            {editorSection === "copy" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Standard Footers &amp; Disclaimers</h3>
                  <p className="text-xs text-slate-500">Legal notices printed at the base of every document.</p>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Thank-You Line</span>
                    <input
                      type="text"
                      value={form.invoice_footer_thanks || ""}
                      onChange={(e) => handleFieldChange("invoice_footer_thanks", e.target.value)}
                      placeholder="Thank you for booking with Tourvaa."
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Legal Disclaimer Notice</span>
                    <textarea
                      rows={3}
                      value={form.invoice_footer_legal || ""}
                      onChange={(e) => handleFieldChange("invoice_footer_legal", e.target.value)}
                      placeholder="This is a system-generated invoice and does not require a signature."
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Terms &amp; Conditions URL</span>
                    <input
                      type="text"
                      value={form.terms_url || ""}
                      onChange={(e) => handleFieldChange("terms_url", e.target.value)}
                      placeholder="https://www.tourvaa.com/terms#cancellation-terms"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Payment Link Template</span>
                    <input
                      type="text"
                      value={form.payment_link || ""}
                      onChange={(e) => handleFieldChange("payment_link", e.target.value)}
                      placeholder="https://www.tourvaa.com/payments?booking_id={booking_code}"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#07566A]"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Dynamic Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Dynamic PDF Canvas ({sampleData.currency})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Standard A4 Preview (Print Ready)</span>
            </div>

            {/* A4 Paper Card Canvas */}
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl transition-all">
              {/* Printable Body Margin */}
              <div className="p-6 sm:p-8 space-y-5 text-slate-800">
                {/* 1. Header Row */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight" style={{ color: form.invoice_header_color || "#0B263D" }}>
                      {currentTemplate.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      {currentTemplate.docNumberPrefix} TVA-2026-0001 &nbsp;|&nbsp; Issued 2026-10-28
                    </p>
                  </div>

                  <div className="text-right">
                    {form.invoice_logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.invoice_logo_url} alt="Logo" className="max-h-10 max-w-[140px] object-contain ml-auto" />
                    ) : (
                      <span
                        className="text-2xl font-black uppercase tracking-wider"
                        style={{ color: form.invoice_header_color || "#0B263D" }}
                      >
                        {form.invoice_brand_name || "TOURVAA"}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{form.invoice_brand_tagline}</p>
                  </div>
                </div>

                {/* 2. FROM & BILL TO / RECEIVED FROM Panels */}
                <div className="grid grid-cols-2 gap-4">
                  {/* FROM Box */}
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div
                      className="px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: form.invoice_header_color || "#0B263D" }}
                    >
                      FROM
                    </div>
                    <div className="bg-slate-50/50 p-3 text-xs space-y-1 text-slate-700">
                      <p className="font-bold text-slate-900">{form.company_legal_name || "Tourvaa Ltd"}</p>
                      <p className="text-slate-600 whitespace-pre-line">{form.company_address}</p>
                      <p className="text-slate-600">
                        {form.support_email} | {form.website}
                      </p>
                      {form.company_gst_number && (
                        <p className="font-semibold text-slate-800">GST No.: {form.company_gst_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic BILL TO / RECEIVED FROM Box */}
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div
                      className="px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: form.invoice_header_color || "#0B263D" }}
                    >
                      {currentTemplate.recipientHeader}
                    </div>
                    <div className="bg-slate-50/50 p-3 text-xs space-y-1 text-slate-700">
                      <p className="font-bold text-slate-900">
                        {isAgent
                          ? sampleData.agentBusinessName || "Apex Voyages & Holidays Pty Ltd"
                          : sampleData.customerName || "David & Emily Miller"}
                      </p>
                      {isAgent && sampleData.agentContactName && (
                        <p className="text-slate-600">
                          Attn: {sampleData.agentContactName}
                        </p>
                      )}
                      {(isAgent ? sampleData.agentAddress : sampleData.customerAddress) && (
                        <p className="text-slate-600 whitespace-pre-line">
                          {isAgent ? sampleData.agentAddress : sampleData.customerAddress}
                        </p>
                      )}
                      {(isAgent ? sampleData.agentEmail : sampleData.customerEmail) && (
                        <p className="text-slate-600">
                          {isAgent ? sampleData.agentEmail : sampleData.customerEmail}
                        </p>
                      )}
                      {(isAgent ? sampleData.agentPhone : sampleData.customerPhone) && (
                        <p className="text-slate-600">
                          {isAgent ? sampleData.agentPhone : sampleData.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic BOOKING DETAILS */}
                <div>
                  <h4
                    className="text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: form.invoice_header_color || "#0B263D" }}
                  >
                    BOOKING DETAILS
                  </h4>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead
                        className="text-[11px] font-bold uppercase text-white"
                        style={{ backgroundColor: form.invoice_header_color || "#0B263D" }}
                      >
                        <tr>
                          <th className="px-3 py-2">Booking Reference</th>
                          <th className="px-3 py-2">Tour</th>
                          <th className="px-3 py-2">Travel Date</th>
                          <th className="px-3 py-2">Travellers</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white text-slate-700">
                        <tr className="border-t border-slate-200">
                          <td className="px-3 py-2.5 font-medium">{sampleData.bookingCode}</td>
                          <td className="px-3 py-2.5 font-medium">{sampleData.tourName}</td>
                          <td className="px-3 py-2.5 font-medium">{sampleData.travelDate}</td>
                          <td className="px-3 py-2.5 font-medium">
                            {sampleData.adults} adults, {sampleData.children} children
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {!isAgent && (
                    <div className="mt-1.5 flex flex-wrap gap-4 text-[11px] text-slate-600">
                      <span>
                        <strong>Lead traveller:</strong> {sampleData.leadTraveller}
                      </span>
                      <span>
                        <strong>Start / Pickup:</strong> {sampleData.pickupLocation}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Dynamic PRICE SUMMARY */}
                <div>
                  <h4
                    className="text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: form.invoice_header_color || "#0B263D" }}
                  >
                    PRICE SUMMARY
                  </h4>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead
                        className="text-[11px] font-bold uppercase text-white"
                        style={{ backgroundColor: form.invoice_header_color || "#0B263D" }}
                      >
                        <tr>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Quantity</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                        <tr>
                          <td className="px-3 py-2">Total Tour Price</td>
                          <td className="px-3 py-2">{sampleData.adults + sampleData.children} travellers</td>
                          <td className="px-3 py-2 text-right font-medium">{formatMoney(sampleData.tourPrice)}</td>
                        </tr>
                        {sampleData.addonsTotal > 0 && (
                          <tr>
                            <td className="px-3 py-2">Add-ons / extras</td>
                            <td className="px-3 py-2">Included</td>
                            <td className="px-3 py-2 text-right font-medium">{formatMoney(sampleData.addonsTotal)}</td>
                          </tr>
                        )}
                        {sampleData.discountTotal > 0 && (
                          <tr>
                            <td className="px-3 py-2">Discount</td>
                            <td className="px-3 py-2">%</td>
                            <td className="px-3 py-2 text-right font-medium text-emerald-700">
                              − {formatMoney(sampleData.discountTotal)}
                            </td>
                          </tr>
                        )}
                        {sampleData.taxAmount > 0 && (
                          <tr>
                            <td className="px-3 py-2">Including Tax</td>
                            <td className="px-3 py-2 font-medium text-red-600">
                              Included (do not add tax amount or percentage)
                            </td>
                            <td className="px-3 py-2 text-right font-medium">{formatMoney(sampleData.taxAmount)}</td>
                          </tr>
                        )}
                        <tr className="bg-[#EBF3F8] font-bold text-slate-900">
                          <td colSpan={2} className="px-3 py-2.5 uppercase tracking-wide">
                            TOTAL BOOKING AMOUNT
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm">{formatMoney(calculatedBookingTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Dynamic PAYMENT SUMMARY / RECEIPT SUMMARY */}
                <div>
                  <h4
                    className="text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: form.invoice_header_color || "#0B263D" }}
                  >
                    {isFull ? "PAYMENT RECEIPT SUMMARY" : "PAYMENT SUMMARY"}
                  </h4>

                  {/* Summary Table 1 */}
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead
                        className="text-[11px] font-bold uppercase text-white"
                        style={{ backgroundColor: form.invoice_header_color || "#0B263D" }}
                      >
                        <tr>
                          <th className="px-3 py-2">{isFull ? "Description" : "Payment line"}</th>
                          <th className="px-3 py-2 text-right">{isFull ? "Amount" : "Amount / date"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                        {isFull ? (
                          <>
                            <tr>
                              <td className="px-3 py-2">Total booking amount</td>
                              <td className="px-3 py-2 text-right font-medium">{formatMoney(calculatedBookingTotal)}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Payment received</td>
                              <td className="px-3 py-2 text-right font-medium">{formatMoney(displayPaid)}</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold text-slate-900">
                              <td className="px-3 py-2">OUTSTANDING BALANCE</td>
                              <td className="px-3 py-2 text-right text-slate-900">{sampleData.currency} 0.00</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr>
                              <td className="px-3 py-2">
                                {isDeposit ? "Deposit / payment received" : "Amount paid to date"}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">{formatMoney(displayPaid)}</td>
                            </tr>
                            <tr className="font-bold text-red-600 bg-red-50/40">
                              <td className="px-3 py-2">BALANCE DUE</td>
                              <td className="px-3 py-2 text-right">{formatMoney(displayDue)}</td>
                            </tr>
                            {displayDue > 0 && currentTemplate.sampleDueDate && (
                              <tr>
                                <td className="px-3 py-2 font-bold text-slate-900">
                                  {isDeposit ? "BALANCE DUE DATE" : "PAYMENT DUE DATE"}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-900">
                                  {currentTemplate.sampleDueDate}
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Details Table for receipts or deposit */}
                  {(isFull || isDeposit) && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead
                          className="text-[10px] font-bold uppercase text-white"
                          style={{ backgroundColor: form.invoice_header_color || "#0B263D" }}
                        >
                          <tr>
                            <th className="px-3 py-1.5">{isDeposit ? "Deposit payment date" : "Payment date"}</th>
                            <th className="px-3 py-1.5">Payment method</th>
                            <th className="px-3 py-1.5">Transaction ID</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white text-slate-700">
                          <tr className="border-t border-slate-200">
                            <td className="px-3 py-2 font-medium">2026-10-28</td>
                            <td className="px-3 py-2 font-medium">
                              {isAgent ? "Stripe Credit Card" : isDeposit ? "Apple Pay" : "VISA Debit"}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                              ch_3Nxy1234567890abcdef
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Payment instructions note */}
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {currentTemplate.noteText
                      .replace("{{Currency}}", sampleData.currency)
                      .replace("{{Outstanding_Balance}}", displayDue.toFixed(2))
                      .replace("{{Payment_Due_Date}}", currentTemplate.sampleDueDate)
                      .replace("{{Balance_Due_Date}}", currentTemplate.sampleDueDate)
                      .replace("{{Amount_Paid_To_Date}}", displayPaid.toFixed(2))}
                  </p>

                  <div className="mt-1.5 flex items-center gap-3 text-xs font-semibold text-slate-700">
                    <span>
                      Booking status: <strong className="text-slate-900">{currentTemplate.bookingStatus}</strong>
                    </span>
                    <span>|</span>
                    <span>
                      Payment status: <strong className="text-slate-900">{currentTemplate.paymentStatus}</strong>
                    </span>
                  </div>
                </div>

                {/* 7. IMPORTANT BOOKING INFORMATION */}
                <div className="space-y-1.5 pt-1 text-xs text-slate-700">
                  <h4
                    className="font-bold uppercase tracking-wider text-[11px]"
                    style={{ color: form.invoice_header_color || "#0B263D" }}
                  >
                    IMPORTANT BOOKING INFORMATION
                  </h4>

                  <p>
                    Tourvaa General Terms and Conditions:{" "}
                    <a
                      href={form.terms_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#07566A] underline hover:text-[#0B263D]"
                    >
                      {form.terms_url}
                    </a>
                  </p>

                  <p>
                    Cancellation policy for {sampleData.tourName}: Free cancellation up to 7 days before tour departure.
                  </p>

                  <p>
                    For booking or payment queries, contact{" "}
                    <span className="font-medium text-[#07566A]">{form.support_email}</span>.
                  </p>

                  <p className="text-[11px] text-slate-500">{currentTemplate.closingDisclaimer}</p>

                  {activeTemplate === "customer_full" && (
                    <p className="text-[11px] italic text-slate-500">
                      Please note: Please check your pickup and itinerary details carefully before travel.
                    </p>
                  )}
                </div>

                {/* 8. Footer with Payment Link */}
                <div className="border-t border-slate-200 pt-3 text-center text-[11px] text-slate-500 space-y-1">
                  {displayDue > 0 && form.payment_link && (
                    <p className="font-bold text-[#07566A]">
                      Pay Balance Online:{" "}
                      <a href={form.payment_link} target="_blank" rel="noreferrer" className="underline hover:text-[#0B263D]">
                        {form.payment_link}
                      </a>
                    </p>
                  )}
                  <p className="font-medium">{form.invoice_footer_thanks}</p>
                  <p>
                    For booking or payment queries, contact {form.support_email} &nbsp;|&nbsp; {form.website}
                  </p>
                  <p className="text-[10px] text-slate-400">{form.invoice_footer_legal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleWrapper>
  );
}
