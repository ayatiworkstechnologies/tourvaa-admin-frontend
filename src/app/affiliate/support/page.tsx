"use client";

import { LuMessageSquare as MessageSquare } from "react-icons/lu";
import PortalMessageThread from "@/components/messaging/PortalMessageThread";

export default function AffiliateSupportPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700"><MessageSquare size={20} /></span>
        <div>
          <h1 className="text-2xl font-black text-dash-text">Support</h1>
          <p className="mt-1 text-sm text-dash-muted">Chat directly with the Tourvaa affiliate team.</p>
        </div>
      </div>
      <PortalMessageThread portal="affiliate" />
    </div>
  );
}
