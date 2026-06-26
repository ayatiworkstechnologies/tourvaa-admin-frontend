"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function SupplierMessagesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">Messages</h1>
        <p className="mt-1 text-sm text-[#667085]">Direct messaging with the Tourvaa team.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-[#E7EAF0] bg-white py-20 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <MessageSquare size={30} className="text-emerald-600" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-[#121826]">Messaging coming soon</h2>
        <p className="mt-2 max-w-sm text-sm text-[#667085]">
          The direct messaging centre is under development. For booking-related communications,
          use the messaging section inside each booking.
        </p>
        <Link
          href="/supplier/bookings"
          className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Go to My Bookings
        </Link>
      </div>
    </div>
  );
}
