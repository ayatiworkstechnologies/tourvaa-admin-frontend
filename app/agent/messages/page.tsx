"use client";

import Link from "next/link";
import { LuMessageSquare as MessageSquare } from "react-icons/lu";

export default function AgentMessagesPage() {
  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-orange-700 p-7 text-white shadow-xl shadow-orange-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">Messages</h1>
          <p className="mt-2 max-w-md text-sm font-medium text-orange-100">Direct messaging with the Tourvaa operations team.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-transparent bg-white py-20 text-center shadow-sm ring-1 ring-slate-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <MessageSquare size={30} className="text-orange-500" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-[#121826]">Messaging coming soon</h2>
        <p className="mt-2 max-w-sm text-sm text-[#667085]">
          The direct messaging centre is under development. For booking-related communications,
          use the messaging section inside each booking.
        </p>
        <Link
          href="/agent/bookings"
          className="mt-6 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
        >
          Go to My Bookings
        </Link>
      </div>
    </div>
  );
}
