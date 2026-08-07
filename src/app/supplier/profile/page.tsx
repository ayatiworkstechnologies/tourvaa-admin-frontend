"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuBuilding as Building, LuBus as Bus, LuFileCheck as FileCheck, LuPercent as Percent } from "react-icons/lu";
import CompanyInfoTab from "@/components/supplier/profile/CompanyInfoTab";
import DocumentsTab from "@/components/supplier/profile/DocumentsTab";
import CommissionRequestTab from "@/components/supplier/profile/CommissionRequestTab";
import VehiclesTab from "@/components/supplier/profile/VehiclesTab";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";

const TABS = [
  { id: "company", label: "Company & Security", icon: Building },
  { id: "vehicles", label: "My Vehicles", icon: Bus },
  { id: "commission", label: "Commission Request", icon: Percent },
  { id: "documents", label: "Verification Documents", icon: FileCheck },
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

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="My Profile" description="Manage your company identity, account security, fleet, commercial request, and verification documents." icon={Building} eyebrow="Supplier Account" />

      <div className="mt-4 flex overflow-x-auto rounded-2xl border border-[#DCEBE2] bg-white p-2 shadow-[0_8px_24px_-22px_rgba(15,82,48,.7)]">
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
                  ? "bg-[#16833A] text-white shadow-sm"
                  : "text-dash-muted hover:bg-[#F0F8F3] hover:text-dash-text"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-dash-subtle"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 w-full rounded-2xl border border-[#DCEBE2] bg-white p-5 shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)] sm:p-6">
        {/* Every tab stays mounted (hidden via CSS, not unmounted) so
            in-progress form edits on inactive tabs survive switching. */}
        <div className={activeTab === "company" ? "" : "hidden"}><CompanyInfoTab /></div>
        <div className={activeTab === "vehicles" ? "" : "hidden"}><VehiclesTab /></div>
        <div className={activeTab === "commission" ? "" : "hidden"}><CommissionRequestTab /></div>
        <div className={activeTab === "documents" ? "" : "hidden"}><DocumentsTab /></div>
      </div>
    </SupplierPageShell>
  );
}
