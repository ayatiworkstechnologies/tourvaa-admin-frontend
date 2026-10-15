"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowLeft as ArrowLeft,
  LuCalendar as Calendar,
  LuCalendarCheck as CalendarCheck,
  LuCalendarX as CalendarX,
  LuCircleCheckBig as CheckCircle2,
  LuCreditCard as CreditCard,
  LuMail as Mail,
  LuMapPin as MapPin,
  LuMessageSquare as MessageSquare,
  LuWallet as Wallet,
  LuCircleX as XCircle,
} from "react-icons/lu";
import { useParams } from "next/navigation";

import CustomerActionButtons from "@/components/customers/CustomerActionButtons";
import ActionModal from "@/components/operations/ActionModal";
import {
  CustomerBookingHistory,
  CustomerCommunicationHistory,
  CustomerPaymentHistory,
} from "@/components/customers/CustomerHistoryTables";
import CustomerProfileCard from "@/components/customers/CustomerProfileCard";
import SendCustomerMessageModal from "@/components/customers/SendCustomerMessageModal";
import LocationEditModal from "@/components/common/LocationEditModal";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";
import {
  blockCustomer,
  BookingHistory,
  Customer,
  CustomerCommunication,
  getCustomerBookings,
  getCustomerCommunications,
  getCustomerDetail,
  getCustomerPayments,
  PaymentHistory,
  resetCustomerPassword,
  sendCustomerMessage,
  unblockCustomer,
  updateCustomer,
} from "@/lib/api/services/customerService";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { hasPermission } = useAuthContext();
  const { format } = useCurrency();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [communications, setCommunications] = useState<CustomerCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "payments" | "communications">("bookings");

  const canEditLocation = hasPermission("customers.edit");
  const canBlock = hasPermission("customers.block") || hasPermission("customers.edit");
  const canUnblock = hasPermission("customers.unblock") || hasPermission("customers.edit");
  const canReset = hasPermission("customers.reset_password") || hasPermission("customers.edit");
  const canViewPayments = hasPermission("customers.view_payments") || hasPermission("customers.view");
  const canViewBookings = hasPermission("customers.view_bookings") || hasPermission("customers.view");
  const canViewCommunications =
    hasPermission("customers.view_communications") || hasPermission("customers.view");
  const canCommunicate = hasPermission("customers.communicate");

  const requestIdRef = useRef(0);

  const fetchCustomer = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const detail = await getCustomerDetail(customerId);
      if (requestIdRef.current !== requestId) return;
      setCustomer(detail);

      const [bookingResponse, paymentResponse, communicationResponse] = await Promise.all([
        canViewBookings ? getCustomerBookings(customerId) : Promise.resolve({ items: [] }),
        canViewPayments ? getCustomerPayments(customerId) : Promise.resolve({ items: [] }),
        canViewCommunications ? getCustomerCommunications(customerId) : Promise.resolve({ items: [] }),
      ]);
      if (requestIdRef.current !== requestId) return;
      setBookings(bookingResponse.items || []);
      setPayments(paymentResponse.items || []);
      setCommunications(communicationResponse.items || []);
    } catch {
      if (requestIdRef.current !== requestId) return;
      toast.error("Could not load customer.");
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [canViewBookings, canViewCommunications, canViewPayments, customerId, toast]);

  useEffect(() => {
    void fetchCustomer();
  }, [fetchCustomer]);

  const handleBlock = () => {
    if (!customer) return;
    setBlockModalOpen(true);
  };

  const submitBlock = async (payload: Record<string, string | number>) => {
    if (!customer) return;
    const reason = String(payload.reason || "").trim();
    if (!reason) return;

    setSaving(true);
    try {
      await blockCustomer(customer.id, reason);
      toast.success("Customer account blocked.");
      setBlockModalOpen(false);
      await fetchCustomer();
    } catch {
      toast.error("Could not block customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!customer) return;
    if (
      !(await confirm({
        title: "Unblock customer",
        message: "Are you sure you want to restore active access for this customer?",
        confirmLabel: "Unblock Customer",
      }))
    )
      return;

    setSaving(true);
    try {
      await unblockCustomer(customer.id);
      toast.success("Customer unblocked successfully.");
      await fetchCustomer();
    } catch {
      toast.error("Could not unblock customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!customer) return;
    if (
      !(await confirm({
        title: "Send password reset",
        message: `Send an official password reset link to ${customer.email}?`,
        confirmLabel: "Send Reset Link",
      }))
    )
      return;

    setSaving(true);
    try {
      await resetCustomerPassword(customer.id);
      toast.success("Password reset email sent.");
    } catch {
      toast.error("Could not send password reset email.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async (value: {
    country_id: number | null;
    city_id: number | null;
  }) => {
    setSaving(true);
    try {
      await updateCustomer(customerId, value);
      toast.success("Customer location updated.");
      setLocationModalOpen(false);
      await fetchCustomer();
    } catch {
      toast.error("Could not update customer location.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (payload: {
    subject: string;
    message: string;
    booking_id?: number | null;
  }) => {
    setSaving(true);
    try {
      await sendCustomerMessage(customerId, payload);
      toast.success("Message dispatched to customer.");
      setMessageOpen(false);
      const communicationResponse = await getCustomerCommunications(customerId);
      setCommunications(communicationResponse.items || []);
    } catch {
      toast.error("Could not send customer message.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(
    () =>
      [
        {
          key: "bookings" as const,
          label: "Reservations & Bookings",
          icon: Calendar,
          count: bookings.length,
          visible: canViewBookings,
        },
        {
          key: "payments" as const,
          label: "Payments & Invoices",
          icon: CreditCard,
          count: payments.length,
          visible: canViewPayments,
        },
        {
          key: "communications" as const,
          label: "Communications Log",
          icon: MessageSquare,
          count: communications.length,
          visible: canViewCommunications,
        },
      ].filter((tab) => tab.visible),
    [
      bookings.length,
      canViewBookings,
      canViewCommunications,
      canViewPayments,
      communications.length,
      payments.length,
    ],
  );

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab) && tabs[0]) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  const totalBookings =
    bookings.length || (customer?.booking_summary?.total ?? customer?.total_bookings ?? 0);
  const completedTours =
    bookings.length > 0
      ? bookings.filter((b) => b.booking_status === "completed").length
      : (customer?.booking_summary?.completed ?? customer?.completed_tours ?? 0);
  const cancelledTours =
    bookings.length > 0
      ? bookings.filter((b) => b.booking_status === "cancelled" || b.booking_status === "declined").length
      : (customer?.booking_summary?.cancelled ?? customer?.cancelled_tours ?? 0);
  const upcomingTours =
    bookings.length > 0
      ? bookings.filter((b) =>
          ["confirmed", "pending_supplier_acceptance", "payment_authorized"].includes(b.booking_status)
        ).length
      : (customer?.booking_summary?.upcoming ?? customer?.upcoming_tours ?? 0);
  const totalPaid =
    customer?.payment_summary?.paid ?? customer?.amount_paid ?? 0;
  const totalPending =
    customer?.payment_summary?.pending ?? customer?.amount_pending ?? 0;

  return (
    <ModuleWrapper title="Customer Detail" requiredPermission="customers.view">
      {loading ? (
        <Loader label="Loading customer..." />
      ) : customer ? (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 text-sm font-bold text-dash-text hover:text-dash-brand"
            >
              <ArrowLeft size={16} />
              Back to customers
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {canEditLocation && (
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <MapPin size={14} className="text-dash-subtle" />
                  Edit Location
                </button>
              )}
              {canCommunicate && (
                <button
                  type="button"
                  onClick={() => setMessageOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <Mail size={14} className="text-dash-brand" />
                  Send Message
                </button>
              )}
              <CustomerActionButtons
                customer={customer}
                saving={saving}
                canBlock={canBlock}
                canUnblock={canUnblock}
                canReset={canReset}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* Profile Hero Card */}
          <CustomerProfileCard customer={customer} />

          {/* Executive Metrics Grid */}
          <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Calendar size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">
                Total Bookings
              </p>
              <p className="mt-1 text-xl font-black text-dash-text">
                {totalBookings}
              </p>
            </div>

            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">
                Completed
              </p>
              <p className="mt-1 text-xl font-black text-emerald-600">
                {completedTours}
              </p>
            </div>

            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CalendarCheck size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">
                Upcoming
              </p>
              <p className="mt-1 text-xl font-black text-violet-600">
                {upcomingTours}
              </p>
            </div>

            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <XCircle size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">
                Cancelled
              </p>
              <p className="mt-1 text-xl font-black text-rose-600">
                {cancelledTours}
              </p>
            </div>

            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">
                Amount Paid
              </p>
              <p className="mt-1 text-xl font-black text-emerald-600">
                {format(totalPaid)}
              </p>
            </div>

            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <CalendarX size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">
                Outstanding Due
              </p>
              <p className="mt-1 text-xl font-black text-amber-700">
                {format(totalPending)}
              </p>
            </div>
          </section>

          {/* Tabbed Activity Container */}
          <section className="rounded-2xl border border-dash-border-soft bg-white shadow-xs overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b border-[#F0F3F8] bg-slate-50/50 p-2.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    activeTab === tab.key
                      ? "bg-white text-dash-brand shadow-xs ring-1 ring-slate-200/80"
                      : "text-dash-muted hover:bg-white/60 hover:text-dash-text"
                  }`}
                >
                  <tab.icon size={15} />
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeTab === tab.key
                        ? "bg-dash-brand text-white"
                        : "bg-slate-200/70 text-dash-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "bookings" && canViewBookings && (
                <CustomerBookingHistory rows={bookings} />
              )}
              {activeTab === "payments" && canViewPayments && (
                <CustomerPaymentHistory rows={payments} />
              )}
              {activeTab === "communications" && canViewCommunications && (
                <CustomerCommunicationHistory rows={communications} />
              )}
            </div>
          </section>

          {/* Action Modals */}
          <SendCustomerMessageModal
            open={messageOpen}
            saving={saving}
            onClose={() => setMessageOpen(false)}
            onSend={handleSendMessage}
          />
          <LocationEditModal
            open={locationModalOpen}
            title="Edit customer location"
            countryId={customer.country_id ?? null}
            cityId={customer.city_id ?? null}
            saving={saving}
            onClose={() => setLocationModalOpen(false)}
            onSave={(value) => void handleSaveLocation(value)}
          />
          <ActionModal
            open={blockModalOpen}
            title={`Block ${customer.full_name}`}
            fields={[
              {
                name: "reason",
                label: "Block reason",
                type: "textarea",
                required: true,
              },
            ]}
            saving={saving}
            submitLabel="Block Account"
            onClose={() => setBlockModalOpen(false)}
            onSubmit={submitBlock}
          />
        </div>
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">
          Customer not found.
        </section>
      )}
      {dialog}
    </ModuleWrapper>
  );
}
