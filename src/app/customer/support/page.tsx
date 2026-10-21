"use client";

import { LuHeadphones as Headphones } from "react-icons/lu";

import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";
import PortalMessageThread from "@/components/messaging/PortalMessageThread";

export default function CustomerSupportPage() {
  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Messages"
        description="Message Tourvaa Support about bookings, payments, travel documents, or any journey question."
        icon={Headphones}
      />
      <div className="mt-4">
        <PortalMessageThread portal="customer" />
      </div>
    </CustomerPageShell>
  );
}
