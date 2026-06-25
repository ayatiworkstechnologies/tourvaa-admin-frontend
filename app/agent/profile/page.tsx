"use client";

import { useState } from "react";
import { User, Building } from "lucide-react";
import PersonalDetailsTab from "@/components/agent/profile/PersonalDetailsTab";
import AgencyDetailsTab from "@/components/agent/profile/AgencyDetailsTab";

const TABS = [
  { id: "personal", label: "Personal Details", icon: User },
  { id: "agency", label: "Agency Information", icon: Building },
];

export default function AgentProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">My Profile</h1>
        <p className="mt-1 text-sm text-[#667085]">Manage your agent account and agency details.</p>
      </div>

      {/* Top Tabs */}
      <div className="mb-6 flex overflow-x-auto border-b border-[#E7EAF0]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 pb-3.5 text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-[#667085] hover:text-[#121826]"
              }`}
            >
              <Icon size={18} className={isActive ? "text-orange-500" : "text-[#98A2B3]"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="w-full">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "personal" && <PersonalDetailsTab />}
          {activeTab === "agency" && <AgencyDetailsTab />}
        </div>
      </div>
    </div>
  );
}
