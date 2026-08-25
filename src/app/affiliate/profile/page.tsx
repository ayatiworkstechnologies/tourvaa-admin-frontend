"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuBuilding as Building, LuFileCheck as FileCheck } from "react-icons/lu";
import CompanyInfoTab from "@/components/affiliate/profile/CompanyInfoTab";
import DocumentsTab from "@/components/affiliate/profile/DocumentsTab";

const TABS = [
  { id: "company", label: "Company & Security", icon: Building },
  { id: "documents", label: "Verification Documents", icon: FileCheck },
];

export default function AffiliateProfilePage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("company");

  useEffect(() => {
    setActiveTab(TABS.some((tab) => tab.id === requestedTab) ? requestedTab! : "company");
  }, [requestedTab]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-text">My Profile</h1>
        <p className="mt-1 text-sm text-dash-muted">Update your affiliate account details, marketing info, invoicing, and documents.</p>
      </div>

      <div className="flex overflow-x-auto rounded-2xl border border-dash-border bg-white p-2 shadow-sm">
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
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-dash-muted hover:bg-purple-50 hover:text-dash-text"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-dash-subtle"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 w-full rounded-2xl border border-dash-border bg-white p-5 shadow-sm sm:p-6">
        <div className={activeTab === "company" ? "" : "hidden"}><CompanyInfoTab /></div>
        <div className={activeTab === "documents" ? "" : "hidden"}><DocumentsTab /></div>
      </div>
    </div>
  );
}
