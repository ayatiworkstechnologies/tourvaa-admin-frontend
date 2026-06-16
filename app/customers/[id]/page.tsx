"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
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

  return (
    <ModuleWrapper title="Customer Detail" requiredPermission="customers.view">
      {loading ? (
        <Loader label="Loading customer..." />
      ) : customer ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/customers" className="inline-flex items-center gap-2 text-sm font-bold text-[#238DD7]">
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              ["Bookings", customer.booking_summary?.total ?? customer.total_bookings],
              ["Completed", customer.booking_summary?.completed ?? customer.completed_tours],
              ["Cancelled", customer.booking_summary?.cancelled ?? customer.cancelled_tours],
              ["Upcoming", customer.booking_summary?.upcoming ?? customer.upcoming_tours],
              ["Paid", `₹${Number(customer.payment_summary?.paid ?? customer.amount_paid).toLocaleString()}`],
              ["Pending", `₹${Number(customer.payment_summary?.pending ?? customer.amount_pending).toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#E7EAF0] bg-white p-5">
                <p className="text-xs font-bold uppercase text-[#98A2B3]">{label}</p>
                <p className="mt-2 text-xl font-bold text-[#121826]">{value}</p>
              </div>
            ))}
          </section>

          <CustomerBookingHistory rows={bookings} />
          {canViewPayments && <CustomerPaymentHistory rows={payments} />}
          {canViewCommunications && <CustomerCommunicationHistory rows={communications} />}

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
