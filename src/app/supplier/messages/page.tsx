"use client";

import { useEffect, useState } from "react";
import { LuMessageSquare as MessageSquare } from "react-icons/lu";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";
import PortalMessageThread from "@/components/messaging/PortalMessageThread";
import SupplierBookingInbox from "@/components/messaging/SupplierBookingInbox";

const TABS = [
  { key: "bookings", label: "Booking Support" },
  { key: "support", label: "Tourvaa Support" },
] as const;

export default function SupplierMessagesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("bookings");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "support") setTab("support");
  }, []);

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Messages" description="Contact Tourvaa for booking matters or operational support. Tourvaa manages all customer and agent communication." icon={MessageSquare} />

      <div className="mt-4 flex gap-2 border-b border-dash-border-soft pb-3">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === item.key ? "bg-dash-text text-white" : "bg-dash-bg text-dash-muted hover:bg-[#EEF2F8]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "bookings" ? <SupplierBookingInbox /> : <PortalMessageThread portal="supplier" />}
      </div>
    </SupplierPageShell>
  );
}
