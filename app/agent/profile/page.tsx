"use client";

import AgencyDetailsTab from "@/components/agent/profile/AgencyDetailsTab";

export default function AgentProfilePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">My Profile</h1>
        <p className="mt-1 text-sm text-[#667085]">Manage your agency details and account security.</p>
      </div>
      <AgencyDetailsTab />
    </div>
  );
}
