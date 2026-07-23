"use client";

import { useState } from "react";
import { LuBuilding2 as Building2, LuFiles as Files } from "react-icons/lu";
import AgencyDetailsTab from "@/components/agent/profile/AgencyDetailsTab";
import VerificationDocumentsTab from "@/components/agent/profile/VerificationDocumentsTab";
import { AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";

export default function AgentProfilePage() {
  const [activeTab, setActiveTab] = useState<"agency" | "documents">("agency");

  return (
    <AgentPageShell>
      <AgentPageHeader title="My Profile" description="Manage your agency identity, account security, and verification documents." icon={Building2} eyebrow="Agent Account" />
      <div className="mt-4 inline-flex overflow-x-auto rounded-2xl border border-[#DFE7F2] bg-white p-1.5 shadow-sm">
        <button type="button" onClick={() => setActiveTab("agency")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === "agency" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}><Building2 size={16} />Agency & Security</button>
        <button type="button" onClick={() => setActiveTab("documents")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === "documents" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}><Files size={16} />Verification Documents</button>
      </div>
      <AgentSection className="mt-4">
        <div className="p-5 sm:p-6">{activeTab === "agency" ? <AgencyDetailsTab /> : <VerificationDocumentsTab />}</div>
      </AgentSection>
    </AgentPageShell>
  );
}
