"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuBadgeCheck as BadgeCheck, LuBuilding as Building, LuBus as Bus, LuFileCheck as FileCheck, LuLandmark as Landmark, LuPercent as Percent } from "react-icons/lu";
import BankAndInvoicingTab from "@/components/supplier/profile/BankAndInvoicingTab";
import CompanyInfoTab from "@/components/supplier/profile/CompanyInfoTab";
import DocumentsTab from "@/components/supplier/profile/DocumentsTab";
import VehiclesTab from "@/components/supplier/profile/VehiclesTab";
import CommissionTab from "@/components/supplier/profile/CommissionTab";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";

const TABS = [
  { id: "company", label: "Business Details", description: "Company identity and primary contact", icon: Building },
  { id: "billing", label: "Bank & Invoicing", description: "Settlement, accounts, and billing address", icon: Landmark },
  { id: "vehicles", label: "Vehicles & Fleet", description: "Vehicles used to deliver your tours", icon: Bus },
  { id: "documents", label: "Business Verification", description: "Licences, insurance, and supporting documents", icon: FileCheck },
  { id: "commission", label: "Commission Agreement", description: "Your agreed Tourvaa commission", icon: Percent },
];

export default function UnifiedSupplierProfilePage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("company");

  // Re-derive whenever the ?tab= query param changes, not just on mount -
  // navigating here from the sidebar/profile-dropdown while already on this
  // page doesn't remount the component, only updates the URL.
  useEffect(() => {
    setActiveTab(TABS.some((tab) => tab.id === requestedTab) ? requestedTab! : "company");
  }, [requestedTab]);

  const advanceToNextTab = (completedTabId: string) => {
    const completedIndex = TABS.findIndex((tab) => tab.id === completedTabId);
    const nextTab = completedIndex >= 0 ? TABS[completedIndex + 1] : undefined;
    if (nextTab) setActiveTab(nextTab.id);
  };

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="My Profile" description="Keep your business details, settlement information, fleet, verification documents, and commission agreement up to date." icon={Building} eyebrow="Supplier Account" />

      <div className="mt-4 min-w-0 max-w-full rounded-2xl border border-[#DCEBE2] bg-white p-2 shadow-[0_8px_24px_-22px_rgba(15,82,48,.7)]">
        <div className="flex min-w-0 max-w-full overflow-x-auto" role="tablist" aria-label="Supplier profile sections">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              className={`min-w-52 flex-1 overflow-hidden rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                isActive
                  ? "bg-[#16833A] text-white shadow-sm"
                  : "text-dash-muted hover:bg-[#F0F8F3] hover:text-dash-text"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-black"><Icon size={18} className={`shrink-0 ${isActive ? "text-white" : "text-dash-subtle"}`} /><span className="truncate">{tab.label}</span></span>
              <span className={`mt-1 block truncate text-xs font-medium ${isActive ? "text-emerald-100" : "text-slate-500"}`} title={tab.description}>{tab.description}</span>
            </button>
          );
        })}
        </div>
      </div>

      <div className="mt-4 min-w-0 max-w-full rounded-2xl border border-[#DCEBE2] bg-white p-4 shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)] sm:p-6">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-slate-700">
          <BadgeCheck size={19} className="mt-0.5 shrink-0 text-emerald-700" />
          <p><span className="font-black text-slate-900">{TABS.find((tab) => tab.id === activeTab)?.label}</span><span className="hidden sm:inline"> - {TABS.find((tab) => tab.id === activeTab)?.description}</span></p>
        </div>
        {/* Every tab stays mounted (hidden via CSS, not unmounted) so
            in-progress form edits on inactive tabs survive switching. */}
        <div className={activeTab === "company" ? "min-w-0 max-w-full" : "hidden"}><CompanyInfoTab onSaved={() => advanceToNextTab("company")} /></div>
        <div className={activeTab === "billing" ? "min-w-0 max-w-full" : "hidden"}><BankAndInvoicingTab onSaved={() => advanceToNextTab("billing")} /></div>
        <div className={activeTab === "vehicles" ? "min-w-0 max-w-full" : "hidden"}><VehiclesTab onSaved={() => advanceToNextTab("vehicles")} /></div>
        <div className={activeTab === "documents" ? "min-w-0 max-w-full" : "hidden"}><DocumentsTab onVerificationSubmitted={() => advanceToNextTab("documents")} /></div>
        <div className={activeTab === "commission" ? "min-w-0 max-w-full" : "hidden"}><CommissionTab /></div>
      </div>
    </SupplierPageShell>
  );
}
