"use client";

import React, { useState } from "react";
import {
  LuBookOpen as BookOpen,
  LuFileText as FileText,
  LuCoins as Coins,
  LuShieldAlert as ShieldAlert,
  LuHeartHandshake as HeartHandshake,
  LuBus as Bus,
  LuPackage as Package,
  LuPhoneCall as PhoneCall,
  LuCheck as Check,
  LuInfo as Info,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryTravelInfoSectionProps {
  info: CountryDestinationInfo;
}

interface TravelTab {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  content: string;
  tip?: string;
}

export default function CountryTravelInfoSection({ info }: CountryTravelInfoSectionProps) {
  const { travel_info } = info;

  const tabs: TravelTab[] = [
    {
      id: "visas",
      label: "Visas & Entry",
      shortLabel: "Visas",
      icon: FileText,
      content: travel_info.visas_and_passports,
      tip: "Ensure your passport has at least 6 months validity from your arrival date and 2 blank pages.",
    },
    {
      id: "money",
      label: "Money & Tipping",
      shortLabel: "Money",
      icon: Coins,
      content: travel_info.money_and_tipping,
      tip: `Local currency is ${info.quick_facts.currency}. Inform your bank before travel to avoid card blocks.`,
    },
    {
      id: "health",
      label: "Health & Vaccines",
      shortLabel: "Health",
      icon: ShieldAlert,
      content: travel_info.health_and_vaccinations,
      tip: "Comprehensive travel medical insurance is strongly recommended for all travelers.",
    },
    {
      id: "culture",
      label: "Culture & Etiquette",
      shortLabel: "Culture",
      icon: HeartHandshake,
      content: travel_info.local_customs_and_culture,
      tip: "Dress modestly when visiting temples and sacred heritage sites, removing shoes where required.",
    },
    {
      id: "transport",
      label: "Getting Around",
      shortLabel: "Transport",
      icon: Bus,
      content: travel_info.getting_around_and_transport,
      tip: "Tourvaa guided tours include private vetted air-conditioned vehicles and internal flight/train transfers.",
    },
    {
      id: "packing",
      label: "Packing Essentials",
      shortLabel: "Packing",
      icon: Package,
      content: travel_info.packing_essentials,
      tip: `Electrical plugs used: ${info.quick_facts.plug_types}. Bring a universal adapter.`,
    },
  ];

  if (travel_info.emergency_numbers) {
    tabs.push({
      id: "emergency",
      label: "Emergency Contacts",
      shortLabel: "Emergency",
      icon: PhoneCall,
      content: travel_info.emergency_numbers,
      tip: "Keep a copy of your Tourvaa tour leader emergency hotline stored in your phone at all times.",
    });
  }

  const [activeTabId, setActiveTabId] = useState<string>("visas");
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const IconComponent = activeTab.icon;

  return (
    <section
      id="section-travel-info"
      className="py-14 sm:py-20 bg-white border-b border-slate-100"
    >
      <div className="mx-auto max-w-[1380px] px-5">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E]">
            <BookOpen size={12} className="text-[#E4572E]" />
            <span>Essential Practical Guide</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            Travel Information & Advice: {info.country_name}
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Everything you need to know before you fly — from visa requirements and currency tips to health advice and local cultural customs.
          </p>
        </div>

        {/* Desktop & Mobile Tab Nav */}
        <div className="mt-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:justify-center">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? "bg-slate-950 text-white shadow-md"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-950"
                  }`}
                >
                  <TabIcon
                    size={16}
                    className={isActive ? "text-[#E4572E]" : "text-slate-400"}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="mt-6 mx-auto max-w-4xl">
          <div className="rounded-[24px] border border-slate-200/90 bg-slate-50/50 p-6 sm:p-10 shadow-xs transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100/80 text-[#E4572E]">
                  <IconComponent size={24} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Travel Advice
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    {activeTab.label}
                  </h3>
                </div>
              </div>

              {/* Quick Country Pill */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200/80 shadow-xs self-start sm:self-center">
                <Check size={13} className="text-emerald-500 stroke-[3]" />
                <span>Verified for {info.country_name}</span>
              </div>
            </div>

            {/* Narrative text with formatted paragraphs */}
            <div className="mt-6 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed font-normal">
              {activeTab.content
                .split("\n\n")
                .filter((p) => p.trim().length > 0)
                .map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
            </div>

            {/* Tourvaa Insider Tip Callout */}
            {activeTab.tip && (
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-orange-200/70 bg-orange-50/70 p-4 text-slate-900">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E4572E] text-white">
                  <Info size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#E4572E]">
                    Tourvaa Expert Tip
                  </h4>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
                    {activeTab.tip}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Peace of Mind Grid */}
        <div className="mt-12 mx-auto max-w-4xl grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-2xs">
            <span className="text-xl font-black text-[#E4572E]">24/7</span>
            <p className="mt-1 text-xs font-bold text-slate-900">Ground Assistance</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Dedicated Tour Leader & Operations</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-2xs">
            <span className="text-xl font-black text-[#E4572E]">100%</span>
            <p className="mt-1 text-xs font-bold text-slate-900">Financial Protection</p>
            <p className="mt-0.5 text-[11px] text-slate-500">ABTA & ATOL bonded partner coverage</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-2xs">
            <span className="text-xl font-black text-[#E4572E]">Local</span>
            <p className="mt-1 text-xs font-bold text-slate-900">Vetted Guides</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Passionate, native licensed storytelling</p>
          </div>
        </div>
      </div>
    </section>
  );
}
