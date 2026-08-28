"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuCookie as CookieIcon,
  LuInfo as Info,
  LuLock as Lock,
  LuShieldCheck as ShieldCheck,
  LuSlidersHorizontal as Sliders,
  LuSparkles as Sparkles,
  LuX as X,
} from "react-icons/lu";

const CONSENT_KEY = "tourvaa_cookie_consent";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: true,
    preferences: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Small initial delay for smooth entrance
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable (private mode / blocked)
    }
  }, []);

  const saveConsent = (type: "all" | "essential" | "custom") => {
    try {
      const consentData = {
        type,
        preferences:
          type === "all"
            ? { necessary: true, analytics: true, marketing: true, preferences: true }
            : type === "essential"
            ? { necessary: true, analytics: false, marketing: false, preferences: false }
            : prefs,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    } catch {
      // Ignore write failures in private/restricted mode
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent banner"
      className="fixed inset-x-4 bottom-4 z-[9999] mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-300 sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-[0_20px_50px_rgba(11,21,39,0.22)] backdrop-blur-xl ring-1 ring-slate-900/5 transition-all">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E4572E] to-[#c7451e] text-white shadow-md shadow-[#E4572E]/25">
              <CookieIcon size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black tracking-tight text-[#0B1527]">
                  We Value Your Privacy
                </h3>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200/60">
                  <Sparkles size={10} className="text-amber-500" />
                  Cookie Policy
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Personalized journey recommendations & smooth browsing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveConsent("essential")}
            aria-label="Close cookie banner"
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Explanatory Copy */}
        <p className="mt-3.5 text-xs sm:text-[13px] leading-relaxed text-slate-600 font-medium">
          Tourvaa uses cookies and similar technologies to ensure seamless navigation, remember your preferences, analyze website traffic, and deliver personalized tour deals. You can choose to accept all or customize your preferences anytime. See our{" "}
          <Link
            href="/cookie-policy"
            className="font-bold text-[#E4572E] underline underline-offset-2 hover:text-[#0B1527] transition"
          >
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="font-bold text-[#0B1527] underline underline-offset-2 hover:text-[#E4572E] transition"
          >
            Privacy Policy
          </Link>
          .
        </p>

        {/* Interactive Preferences Panel (Collapsible Accordion) */}
        {showPreferences && (
          <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 sm:p-4 text-xs">
            {/* 1. Essential */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-700" />
                  <span className="font-bold text-slate-900">Strictly Necessary</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Essential for logins, shopping cart, currency selection, and secure checkout.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                Always Active
              </span>
            </div>

            {/* 2. Analytics */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200/60 pt-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-blue-600" />
                  <span className="font-bold text-slate-900">Analytics & Performance</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Helps us understand how travellers search, discover tours, and improve site speed.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.analytics}
                onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prefs.analytics ? "bg-[#0B1527]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    prefs.analytics ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3. Marketing & Personalization */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200/60 pt-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#E4572E]" />
                  <span className="font-bold text-slate-900">Marketing & Personalization</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Delivers relevant getaway deals, seasonal discounts, and curated destination offers.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.marketing}
                onClick={() => setPrefs((p) => ({ ...p, marketing: !p.marketing }))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prefs.marketing ? "bg-[#E4572E]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    prefs.marketing ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowPreferences((s) => !s)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
          >
            <Sliders size={13} className="text-slate-500" />
            <span>{showPreferences ? "Hide Preferences" : "Customize Preferences"}</span>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform ${showPreferences ? "rotate-180" : ""}`}
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveConsent("essential")}
              className="flex-1 sm:flex-none rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={() => (showPreferences ? saveConsent("custom") : saveConsent("all"))}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1527] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-[#0B1527]/20 hover:bg-[#15233C] hover:-translate-y-0.5 transition"
            >
              <Check size={14} className="text-[#E4572E]" />
              <span>{showPreferences ? "Save Choices" : "Accept All"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
