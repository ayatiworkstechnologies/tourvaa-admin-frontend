"use client";

import { useState } from "react";
import { LuBuilding as Building, LuBus as Bus, LuFileCheck as FileCheck, LuPercent as Percent } from "react-icons/lu";
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
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-emerald-800 p-7 text-white shadow-xl shadow-emerald-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">My Profile</h1>
          <p className="mt-2 max-w-md text-sm font-medium text-emerald-100">Manage your company details, password, and verification documents.</p>
        </div>
      </div>

      <div className="mb-6 flex overflow-x-auto rounded-2xl border border-transparent bg-white px-3 shadow-sm ring-1 ring-slate-100">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 pt-3.5 pb-3.5 text-sm font-bold transition-all duration-200 whitespace-nowrap ${
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
