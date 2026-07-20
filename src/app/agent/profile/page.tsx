"use client";

import { useState } from "react";
import { LuBuilding2 as Building2, LuFiles as Files } from "react-icons/lu";
import AgencyDetailsTab from "@/components/agent/profile/AgencyDetailsTab";
import VerificationDocumentsTab from "@/components/agent/profile/VerificationDocumentsTab";

export default function AgentProfilePage() {
  const [activeTab, setActiveTab] = useState<"agency" | "documents">("agency");

  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-[var(--portal-hero-from)] to-[var(--portal-hero-to)] p-7 text-white shadow-xl shadow-blue-200/40 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">My Profile</h1>
          <p className="mt-2 max-w-md text-sm font-medium text-blue-100">Manage agency details, account security, and verification documents.</p>
        </div>
      </div>
      <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button type="button" onClick={() => setActiveTab("agency")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === "agency" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}><Building2 size={16} />Agency & Security</button>
        <button type="button" onClick={() => setActiveTab("documents")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === "documents" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}><Files size={16} />Verification Documents</button>
      </div>
      {activeTab === "agency" ? <AgencyDetailsTab /> : <VerificationDocumentsTab />}
    </div>
  );
}
