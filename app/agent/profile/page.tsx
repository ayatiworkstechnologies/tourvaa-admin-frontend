"use client";

import AgencyDetailsTab from "@/components/agent/profile/AgencyDetailsTab";

export default function AgentProfilePage() {
  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-orange-700 p-7 text-white shadow-xl shadow-orange-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">My Profile</h1>
          <p className="mt-2 max-w-md text-sm font-medium text-orange-100">Manage your agency details and account security.</p>
        </div>
      </div>
      <AgencyDetailsTab />
    </div>
  );
}
