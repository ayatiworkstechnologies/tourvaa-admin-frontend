"use client";

import { LuHeadphones as Headphones, LuMail as Mail, LuMessageSquare as MessageSquare, LuPhone as Phone } from "react-icons/lu";
import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";
import PortalMessageThread from "@/components/messaging/PortalMessageThread";

export default function CustomerSupportPage() {
  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Support"
        description="Get help with bookings, payments, travel documents, or any other journey questions."
        icon={Headphones}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left column: live message thread with the support team */}
        <div className="space-y-4">
          <PortalMessageThread portal="customer" />
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#DDE7F3] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(24,68,126,.6)]">
            <h3 className="mb-4 font-black text-dash-text">Contact Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-soft)]">
                  <Mail size={18} className="text-dash-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Email</p>
                  <p className="mt-0.5 text-sm font-semibold text-dash-text">support@tourvaa.com</p>
                  <p className="mt-0.5 text-xs text-dash-subtle">Response within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-soft)]">
                  <Phone size={18} className="text-dash-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Phone</p>
                  <p className="mt-0.5 text-sm font-semibold text-dash-text">+971 4 XXX XXXX</p>
                  <p className="mt-0.5 text-xs text-dash-subtle">Mon–Fri, 9am–6pm GST</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-soft)]">
                  <MessageSquare size={18} className="text-dash-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Live Chat</p>
                  <p className="mt-0.5 text-sm font-semibold text-dash-text">Available on website</p>
                  <p className="mt-0.5 text-xs text-dash-subtle">During business hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDE7F3] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(24,68,126,.6)]">
            <h3 className="mb-3 font-black text-dash-text">Common Issues</h3>
            <ul className="space-y-2 text-sm text-dash-muted">
              {[
                "How to modify or cancel a booking",
                "Refund status and timelines",
                "Travel insurance queries",
                "Special dietary requirements",
                "Visa and documentation help",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-dash-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </CustomerPageShell>
  );
}
