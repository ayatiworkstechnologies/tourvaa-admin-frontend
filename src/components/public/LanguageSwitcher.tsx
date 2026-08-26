"use client";

import { useEffect, useRef, useState } from "react";
import { LuChevronDown as ChevronDown, LuCheck as Check, LuLanguages as Languages } from "react-icons/lu";

// Core language list — code is the Google Translate language code
const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "ta", label: "தமிழ்", short: "TA" },
  { code: "hi", label: "हिंदी", short: "HI" },
  { code: "ar", label: "العربية", short: "AR" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "es", label: "Español", short: "ES" },
  { code: "zh-CN", label: "中文 (简体)", short: "ZH" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "ko", label: "한국어", short: "KO" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "pt", label: "Português", short: "PT" },
  { code: "it", label: "Italiano", short: "IT" },
  { code: "ms", label: "Melayu", short: "MS" },
  { code: "th", label: "ไทย", short: "TH" },
];

/** Set the Google Translate cookie and reload */
function applyGoogleTranslate(langCode: string) {
  const val = langCode === "en" ? "" : `/en/${langCode}`;
  // Set googtrans cookie for both apex and current host
  const host = window.location.hostname;
  const apex = host.split(".").slice(-2).join(".");
  document.cookie = `googtrans=${val}; path=/; domain=${host}`;
  document.cookie = `googtrans=${val}; path=/; domain=.${apex}`;
  // Ask Google Translate element to switch if already loaded
  const el = (window as Window & { google?: { translate?: { TranslateElement?: { getInstance?: () => { setLanguage?: (l: string) => void } } } } }).google?.translate?.TranslateElement?.getInstance?.();
  if (el?.setLanguage) {
    el.setLanguage(langCode);
  } else {
    // Fallback — reload so the cookie is picked up on load
    window.location.reload();
  }
}

function getActiveCode(): string {
  const match = document.cookie.match(/googtrans=(?:\/en\/)?([a-zA-Z-]+)/);
  if (!match) return "en";
  const code = match[1];
  return code === "en" || !code ? "en" : code;
}

export default function LanguageSwitcher({
  inverse = false,
}: {
  inverse?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(getActiveCode());
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const activeLang = LANGUAGES.find((l) => l.code === active) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Change language"
        className={`group flex flex-col items-center gap-1 text-[10px] font-medium transition-colors focus:outline-none ${
          inverse ? "text-white hover:text-white/80" : "text-slate-700 hover:text-blue-600"
        }`}
      >
        <Languages
          size={18}
          className={`stroke-[1.8] transition group-hover:-translate-y-0.5 ${
            inverse ? "" : "group-hover:text-blue-600"
          }`}
        />
        <span className="flex items-center gap-0.5">
          <span className="font-semibold">{activeLang.short}</span>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${open ? "rotate-180 text-blue-600" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Language
          </p>
          <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5 no-scrollbar">
            {LANGUAGES.map((lang) => {
              const selected = lang.code === active;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setActive(lang.code);
                    setOpen(false);
                    applyGoogleTranslate(lang.code);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                    selected
                      ? "bg-[#0f2439] text-white shadow-sm"
                      : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-7 shrink-0 text-left font-black ${selected ? "text-white" : "text-slate-500"}`}>
                      {lang.short}
                    </span>
                    <span className={`text-xs ${selected ? "text-slate-300" : "text-slate-600"}`}>
                      {lang.label}
                    </span>
                  </span>
                  {selected && <Check size={13} className="shrink-0 text-[#d95d2c]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
