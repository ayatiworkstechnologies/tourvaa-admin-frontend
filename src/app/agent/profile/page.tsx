"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LuBuilding2 as Building2,
  LuFiles as Files,
  LuLandmark as Landmark,
  LuPercent as Percent,
} from "react-icons/lu";
import AgencyDetailsTab from "@/components/agent/profile/AgencyDetailsTab";
import AgentBankAndInvoicingTab from "@/components/agent/profile/AgentBankAndInvoicingTab";
import VerificationDocumentsTab from "@/components/agent/profile/VerificationDocumentsTab";
import AgentCommissionTab from "@/components/agent/profile/AgentCommissionTab";
import { AgentPageHeader, AgentPageShell } from "@/components/agent/AgentPage";

const TABS = [
  { id: "agency", label: "Agency & Security", icon: Building2 },
  { id: "billing", label: "Bank & Invoicing", icon: Landmark },
  { id: "documents", label: "Verification Documents", icon: Files },
  { id: "commission", label: "Commission %", icon: Percent },
];

export default function AgentProfilePage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("agency");

  // Re-derive whenever the ?tab= query param changes, not just on mount -
  // navigating here from the sidebar/profile-dropdown while already on this
  // page doesn't remount the component, only updates the URL.
  useEffect(() => {
    setActiveTab(TABS.some((tab) => tab.id === requestedTab) ? requestedTab! : "agency");
  }, [requestedTab]);

  return (
    <AgentPageShell>
      <AgentPageHeader
        title="My Profile"
        description="Manage your agency identity, account security, settlement banking, and verification documents."
        icon={Building2}
        eyebrow="Agent Account"
      />

      <div className="mt-4 flex overflow-x-auto rounded-2xl border border-[#DCE6F5] bg-white p-2 shadow-[0_8px_24px_-22px_rgba(28,73,135,.7)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50 hover:text-[#10213F]"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-[#738199]"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 w-full rounded-2xl border border-[#DFE7F2] bg-white p-5 shadow-[0_10px_32px_-27px_rgba(28,73,135,.75)] sm:p-6">
        {/* All tabs stay mounted (hidden via CSS, not unmounted) so
            in-progress form edits on inactive tabs survive switching. */}
        <div className={activeTab === "agency" ? "" : "hidden"}>
          <AgencyDetailsTab />
        </div>
        <div className={activeTab === "billing" ? "" : "hidden"}>
          <AgentBankAndInvoicingTab />
        </div>
        <div className={activeTab === "documents" ? "" : "hidden"}>
          <VerificationDocumentsTab />
        </div>
        <div className={activeTab === "commission" ? "" : "hidden"}>
          <AgentCommissionTab />
        </div>
      </div>
    </AgentPageShell>
  );
}
