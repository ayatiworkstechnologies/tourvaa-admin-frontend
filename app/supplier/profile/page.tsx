"use client";

import { useState } from "react";
import { Building, Bus, FileCheck, Percent } from "lucide-react";
import CompanyInfoTab from "@/components/supplier/profile/CompanyInfoTab";
import DocumentsTab from "@/components/supplier/profile/DocumentsTab";
import CommissionRequestTab from "@/components/supplier/profile/CommissionRequestTab";
import VehiclesTab from "@/components/supplier/profile/VehiclesTab";

const TABS = [
  { id: "company", label: "Company & Security", icon: Building },
  { id: "vehicles", label: "My Vehicles", icon: Bus },
  { id: "commission", label: "Commission Request", icon: Percent },
  { id: "documents", label: "Verification Documents", icon: FileCheck },
];

export default function UnifiedSupplierProfilePage() {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">My Profile</h1>
        <p className="mt-1 text-sm text-[#667085]">Manage your company details, password, and verification documents.</p>
      </div>

      <div className="mb-6 flex overflow-x-auto border-b border-[#E7EAF0]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 pb-3.5 text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-[#667085] hover:text-[#121826]"
              }`}
            >
              <Icon size={18} className={isActive ? "text-emerald-600" : "text-[#98A2B3]"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {activeTab === "company" && <CompanyInfoTab />}
        {activeTab === "vehicles" && <VehiclesTab />}
        {activeTab === "commission" && <CommissionRequestTab />}
        {activeTab === "documents" && <DocumentsTab />}
      </div>
    </div>
  );
}
