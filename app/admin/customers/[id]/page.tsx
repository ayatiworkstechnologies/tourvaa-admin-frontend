"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuArrowLeft as ArrowLeft, LuCalendar as Calendar, LuCalendarCheck as CalendarCheck, LuCalendarX as CalendarX, LuCircleCheckBig as CheckCircle2, LuCreditCard as CreditCard, LuMail as Mail, LuMessageSquare as MessageSquare, LuWallet as Wallet, LuCircleX as XCircle } from "react-icons/lu";
import { useParams } from "next/navigation";

import CustomerActionButtons from "@/components/customers/CustomerActionButtons";
import {
  CustomerBookingHistory,
  CustomerCommunicationHistory,
  CustomerPaymentHistory,
} from "@/components/customers/CustomerHistoryTables";
import CustomerProfileCard from "@/components/customers/CustomerProfileCard";
import SendCustomerMessageModal from "@/components/customers/SendCustomerMessageModal";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { useToast } from "@/hooks/useToast";
import { useAuthContext } from "@/providers/AuthProvider";
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
} from "@/lib/services/customerService";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [communications, setCommunications] = useState<CustomerCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "payments" | "communications">("bookings");

  const canBlock = hasPermission("customers.block") || hasPermission("customers.edit");
  const canUnblock = hasPermission("customers.unblock") || hasPermission("customers.edit");
  const canReset = hasPermission("customers.reset_password") || hasPermission("customers.edit");
  const canViewPayments = hasPermission("customers.view_payments") || hasPermission("customers.view");
  const canViewCommunications =
    hasPermission("customers.view_communications") || hasPermission("customers.view");
  const canCommunicate = hasPermission("customers.communicate");

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await getCustomerDetail(customerId);
      setCustomer(detail);

      const [bookingResponse, paymentResponse, communicationResponse] = await Promise.all([
        getCustomerBookings(customerId),
        canViewPayments ? getCustomerPayments(customerId) : Promise.resolve({ items: [] }),
        canViewCommunications ? getCustomerCommunications(customerId) : Promise.resolve({ items: [] }),
      ]);
      setBookings(bookingResponse.items || []);
      setPayments(paymentResponse.items || []);
      setCommunications(communicationResponse.items || []);
    } catch {
      toast.error("Could not load customer.");
    } finally {
      setLoading(false);
    }
  }, [canViewCommunications, canViewPayments, customerId, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCustomer();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchCustomer]);

  const handleBlock = async () => {
    if (!customer) return;
    const reason = window.prompt("Enter block reason");
    if (!reason?.trim()) return;

    setSaving(true);
    try {
      await blockCustomer(customer.id, reason);
      toast.success("Customer blocked.");
      await fetchCustomer();
    } catch {
      toast.error("Could not block customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!customer || !window.confirm("Unblock this customer?")) return;

    setSaving(true);
    try {
      await unblockCustomer(customer.id);
      toast.success("Customer unblocked.");
      await fetchCustomer();
    } catch {
      toast.error("Could not unblock customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!customer || !window.confirm("Send password reset email to this customer?")) return;

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

  const handleSendMessage = async (payload: { subject: string; message: string; booking_id?: number | null }) => {
    setSaving(true);
    try {
      await sendCustomerMessage(customerId, payload);
      toast.success("Customer message sent.");
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
        { key: "bookings" as const, label: "Bookings", icon: Calendar, count: bookings.length, visible: true },
        { key: "payments" as const, label: "Payments", icon: CreditCard, count: payments.length, visible: canViewPayments },
        {
          key: "communications" as const,
          label: "Communications",
          icon: MessageSquare,
          count: communications.length,
          visible: canViewCommunications,
        },
      ].filter((tab) => tab.visible),
    [bookings.length, canViewCommunications, canViewPayments, communications.length, payments.length]
  );

  return (
    <ModuleWrapper title="Customer Detail" requiredPermission="customers.view">
      {loading ? (
        <Loader label="Loading customer..." />
      ) : customer ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm font-bold text-[#2F9FE9]">
              <ArrowLeft size={16} />
              Back to customers
            </Link>
            <div className="flex flex-wrap gap-2">
              {canCommunicate && (
                <button
                  type="button"
                  onClick={() => setMessageOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC]"
                >
                  <Mail size={16} />
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

          <CustomerProfileCard customer={customer} />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Bookings", value: customer.booking_summary?.total ?? customer.total_bookings, icon: Calendar, accent: "text-[#2F9FE9] bg-[#EDF5FF]" },
              { label: "Completed", value: customer.booking_summary?.completed ?? customer.completed_tours, icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-50" },
              { label: "Cancelled", value: customer.booking_summary?.cancelled ?? customer.cancelled_tours, icon: XCircle, accent: "text-red-600 bg-red-50" },
              { label: "Upcoming", value: customer.booking_summary?.upcoming ?? customer.upcoming_tours, icon: CalendarCheck, accent: "text-violet-600 bg-violet-50" },
              { label: "Paid", value: `$${Number(customer.payment_summary?.paid ?? customer.amount_paid).toLocaleString()}`, icon: Wallet, accent: "text-emerald-600 bg-emerald-50" },
              { label: "Pending", value: `$${Number(customer.payment_summary?.pending ?? customer.amount_pending).toLocaleString()}`, icon: CalendarX, accent: "text-amber-700 bg-amber-50" },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
                  <Icon size={18} />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#98A2B3]">{label}</p>
                <p className="mt-1 text-xl font-black text-[#121826]">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-[#E9EDF3] bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap gap-1 border-b border-[#F0F3F8] p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#EDF5FF] text-[#2F9FE9]"
                      : "text-[#667085] hover:bg-[#F7F9FC]"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      activeTab === tab.key ? "bg-white text-[#2F9FE9]" : "bg-[#F0F3F8] text-[#98A2B3]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "bookings" && <CustomerBookingHistory rows={bookings} />}
              {activeTab === "payments" && canViewPayments && <CustomerPaymentHistory rows={payments} />}
              {activeTab === "communications" && canViewCommunications && (
                <CustomerCommunicationHistory rows={communications} />
              )}
            </div>
          </section>

          <SendCustomerMessageModal
            open={messageOpen}
            saving={saving}
            onClose={() => setMessageOpen(false)}
            onSend={handleSendMessage}
          />
        </div>
      ) : (
        <section className="rounded-xl border border-[#E7EAF0] bg-white p-10 text-center text-[#667085]">
          Customer not found.
        </section>
      )}
    </ModuleWrapper>
  );
}

