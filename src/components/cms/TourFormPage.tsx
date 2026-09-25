"use client";

import { ErrorSummary } from "@/components/tours/FormKit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LuAlignLeft as AlignLeft,
  LuArrowLeft as ArrowLeft,
  LuFileText as FileText,
  LuImage as ImageIcon,
  LuCompass as MapPinned,
  LuSave as Save,
  LuSearch as Search,
  LuTags as Tags,
  LuPlus as Plus,
  LuSparkles as Sparkles,
  LuInfo as Info,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuX as X,
  LuCircleAlert as AlertCircle,
} from "react-icons/lu";

import Loader from "@/components/ui/Loader";
import CurrencySelect from "@/components/ui/CurrencySelect";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { TourWorkspaceHeader } from "@/components/tours/TourWorkspace";
import { createCms, getCms, listCms, updateCms } from "@/lib/api/services/cmsService";
import { getPricing, PricingSlab } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import api from "@/lib/api/client";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type ActiveDiscount = {
  discount_percentage: number;
  original_price_per_person: number;
  discounted_price_per_person: number;
};

type Section = "basic-core" | "settings" | "location" | "media" | "seo";

type Props = {
  tourId?: string;
  embedded?: boolean;
  role?: "admin" | "supplier";
  onSaved?: (saved?: Record<string, unknown>) => void | Promise<void>;
  initialData?: Record<string, unknown>;
  sections?: Section[];
  onGoToPricing?: () => void;
  /** Assigned to the underlying <form> so an external button (e.g. the
   * wizard's sticky "Save & Continue") can submit it via the HTML `form`
   * attribute without needing a ref or duplicating the save logic. */
  formId?: string;
};

const ALL_SECTIONS: Section[] = ["basic-core", "settings", "location", "media", "seo"];

type DropdownOption = { id: number; label: string };
type SubcategoryOption = { id: number; label: string; category_id: number | null };

function normalizeTourForm(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(",") : String(value ?? ""),
    ])
  );
}

const textFields: [string, string][] = [
  ["title", "Tour title"],
  ["subtitle", "Subtitle"],
  ["start_location", "Start location"],
  ["finish_location", "Finish location"],
];

const descriptionFields: [string, string][] = [
  ["short_description", "Short description"],
  ["long_description", "Long description"],
];

const seoFields: [string, string][] = [
  ["seo_title", "SEO title"],
  ["seo_description", "SEO description"],
  ["seo_keywords", "SEO keywords"],
  ["image_alt_text", "Image SEO / alt text"],
];

// Plain-language help under each text field, and the longest value the server accepts
// (TourPayload in app/schemas/cms.py) so the counter and the error match what a save allows.
const FIELD_HINTS: Record<string, string> = {
  title: "The name travellers see everywhere, e.g. 5-Day Golden Triangle Explorer.",
  subtitle: "One line that sells the tour. Shown under the title.",
  start_location: "Where the tour begins, e.g. Delhi Airport.",
  finish_location: "Where it ends. Leave blank if it returns to the start.",
  seo_title: "Shown as the headline in Google results. Aim for 50-60 characters.",
  seo_description: "Shown under the headline in Google results. Aim for 120-160 characters.",
  seo_keywords: "Comma-separated words people search for, e.g. india tour, golden triangle.",
  image_alt_text: "Describes the cover image for screen readers and search engines.",
};
const FIELD_MAX: Record<string, number> = {
  title: 180, subtitle: 255, start_location: 150, finish_location: 150, tour_language: 100, suitable_age_range: 100,
  short_description: 5000, long_description: 20000, seo_title: 180, seo_description: 255, seo_keywords: 255,
  focus_keyword: 180, canonical_url: 500, tour_video_url: 500, image_alt_text: 180, slug: 200,
};

const simpleNumberFields: [string, string][] = [
  ["number_of_days", "Days"],
  ["number_of_hours", "Hours"],
];

const coreDetailFields: [string, string][] = [
  ["number_of_nights", "Nights"],
  ["max_group_size", "Max group size"],
  ["min_booking_size", "Min booking size"],
];

const basicDetailFields: [string, string][] = [
  ["tour_language", "Tour language"],
  ["suitable_age_range", "Suitable age range"],
];

const mediaSeoTextFields: [string, string][] = [
  ["slug", "URL slug"],
  ["focus_keyword", "Focus keyword"],
  ["canonical_url", "Canonical URL"],
  ["tour_video_url", "Tour video URL"],
];

const DAY_OPTIONS = [
  { value: "1", label: "1 Day (Single day tour)" },
  { value: "2", label: "2 Days" },
  { value: "3", label: "3 Days" },
  { value: "4", label: "4 Days" },
  { value: "5", label: "5 Days" },
  { value: "6", label: "6 Days" },
  { value: "7", label: "7 Days (1 Week)" },
  { value: "8", label: "8 Days" },
  { value: "9", label: "9 Days" },
  { value: "10", label: "10 Days" },
  { value: "11", label: "11 Days" },
  { value: "12", label: "12 Days" },
  { value: "13", label: "13 Days" },
  { value: "14", label: "14 Days (2 Weeks)" },
  { value: "15", label: "15 Days" },
  { value: "16", label: "16 Days" },
  { value: "17", label: "17 Days" },
  { value: "18", label: "18 Days" },
  { value: "19", label: "19 Days" },
  { value: "20", label: "20 Days" },
  { value: "21", label: "21 Days (3 Weeks)" },
  { value: "22", label: "22 Days" },
  { value: "23", label: "23 Days" },
  { value: "24", label: "24 Days" },
  { value: "25", label: "25 Days" },
  { value: "26", label: "26 Days" },
  { value: "27", label: "27 Days" },
  { value: "28", label: "28 Days (4 Weeks)" },
  { value: "29", label: "29 Days" },
  { value: "30", label: "30 Days (1 Month)" },
  { value: "35", label: "35 Days (5 Weeks)" },
  { value: "40", label: "40 Days" },
  { value: "45", label: "45 Days (1.5 Months)" },
  { value: "50", label: "50 Days" },
  { value: "60", label: "60 Days (2 Months)" },
  { value: "90", label: "90 Days (3 Months)" },
];

const NIGHT_OPTIONS = [
  { value: "0", label: "0 Nights (Day tour)" },
  { value: "1", label: "1 Night" },
  { value: "2", label: "2 Nights" },
  { value: "3", label: "3 Nights" },
  { value: "4", label: "4 Nights" },
  { value: "5", label: "5 Nights" },
  { value: "6", label: "6 Nights" },
  { value: "7", label: "7 Nights (1 Week)" },
  { value: "8", label: "8 Nights" },
  { value: "9", label: "9 Nights" },
  { value: "10", label: "10 Nights" },
  { value: "11", label: "11 Nights" },
  { value: "12", label: "12 Nights" },
  { value: "13", label: "13 Nights" },
  { value: "14", label: "14 Nights (2 Weeks)" },
  { value: "15", label: "15 Nights" },
  { value: "16", label: "16 Nights" },
  { value: "17", label: "17 Nights" },
  { value: "18", label: "18 Nights" },
  { value: "19", label: "19 Nights" },
  { value: "20", label: "20 Nights" },
  { value: "21", label: "21 Nights (3 Weeks)" },
  { value: "22", label: "22 Nights" },
  { value: "23", label: "23 Nights" },
  { value: "24", label: "24 Nights" },
  { value: "25", label: "25 Nights" },
  { value: "26", label: "26 Nights" },
  { value: "27", label: "27 Nights" },
  { value: "28", label: "28 Nights (4 Weeks)" },
  { value: "29", label: "29 Nights" },
  { value: "30", label: "30 Nights (1 Month)" },
  { value: "35", label: "35 Nights" },
  { value: "40", label: "40 Nights" },
  { value: "45", label: "45 Nights" },
  { value: "50", label: "50 Nights" },
  { value: "60", label: "60 Nights" },
  { value: "90", label: "90 Nights" },
];

const HOUR_OPTIONS = [
  { value: "", label: "Not set / Multi-day tour" },
  { value: "0", label: "0 Hours" },
  { value: "1", label: "1 Hour" },
  { value: "2", label: "2 Hours" },
  { value: "3", label: "3 Hours" },
  { value: "4", label: "4 Hours (Half Day)" },
  { value: "5", label: "5 Hours" },
  { value: "6", label: "6 Hours" },
  { value: "7", label: "7 Hours" },
  { value: "8", label: "8 Hours (Full Day)" },
  { value: "9", label: "9 Hours" },
  { value: "10", label: "10 Hours" },
  { value: "11", label: "11 Hours" },
  { value: "12", label: "12 Hours (Half Day 12h)" },
  { value: "14", label: "14 Hours" },
  { value: "16", label: "16 Hours" },
  { value: "18", label: "18 Hours" },
  { value: "20", label: "20 Hours" },
  { value: "24", label: "24 Hours (Full 24h)" },
];

const MAX_GROUP_SIZE_OPTIONS = [
  { value: "", label: "Not set / Unlimited" },
  { value: "1", label: "1 (Private Solo)" },
  { value: "2", label: "2 (Couple / Duo)" },
  { value: "3", label: "3" },
  { value: "4", label: "4 (Small Private)" },
  { value: "5", label: "5" },
  { value: "6", label: "6 (Small Group)" },
  { value: "8", label: "8" },
  { value: "10", label: "10" },
  { value: "12", label: "12" },
  { value: "14", label: "14" },
  { value: "15", label: "15" },
  { value: "16", label: "16" },
  { value: "18", label: "18" },
  { value: "20", label: "20" },
  { value: "24", label: "24" },
  { value: "25", label: "25" },
  { value: "30", label: "30" },
  { value: "35", label: "35" },
  { value: "40", label: "40" },
  { value: "50", label: "50 (Coach Tour)" },
  { value: "60", label: "60" },
  { value: "80", label: "80" },
  { value: "100", label: "100+ (Large Group)" },
];

const MIN_BOOKING_SIZE_OPTIONS = [
  { value: "1", label: "1 Person (Standard)" },
  { value: "2", label: "2 People (Min 2 required)" },
  { value: "3", label: "3 People" },
  { value: "4", label: "4 People" },
  { value: "5", label: "5 People" },
  { value: "6", label: "6 People" },
  { value: "8", label: "8 People" },
  { value: "10", label: "10 People" },
];

type LanguageItem = {
  name: string;
  native: string;
  category: "Indian" | "International";
};

const ALL_LANGUAGES: LanguageItem[] = [
  // Indian Languages
  { name: "Hindi", native: "हिन्दी", category: "Indian" },
  { name: "Tamil", native: "தமிழ்", category: "Indian" },
  { name: "Telugu", native: "తెలుగు", category: "Indian" },
  { name: "Kannada", native: "ಕನ್ನಡ", category: "Indian" },
  { name: "Malayalam", native: "മലയാളം", category: "Indian" },
  { name: "Bengali", native: "বাংলা", category: "Indian" },
  { name: "Marathi", native: "मराठी", category: "Indian" },
  { name: "Gujarati", native: "ગુજરાતી", category: "Indian" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", category: "Indian" },
  { name: "Urdu", native: "اردو", category: "Indian" },
  { name: "Odia", native: "ଓଡ଼ିଆ", category: "Indian" },
  { name: "Assamese", native: "অসমীয়া", category: "Indian" },
  { name: "Sanskrit", native: "संस्कृतम्", category: "Indian" },
  { name: "Konkani", native: "कोंकणी", category: "Indian" },

  // International Languages
  { name: "English", native: "English", category: "International" },
  { name: "Spanish", native: "Español", category: "International" },
  { name: "French", native: "Français", category: "International" },
  { name: "German", native: "Deutsch", category: "International" },
  { name: "Italian", native: "Italiano", category: "International" },
  { name: "Portuguese", native: "Português", category: "International" },
  { name: "Russian", native: "Русский", category: "International" },
  { name: "Mandarin Chinese", native: "中文", category: "International" },
  { name: "Cantonese", native: "粵語", category: "International" },
  { name: "Japanese", native: "日本語", category: "International" },
  { name: "Korean", native: "한국어", category: "International" },
  { name: "Arabic", native: "العربية", category: "International" },
  { name: "Turkish", native: "Türkçe", category: "International" },
  { name: "Dutch", native: "Nederlands", category: "International" },
  { name: "Greek", native: "Ελληνικά", category: "International" },
  { name: "Thai", native: "ไทย", category: "International" },
  { name: "Vietnamese", native: "Tiếng Việt", category: "International" },
  { name: "Indonesian", native: "Bahasa Indonesia", category: "International" },
  { name: "Malay", native: "Bahasa Melayu", category: "International" },
  { name: "Persian / Farsi", native: "فارسی", category: "International" },
  { name: "Hebrew", native: "עברית", category: "International" },
  { name: "Polish", native: "Polski", category: "International" },
  { name: "Swedish", native: "Svenska", category: "International" },
  { name: "Tagalog", native: "Filipino", category: "International" },
  { name: "Multilingual", native: "Multiple Guides", category: "International" },
];

function LanguageMultiSelect({
  value,
  onChange,
  inputClass,
  error,
  required,
}: {
  value: string;
  onChange: (val: string) => void;
  inputClass: string;
  error?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | "Indian" | "International">("All");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedList = useMemo(() => {
    if (!value) return [];
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const toggleLanguage = (langName: string) => {
    const isSelected = selectedList.some(
      (s) => s.toLowerCase() === langName.toLowerCase()
    );
    let updated: string[];
    if (isSelected) {
      updated = selectedList.filter(
        (s) => s.toLowerCase() !== langName.toLowerCase()
      );
    } else {
      updated = [...selectedList, langName];
    }
    onChange(updated.join(", "));
  };

  const removeLanguage = (langName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = selectedList.filter(
      (s) => s.toLowerCase() !== langName.toLowerCase()
    );
    onChange(updated.join(", "));
  };

  const addCustomLanguage = (custom: string) => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    if (!selectedList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...selectedList, trimmed].join(", "));
    }
    setSearch("");
  };

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_LANGUAGES.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.native.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  const hasExactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_LANGUAGES.some((l) => l.name.toLowerCase() === q);
  }, [search]);

  return (
    <div ref={containerRef} className="relative block" data-field="tour_language">
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-bold uppercase text-slate-600">
          Tour language (Multi-select)
          {required && <span className="ml-1 text-red-500 font-bold">*</span>}
        </label>
        {selectedList.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className={`${inputClass} min-h-[44px] p-2 flex items-center justify-between gap-2 cursor-pointer select-none`}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {selectedList.length === 0 ? (
            <span className="text-slate-400 text-sm">Select languages...</span>
          ) : (
            selectedList.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200/90 px-2 py-0.5 text-xs font-semibold text-blue-700 shadow-2xs"
              >
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={(e) => removeLanguage(lang, e)}
                  className="rounded-full p-0.5 hover:bg-blue-200/70 text-blue-500 hover:text-blue-800 transition cursor-pointer"
                  aria-label={`Remove ${lang}`}
                >
                  <X size={11} className="stroke-[2.5]" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
          <AlertCircle size={13} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </p>
      )}

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Indian or World languages (e.g. Hindi, Tamil, French)..."
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-dash-brand focus:bg-white focus:ring-2 focus:ring-dash-brand/10 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-[11px] font-bold">
            {(["All", "Indian", "International"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  activeCategory === cat
                    ? "bg-dash-brand text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "Indian" ? "🇮🇳 Indian" : cat === "International" ? "🌍 International" : "All Languages"}
              </button>
            ))}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 no-scrollbar">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedList.some(
                (s) => s.toLowerCase() === lang.name.toLowerCase()
              );
              return (
                <button
                  key={lang.name}
                  type="button"
                  onClick={() => toggleLanguage(lang.name)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/80 text-blue-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={12} className="stroke-[3]" />}
                    </span>
                    <span>{lang.name}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({lang.native})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {lang.category === "Indian" ? "Indian" : "Global"}
                  </span>
                </button>
              );
            })}

            {filteredLanguages.length === 0 && !search && (
              <p className="py-4 text-center text-xs text-slate-400">
                No languages found in this category.
              </p>
            )}

            {search.trim() && !hasExactMatch && (
              <button
                type="button"
                onClick={() => addCustomLanguage(search)}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-100/70 transition cursor-pointer"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>Add &quot;{search.trim()}&quot; as custom language</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="text-slate-500 font-medium">
              {selectedList.length === 0
                ? "No languages selected"
                : `${selectedList.length} selected`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SUITABLE_AGE_RANGE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "All ages", label: "All ages (0+)" },
  { value: "3+", label: "3+ years (Family friendly)" },
  { value: "6+", label: "6+ years (Kids & Families)" },
  { value: "10+", label: "10+ years" },
  { value: "12", label: "12+ years" },
  { value: "12+", label: "12+ years (Teens & Adults)" },
  { value: "15+", label: "15+ years" },
  { value: "16+", label: "16+ years" },
  { value: "18+", label: "18+ years (Adults only)" },
  { value: "21+", label: "21+ years (Drinking & Nightlife)" },
  { value: "50+", label: "Seniors (50+)" },
];

const DEPOSIT_CUTOFF_OPTIONS = [
  { value: "", label: "No cutoff -- deposit always allowed" },
  { value: "0", label: "0 days (Until departure day)" },
  { value: "1", label: "1 day before departure" },
  { value: "2", label: "2 days before departure" },
  { value: "3", label: "3 days before departure" },
  { value: "5", label: "5 days before departure" },
  { value: "7", label: "7 days before departure (1 Week)" },
  { value: "10", label: "10 days before departure" },
  { value: "14", label: "14 days before departure (2 Weeks)" },
  { value: "21", label: "21 days before departure (3 Weeks)" },
  { value: "30", label: "30 days before departure (1 Month)" },
  { value: "45", label: "45 days before departure" },
  { value: "60", label: "60 days before departure (2 Months)" },
];

function FormDropdownField({
  name,
  label,
  value,
  onChange,
  options,
  inputClass,
  error,
  required,
  placeholder,
  inputType = "text",
  min,
  max,
  helpText,
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  inputClass: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  inputType?: "text" | "number";
  min?: number;
  max?: number;
  helpText?: string;
}) {
  const isPreset = useMemo(() => {
    if (!value) return true;
    return options.some((opt) => opt.value === String(value));
  }, [options, value]);

  const [customMode, setCustomMode] = useState<boolean>(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      setCustomMode(true);
    } else {
      setCustomMode(false);
      onChange(selected);
    }
  };

  const selectValue = value !== undefined && value !== null ? String(value) : "";

  return (
    <div className="block" data-field={name}>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={name} className="block text-xs font-bold uppercase text-slate-600">
          {label}
          {required && <span className="ml-1 text-red-500 font-bold">*</span>}
        </label>
        {customMode ? (
          <button
            type="button"
            onClick={() => setCustomMode(false)}
            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            ← Quick Select
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className="text-[11px] font-medium text-slate-400 hover:text-blue-600 hover:underline cursor-pointer"
          >
            Custom
          </button>
        )}
      </div>

      {customMode ? (
        <input
          id={name}
          name={name}
          type={inputType}
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          autoFocus
          className={inputClass}
        />
      ) : (
        <select
          id={name}
          name={name}
          value={selectValue}
          onChange={handleSelectChange}
          className={`${inputClass} cursor-pointer`}
        >
          {!isPreset && value ? (
            <option value={value}>{value} (Current)</option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value="__custom__">✏️ Custom / Enter manually...</option>
        </select>
      )}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
          <AlertCircle size={13} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </p>
      )}
      {helpText && !error && <span className="mt-1 block text-[11px] text-slate-400">{helpText}</span>}
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  role,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  role: "admin" | "supplier";
  badge?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-shadow">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6 rounded-t-2xl bg-gradient-to-r from-slate-50/50 via-white to-slate-50/20">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl shadow-2xs ${
            role === "supplier" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-100"
          }`}>
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {description && <p className="text-xs font-normal text-slate-500">{description}</p>}
          </div>
        </div>
        {badge && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {badge}
          </span>
        )}
      </div>
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default function TourFormPage({
  tourId,
  embedded = false,
  role = "admin",
  onSaved,
  initialData,
  sections = ALL_SECTIONS,
  formId,
}: Props) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const showBasic = sections.includes("basic-core");
  const showSettings = sections.includes("settings");
  const showLocation = sections.includes("location");
  const showMedia = sections.includes("media");
  const showSeo = sections.includes("seo");
  const isSupplier = role === "supplier";
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const baseInputClass = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition shadow-2xs font-normal ${
    isSupplier
      ? "focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      : "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
  }`;
  const defaultInputClass = `${baseInputClass} border-slate-200 bg-white text-slate-800 hover:border-slate-300 placeholder:text-slate-400`;
  const errorInputClass = `${baseInputClass} border-red-400 bg-red-50/20 text-slate-900 focus:border-red-500 focus:ring-red-100 placeholder:text-red-300`;
  const inputClass = defaultInputClass;
  const getInputClass = (fieldName: string) => (errors[fieldName] ? errorInputClass : defaultInputClass);

  const saveButtonClass = isSupplier
    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all";
  const [form, setForm] = useState<Record<string, string>>(() =>
    initialData
      ? normalizeTourForm(initialData)
      : {
          currency: "USD",
          status: "draft",
           number_of_days: "1",
         }
  );
  const [supplierCurrency, setSupplierCurrency] = useState("");

  // New tours start with the platform's default deposit terms already
  // filled in (rather than a blank field that reads as "no deposit"),
  // matching what booking creation already falls back to when a tour
  // hasn't set its own (see services.settings.get_default_deposit_percentage
  // and friends) -- editable from here, not locked to the default.
  useEffect(() => {
    if (initialData || tourId) return;
    api.get("/settings/public").then((res) => {
      const settings = res.data?.data ?? {};
      setForm((prev) => ({
        ...prev,
        deposit_type: prev.deposit_type ?? "percentage",
        deposit_percentage: prev.deposit_percentage ?? settings.default_deposit_percentage ?? "20",
        deposit_cutoff_days: prev.deposit_cutoff_days ?? settings.default_deposit_cutoff_days ?? "30",
        balance_payment_deadline_days: prev.balance_payment_deadline_days ?? settings.default_balance_payment_deadline_days ?? "14",
      }));
    }).catch(() => {
      // Non-fatal -- the fields stay blank and the same defaults still
      // apply automatically at booking time either way.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New tours created by a supplier start pre-filled with that supplier's
  // own country/currency (set on their profile - see CompanyInfoTab) rather
  // than always defaulting to blank country / USD. The supplier can still
  // change either field manually afterward.
  useEffect(() => {
    if (!isSupplier) return;
    api.get("/suppliers/me").then((res) => {
      const supplier = res.data?.data ?? {};
      const profileCurrency = String(supplier.currency || "").trim().toUpperCase();
      if (profileCurrency) setSupplierCurrency(profileCurrency);
      setForm((prev) => ({
        ...prev,
        country_id: prev.country_id || (supplier.country_id ? String(supplier.country_id) : prev.country_id),
        currency: profileCurrency || prev.currency,
      }));
    }).catch(() => {
      // Non-fatal -- the form just keeps its blank/USD defaults.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [loading, setLoading] = useState(Boolean(tourId && !initialData));
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ message: string; current_updated_by?: number } | null>(null);
  // Storefront Price preview (Basic Information step) - sourced from the
  // 1-pax pricing slab so it matches Pricing & Discounts exactly (admins see
  // its storefront price incl. markup, suppliers their own price).
  // activeDiscount (services/cms.py _active_discount) only adds the
  // struck-through original and "% OFF" badge when a discount is live.
  const [activeDiscount, setActiveDiscount] = useState<ActiveDiscount | null>(null);
  const [onePaxSlab, setOnePaxSlab] = useState<PricingSlab | null>(null);

  const [selectedStateId, setSelectedStateId] = useState("");
  const { countries } = useGeoCountries();
  const { states } = useGeoStates(form.country_id ? Number(form.country_id) : null);
  const { cities } = useGeoCities(
    selectedStateId ? Number(selectedStateId) : null,
    form.country_id ? Number(form.country_id) : null
  );
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);

  useEffect(() => {
    let shouldUpdateState = true;

    async function loadDropdownOptions() {
      try {
        let categoryItems: Array<Record<string, unknown>> = [];
        let subcategoryItems: Array<Record<string, unknown>> = [];
        let supplierItems: Array<{ id: number; supplier_name?: string; name?: string }> = [];

        if (isSupplier) {
          const [categoryResponse, subcategoryResponse] = await Promise.all([
            api.get("/tours/categories", { params: { limit: 200 } }),
            api.get("/public/subcategories"),
          ]);
          categoryItems = categoryResponse.data?.items ?? categoryResponse.data?.data ?? [];
          subcategoryItems = subcategoryResponse.data?.items ?? subcategoryResponse.data?.data ?? [];
        } else {
          const [categoryResponse, subcategoryResponse, supplierResponse] = await Promise.all([
            listCms("/tour-categories", { limit: 200 }),
            listCms("/tour-subcategories", { limit: 500 }),
            api.get("/suppliers/", { params: { limit: 200 } }),
          ]);
          categoryItems = (categoryResponse.items ?? []) as Array<Record<string, unknown>>;
          subcategoryItems = (subcategoryResponse.items ?? []) as Array<Record<string, unknown>>;
          supplierItems = supplierResponse.data?.items ?? supplierResponse.data?.data ?? [];
        }

        if (!shouldUpdateState) return;

        setCategories(
          categoryItems.map((category) => ({
            id: Number(category.id),
            label: String(category.category_name),
          }))
        );
        setSuppliers(
          supplierItems.map((supplier) => ({
            id: supplier.id,
            label: String(supplier.supplier_name ?? supplier.name ?? supplier.id),
          }))
        );
        setSubcategories(
          subcategoryItems.map((subcategory) => ({
            id: Number(subcategory.id),
            label: String(subcategory.subcategory_name ?? subcategory.id),
            category_id: subcategory.category_id != null ? Number(subcategory.category_id) : null,
          }))
        );
      } catch {
        if (shouldUpdateState) toast.error("Could not load tour form options.");
      }
    }

    void loadDropdownOptions();

    return () => {
      shouldUpdateState = false;
    };
  }, [isSupplier, toast]);

  const fetchTour = useCallback(async () => {
    if (!tourId || initialData) return;
    setLoading(true);
    try {
      const data = await getCms("/tours", tourId);
      setForm(normalizeTourForm(data));
      setActiveDiscount((data as { active_discount?: ActiveDiscount }).active_discount ?? null);
    } catch {
      toast.error("Could not load tour.");
    } finally {
      setLoading(false);
    }
  }, [initialData, toast, tourId]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  useEffect(() => {
    if (initialData) {
      setForm(normalizeTourForm(initialData));
      setActiveDiscount((initialData as { active_discount?: ActiveDiscount }).active_discount ?? null);
    }
  }, [initialData]);

  useEffect(() => {
    if (!tourId) return;
    let active = true;
    getPricing(tourId).then((slabs) => {
      if (!active) return;
      const slab = slabs.find((s) => s.passenger_from <= 1 && (s.passenger_to ?? 1) >= 1) ?? slabs[0] ?? null;
      setOnePaxSlab(slab);

      // Back-fill an existing tour's currency to the supplier's own profile
      // currency the same way a brand-new tour already is (see the
      // "New tours created by a supplier" effect above) - but ONLY when the
      // tour has zero pricing slabs saved. Every priced slab is a real,
      // already-transacted number; relabeling the tour's currency without
      // converting those numbers would misstate them (e.g. 82.42 USD would
      // instantly read as 82.42 QAR, a completely different real value), so
      // any tour that has been priced at all is left exactly as it is.
      if (isSupplier && slabs.length === 0 && (initialData as { currency?: string } | null)?.currency === "USD") {
        api.get("/suppliers/me").then((res) => {
          if (!active) return;
          const supplierCurrency = res.data?.data?.currency;
          if (supplierCurrency && supplierCurrency !== "USD") {
            setForm((prev) => (prev.currency === "USD" ? { ...prev, currency: supplierCurrency } : prev));
          }
        }).catch(() => {
          // Non-fatal -- the tour just keeps its existing USD currency.
        });
      }
    }).catch(() => {
      // Non-fatal -- the Storefront Price preview simply stays hidden.
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, isSupplier]);

  useEffect(() => {
    if (form.state_id && !selectedStateId) setSelectedStateId(form.state_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.state_id]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedSubcategoryIds = useMemo(
    () =>
      (form.subcategory_ids || "")
        .split(",")
        .map((item) => Number(item.trim()))
        .filter(Boolean),
    [form.subcategory_ids]
  );

  const toggleSubcategory = (id: number) => {
    const next = selectedSubcategoryIds.includes(id)
      ? selectedSubcategoryIds.filter((existing) => existing !== id)
      : [...selectedSubcategoryIds, id];
    update("subcategory_ids", next.join(","));
  };

  const visibleSubcategories = useMemo(() => {
    if (!form.category_id) return subcategories;
    const categoryId = Number(form.category_id);
    return subcategories.filter((subcategory) => subcategory.category_id === categoryId);
  }, [subcategories, form.category_id]);

  const validateForm = (sectionsToValidate: Section[]): boolean => {
    const newErrors: Record<string, string> = {};

    const checkBasic = sectionsToValidate.includes("basic-core");
    const checkLocation = sectionsToValidate.includes("location");
    const checkSettings = sectionsToValidate.includes("settings");
    const checkMedia = sectionsToValidate.includes("media");
    const checkSeo = sectionsToValidate.includes("seo");

    if (checkBasic) {
      const title = form.title?.trim() ?? "";
      if (!title) {
        newErrors.title = "Tour title is required.";
      } else if (title.length < 3) {
        newErrors.title = "Tour title must be at least 3 characters.";
      }

      const days = Number(form.number_of_days);
      if (!form.number_of_days || isNaN(days) || days < 1) {
        newErrors.number_of_days = "Duration must be at least 1 day.";
      }

      if (form.number_of_hours !== undefined && form.number_of_hours !== "") {
        const hours = Number(form.number_of_hours);
        if (isNaN(hours) || hours < 0) {
          newErrors.number_of_hours = "Hours cannot be negative.";
        }
      }

      if (form.number_of_nights !== undefined && form.number_of_nights !== "") {
        const nights = Number(form.number_of_nights);
        if (isNaN(nights) || nights < 0) {
          newErrors.number_of_nights = "Nights cannot be negative.";
        }
      }

      const maxGroup = form.max_group_size ? Number(form.max_group_size) : null;
      const minBooking = form.min_booking_size ? Number(form.min_booking_size) : null;

      if (maxGroup !== null && (isNaN(maxGroup) || maxGroup < 1)) {
        newErrors.max_group_size = "Max group size must be at least 1.";
      }

      if (minBooking !== null) {
        if (isNaN(minBooking) || minBooking < 1) {
          newErrors.min_booking_size = "Min booking size must be at least 1.";
        } else if (maxGroup !== null && minBooking > maxGroup) {
          newErrors.min_booking_size = "Min booking size cannot exceed max group size.";
        }
      }
    }

    if (checkLocation) {
      if (!form.country_id) {
        newErrors.country_id = "Please select a destination country.";
      }
      if (!form.category_id) {
        newErrors.category_id = "Please select a tour category.";
      }
    }

    if (checkSettings) {
      if ((form.deposit_type ?? "fixed") === "percentage") {
        if (form.deposit_percentage !== undefined && form.deposit_percentage !== "") {
          const dep = Number(form.deposit_percentage);
          if (isNaN(dep) || dep < 0 || dep > 100) {
            newErrors.deposit_percentage = "Deposit percentage must be between 0% and 100%.";
          }
        }
      } else {
        if (form.booking_deposit !== undefined && form.booking_deposit !== "") {
          const fix = Number(form.booking_deposit);
          if (isNaN(fix) || fix < 0) {
            newErrors.booking_deposit = "Deposit amount cannot be negative.";
          }
        }
      }

      if (form.tax_percentage !== undefined && form.tax_percentage !== "") {
        const tax = Number(form.tax_percentage);
        if (isNaN(tax) || tax < 0 || tax > 100) {
          newErrors.tax_percentage = "Tax percentage must be between 0% and 100%.";
        }
      }

      if (form.service_fee !== undefined && form.service_fee !== "") {
        const fee = Number(form.service_fee);
        if (isNaN(fee) || fee < 0) {
          newErrors.service_fee = "Service fee cannot be negative.";
        }
      }
    }

    if (checkMedia) {
      if (form.tour_video_url?.trim()) {
        const url = form.tour_video_url.trim();
        if (!/^https?:\/\//i.test(url)) {
          newErrors.tour_video_url = "Video URL must start with http:// or https://";
        }
      }
    }

    if (checkSeo) {
      if (form.slug?.trim()) {
        const slug = form.slug.trim();
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
          newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";
        }
      }
      if (form.canonical_url?.trim()) {
        const url = form.canonical_url.trim();
        if (!/^https?:\/\//i.test(url)) {
          newErrors.canonical_url = "Canonical URL must start with http:// or https://";
        }
      }
    }

    // Longest values the server accepts - caught here so the message sits next to the field.
    for (const [field, max] of Object.entries(FIELD_MAX)) {
      const inScope =
        (checkBasic && ["title", "subtitle", "start_location", "finish_location", "tour_language", "suitable_age_range"].includes(field)) ||
        (checkLocation && ["short_description", "long_description"].includes(field)) ||
        (checkMedia && ["tour_video_url", "image_alt_text"].includes(field)) ||
        (checkSeo && ["seo_title", "seo_description", "seo_keywords", "focus_keyword", "canonical_url", "slug"].includes(field));
      const value = form[field] ?? "";
      if (inScope && !newErrors[field] && value.length > max) {
        newErrors[field] = `This can be at most ${max} characters - it is ${value.length} now.`;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      const selector = `[data-field="${firstField}"], [name="${firstField}"], #${firstField}`;
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = el.matches("input, select, textarea") ? el : el.querySelector("input, select, textarea");
        (focusable as HTMLElement | null)?.focus?.();
      }
      toast.error("Please resolve the highlighted field errors.");
      return false;
    }

    return true;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm(sections)) {
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {};

    // The backend's PUT /tours/{id} requires the full TourPayload on every
    // save (title, etc. are non-optional there's no partial-update
    // support), so an edit must always send every section's fields, not
    // just the one currently shown - otherwise saving from e.g. the
    // Media/SEO step alone 422s with "title: Field required". This is safe
    // because fetchTour() above always hydrates `form` with the complete
    // tour on edit (tourId set), so the other sections' values in `form`
    // are real server data, not stale/blank local state. Only when
    // creating a brand-new tour (no tourId yet) do we still gate by the
    // section actually shown, since there is no prior tour to preserve.
    const isEditingExistingTour = Boolean(tourId);
    if (showBasic || showSettings || isEditingExistingTour) {
      for (const [key] of [...textFields, ...descriptionFields, ...simpleNumberFields, ...coreDetailFields, ...basicDetailFields]) {
        payload[key] = form[key]?.trim() ?? "";
      }
      payload.currency = form.currency || "USD";
      payload.tour_visibility = form.tour_visibility || "public";
      payload.featured = form.featured === "true";
      payload.requires_supplier_confirmation = form.requires_supplier_confirmation !== "false";
      payload.deposit_type = form.deposit_type || "fixed";
      payload.booking_deposit = form.booking_deposit ? Number(form.booking_deposit) : 0;
      payload.deposit_percentage = form.deposit_percentage ? Number(form.deposit_percentage) : null;
      payload.deposit_cutoff_days = form.deposit_cutoff_days ? Number(form.deposit_cutoff_days) : null;
      payload.balance_payment_deadline_days = form.balance_payment_deadline_days ? Number(form.balance_payment_deadline_days) : null;
      payload.tax_percentage = form.tax_percentage ? Number(form.tax_percentage) : 0;
      payload.service_fee = form.service_fee ? Number(form.service_fee) : 0;

      // Simple number fields - use default if blank
      // price_start_per_person is intentionally omitted -- it's system-
      // calculated from approved Supplier Pricing (see save_tour's pop), not
      // a client-editable value.
      payload.number_of_days = form.number_of_days ? Number(form.number_of_days) : 1;
      payload.number_of_hours = form.number_of_hours ? Number(form.number_of_hours) : null;
      payload.number_of_nights = form.number_of_nights ? Number(form.number_of_nights) : null;
      payload.max_group_size = form.max_group_size ? Number(form.max_group_size) : null;
      payload.min_booking_size = form.min_booking_size ? Number(form.min_booking_size) : null;
      payload.pricing_type = form.pricing_type || "per_person";
    }

    if (showLocation || isEditingExistingTour) {
      payload.supplier_id = form.supplier_id ? Number(form.supplier_id) : null;
      payload.category_id = form.category_id ? Number(form.category_id) : null;
      payload.subcategory_ids = selectedSubcategoryIds;
      payload.country_id = form.country_id ? Number(form.country_id) : null;
      payload.state_id = selectedStateId ? Number(selectedStateId) : null;
      payload.city_id = form.city_id ? Number(form.city_id) : null;
    }

    if (showMedia || showSeo || isEditingExistingTour) {
      for (const [key] of [...seoFields, ...mediaSeoTextFields]) {
        payload[key] = form[key]?.trim() ?? "";
      }
      payload.banner_image = form.banner_image?.trim() ?? "";
      payload.map_image = form.map_image?.trim() ?? "";
      payload.mobile_cover_image = form.mobile_cover_image?.trim() ?? "";
      payload.open_graph_image = form.open_graph_image?.trim() ?? "";
      payload.brochure_pdf = form.brochure_pdf?.trim() ?? "";
      payload.search_visibility = form.search_visibility !== "false";
    }

    if (tourId && form.updated_at) payload.expected_updated_at = form.updated_at;

    try {
      const saved = tourId
        ? await updateCms("/tours", tourId, payload)
        : await createCms("/tours", payload);
      toast.success("Tour saved successfully.");
      setErrors({});
      await onSaved?.(saved);
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: Record<string, unknown> } })?.response;
      if (response?.status === 409 && response.data) {
        setConflict({
          message: String(response.data.message ?? "This tour was updated by another user. Reload the latest changes before saving."),
          current_updated_by: response.data.current_updated_by as number | undefined,
        });
        return;
      }

      if (response?.status === 422 && Array.isArray(response.data?.detail)) {
        const serverErrors: Record<string, string> = {};
        for (const item of response.data.detail as Array<{ loc?: Array<string | number>; msg?: string }>) {
          const field = item.loc?.[item.loc.length - 1];
          if (field && typeof item.msg === "string") {
            serverErrors[String(field)] = item.msg;
          }
        }
        if (Object.keys(serverErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...serverErrors }));
          const firstField = Object.keys(serverErrors)[0];
          const el = document.querySelector(`[data-field="${firstField}"], [name="${firstField}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          (el as HTMLElement)?.focus?.();
          toast.error("Some fields contain invalid data. Please review the errors below.");
          return;
        }
      }

      // The backend's validation-error handler returns `detail` as an
      // array of per-field error objects, not a string (see
      // middleware/error_handlers.py) -- `message` is always the
      // human-readable string and must be preferred, or a toast ends up
      // trying to render that array as a React child and crashes the page.
      const detail = response?.data?.detail;
      const msg =
        (typeof response?.data?.message === "string" ? response.data.message : undefined) ??
        (typeof detail === "string" ? detail : undefined) ??
        "Could not save tour.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const reloadLatest = async () => {
    if (!tourId) return;
    setLoading(true);
    try {
      const data = await getCms("/tours", tourId);
      setForm(normalizeTourForm(data));
      setConflict(null);
    } catch {
      toast.error("Could not reload the tour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-200">
      {!embedded && (
        <TourWorkspaceHeader
          role={role}
          title={tourId ? "Edit Tour" : "Create New Tour"}
          description={
            isSupplier
              ? "Start with the essentials, set your pricing, then continue in the full editor for itinerary, gallery, inclusions, and availability."
              : "Build the complete tour record, assign its supplier and location, add media, then choose when it should be published."
          }
          icon={MapPinned}
          eyebrow={isSupplier ? "Tour Builder" : "Admin Tour Builder"}
          actions={[{
            label: isSupplier ? "Back to My Tours" : "Back to Tours",
            href: isSupplier ? "/supplier/tours" : "/admin/tours",
            icon: ArrowLeft,
            variant: "secondary",
          }]}
        />
      )}

      {tourId && (form.status === "pending_approval" || form.status === "repricing_required" || form.pending_review_kind) && (
        <div className={`${embedded ? "" : "mt-4"} flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3`}>
          <p className="text-sm font-semibold text-amber-800">
            This tour has a submission awaiting admin review. Saving changes now will replace that pending version with a new one and restart the review — withdraw the current submission first if you want to keep it intact.
          </p>
        </div>
      )}

      {conflict && (
        <div className={`${embedded ? "" : "mt-4"} flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3`}>
          <p className="text-sm font-semibold text-amber-800">{conflict.message}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => void reloadLatest()} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700">
              Reload Latest
            </button>
            <button type="button" onClick={() => setConflict(null)} className="rounded-xl border border-amber-300 px-4 py-2 text-xs font-black text-amber-800 hover:bg-amber-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={embedded ? "" : "mt-4"}>
          <Loader label="Loading tour..." />
        </div>
      ) : (
        <form onSubmit={submit} id={formId} noValidate className={`${embedded ? "" : "mx-auto mt-4 max-w-6xl"} space-y-4`}>
          <ErrorSummary errors={Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message)))} />
          {/* Embedded in the tour editor, the step's single Save button (bottom bar) submits this form. */}
          {!embedded && (
          <div id="tour-form-save-bar" className="flex flex-col gap-3 rounded-2xl border border-[#DCE6F3] bg-white px-4 py-3 shadow-[0_10px_30px_-28px_rgba(28,83,160,.8)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-dash-text">{tourId ? "Tour essentials" : "Tour setup"}</p>
              <p className="mt-0.5 text-[11px] text-dash-subtle">
                {tourId ? "Update the main tour record, then continue through the editor sections." : "Complete the sections below. You can refine itinerary and pricing after creation."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#DDE6F2] bg-[#F7F9FC] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-dash-muted">
                {form.status || "draft"}
              </span>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-60 ${saveButtonClass}`}
              >
                <Save size={16} /> {saving ? "Saving..." : isSupplier ? "Save Changes" : "Save Tour"}
              </button>
            </div>
          </div>
          )}

          {showBasic && (
          <FormSection role={role} icon={FileText} title="Basic tour details" description="Title, pricing, and duration.">
            {tourId && (
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour code</span>
                <input value={form.tour_code ?? "Assigned on save"} disabled className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`} />
              </label>
            )}
            {tourId && onePaxSlab && (() => {
              // Admin: the 1-pax storefront price (supplier price + Tourvaa
              // markup) customers pay. Supplier: their own 1-pax price -- the
              // API strips storefront/markup fields for suppliers, so the
              // markup is never shown to them. Shown with or without a
              // discount; an active discount adds the struck-through original
              // and the "% OFF" badge.
              const original = Number((isSupplier ? onePaxSlab.adult_price : onePaxSlab.storefront_adult_price ?? onePaxSlab.adult_price) ?? 0);
              const discountPercent = activeDiscount?.discount_percentage ?? 0;
              const discounted = original * (1 - discountPercent / 100);
              const money = (n: number) => `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${onePaxSlab.currency}`;
              return (
                <div className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">
                    {isSupplier ? "Your price (1 pax)" : "Storefront price (1 pax)"}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dash-border bg-[#F7F9FC] px-4 py-3">
                    {discountPercent > 0 && (
                      <span className="text-sm font-medium text-dash-subtle line-through decoration-red-400 decoration-2">{money(original)}</span>
                    )}
                    <span className="text-lg font-black text-dash-text">{money(discounted)}</span>
                    {discountPercent > 0 && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-dash-subtle">
                    {isSupplier
                      ? (discountPercent > 0 ? "Your 1-pax adult price from the Pricing step, with your active discount applied." : "Your 1-pax adult price from the Pricing step.")
                      : (discountPercent > 0
                        ? "Supplier price + Tourvaa markup, with the active discount applied -- what customers see on the storefront right now."
                        : "Supplier price + Tourvaa markup -- what customers see on the storefront right now.")}
                  </p>
                </div>
              );
            })()}
            {textFields.map(([key, label]) => {
              const isRequired = key === "title";
              return (
                <label key={key} data-field={key} className="block">
                  <span className="mb-1 flex items-end justify-between gap-2 text-xs font-bold uppercase text-slate-600">
                    <span>
                      {label}
                      {isRequired ? <span className="ml-1 text-red-500 font-bold">*</span> : <span className="ml-1 font-medium normal-case text-slate-400">(optional)</span>}
                    </span>
                    {FIELD_MAX[key] && (
                      <span className={`text-[11px] font-semibold normal-case ${(form[key] ?? "").length > FIELD_MAX[key] ? "text-red-600" : "text-slate-400"}`}>
                        {(form[key] ?? "").length}/{FIELD_MAX[key]}
                      </span>
                    )}
                  </span>
                  <input
                    name={key}
                    value={form[key] ?? ""}
                    onChange={(e) => {
                      update(key, e.target.value);
                      if (errors[key]) clearError(key);
                    }}
                    placeholder={
                      key === "title"
                        ? "e.g. 5-Day Golden Triangle Explorer"
                        : key === "subtitle"
                        ? "e.g. Luxury heritage journey across Delhi, Agra & Jaipur"
                        : undefined
                    }
                    className={getInputClass(key)}
                  />
                  {errors[key] ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0 text-red-500" />
                      <span>{errors[key]}</span>
                    </p>
                  ) : (
                    FIELD_HINTS[key] && <span className="mt-1 block text-[11px] text-slate-400">{FIELD_HINTS[key]}</span>
                  )}
                </label>
              );
            })}

            <label data-field="currency" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">
                Currency
                <span className="ml-1 text-red-500 font-bold">*</span>
              </span>
              {isSupplier ? (
                <input
                  value={supplierCurrency || form.currency || "Not configured"}
                  readOnly
                  disabled
                  title="Currency is taken from your supplier profile."
                  className={`${defaultInputClass} cursor-not-allowed bg-slate-50 text-slate-600 disabled:opacity-100`}
                />
              ) : (
                <CurrencySelect
                  value={form.currency ?? "USD"}
                  onChange={(code) => {
                    update("currency", code);
                    if (errors.currency) clearError("currency");
                  }}
                  className={getInputClass("currency")}
                />
              )}
              {errors.currency && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.currency}</span>
                </p>
              )}
            </label>

            <FormDropdownField
              name="number_of_days"
              label="Days"
              required
              error={errors.number_of_days}
              value={form.number_of_days ?? "1"}
              onChange={(val) => {
                update("number_of_days", val);
                if (errors.number_of_days) clearError("number_of_days");
              }}
              options={DAY_OPTIONS}
              inputClass={getInputClass("number_of_days")}
              inputType="number"
              min={1}
              placeholder="e.g. 1"
              helpText="Tour duration in days (minimum 1 day)."
            />

            <FormDropdownField
              name="number_of_hours"
              label="Hours"
              error={errors.number_of_hours}
              value={form.number_of_hours ?? ""}
              onChange={(val) => {
                update("number_of_hours", val);
                if (errors.number_of_hours) clearError("number_of_hours");
              }}
              options={HOUR_OPTIONS}
              inputClass={getInputClass("number_of_hours")}
              inputType="number"
              min={0}
              placeholder="e.g. 8"
              helpText="Optional: duration in hours for day tours."
            />

            <FormDropdownField
              name="number_of_nights"
              label="Nights"
              error={errors.number_of_nights}
              value={form.number_of_nights ?? "0"}
              onChange={(val) => {
                update("number_of_nights", val);
                if (errors.number_of_nights) clearError("number_of_nights");
              }}
              options={NIGHT_OPTIONS}
              inputClass={getInputClass("number_of_nights")}
              inputType="number"
              min={0}
              placeholder="e.g. 0"
            />

            <FormDropdownField
              name="max_group_size"
              label="Max group size"
              error={errors.max_group_size}
              value={form.max_group_size ?? ""}
              onChange={(val) => {
                update("max_group_size", val);
                if (errors.max_group_size) clearError("max_group_size");
                if (errors.min_booking_size) clearError("min_booking_size");
              }}
              options={MAX_GROUP_SIZE_OPTIONS}
              inputClass={getInputClass("max_group_size")}
              inputType="number"
              min={1}
              placeholder="e.g. 16"
              helpText="Maximum travellers per departure."
            />

            <FormDropdownField
              name="min_booking_size"
              label="Min booking size"
              error={errors.min_booking_size}
              value={form.min_booking_size ?? "1"}
              onChange={(val) => {
                update("min_booking_size", val);
                if (errors.min_booking_size) clearError("min_booking_size");
              }}
              options={MIN_BOOKING_SIZE_OPTIONS}
              inputClass={getInputClass("min_booking_size")}
              inputType="number"
              min={1}
              placeholder="e.g. 1"
              helpText="Minimum passengers required per single booking."
            />

            <LanguageMultiSelect
              value={form.tour_language ?? "English"}
              onChange={(val) => {
                update("tour_language", val);
                if (errors.tour_language) clearError("tour_language");
              }}
              inputClass={getInputClass("tour_language")}
              error={errors.tour_language}
            />

            <FormDropdownField
              name="suitable_age_range"
              label="Suitable age range"
              error={errors.suitable_age_range}
              value={form.suitable_age_range ?? ""}
              onChange={(val) => {
                update("suitable_age_range", val);
                if (errors.suitable_age_range) clearError("suitable_age_range");
              }}
              options={SUITABLE_AGE_RANGE_OPTIONS}
              inputClass={getInputClass("suitable_age_range")}
              inputType="text"
              placeholder="e.g. 12+"
            />

          </FormSection>
          )}

          {showBasic && (
          <FormSection role={role} icon={AlignLeft} title="Descriptions" description="Shown on the public tour page.">
            {descriptionFields.map(([key, label]) => {
                            if (key === "long_description") {
                const words = (form.long_description || "").trim().split(/\s+/).filter(Boolean).length;

                const handleAppendSection = (title: string, desc: string) => {
                  const add = `\n\n${title}: ${desc}`;
                  update("long_description", (form.long_description ? form.long_description.trimEnd() : "") + add);
                };

                const handleTemplate = async () => {
                  const sample = `Tour Overview & Atmosphere: Embark on an unforgettable voyage curated for travellers seeking scenic wonder, effortless comfort, and genuine cultural immersion.\n\nKey Highlights: Marvel at world-renowned landscapes, wander charming historic districts, and capture panoramic views from iconic viewpoints along the journey.\n\nTravel Comfort & Inclusions: Travel in modern, climate-controlled comfort with expert local guidance, boutique accommodation stays, and authentic culinary stops curated at every turn.`;
                  if (!form.long_description || (await confirm({ title: "Insert template", message: "Insert standard tour overview narrative template? This will replace the current text.", confirmLabel: "Insert" }))) {
                    update("long_description", sample);
                  }
                };

                const handleFormatSpacing = () => {
                  if (!form.long_description) return;
                  const formatted = form.long_description
                    .replace(/(?:^|\n|(?<=[.!?"]\s+))([A-Z0-9][A-Za-z0-9\s&'/–—\-]+:)/g, "\n\n$1")
                    .trim();
                  update("long_description", formatted);
                };

                return (
                  <div key={key} className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-slate-50/30 p-4 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 shadow-xs">
                    {/* Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                          <Sparkles size={14} className="text-blue-600" />
                          {label} (Narrative Overview)
                        </span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                          Shown on public tour page
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        <span>{words} words</span>
                        <span className="mx-1.5">•</span>
                        <span>{(form.long_description || "").length} characters</span>
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={form.long_description ?? ""}
                      onChange={(e) => update("long_description", e.target.value)}
                      rows={8}
                      placeholder="Comprehensive tour narrative and overview. Introduce the journey, destination atmosphere, key highlights, travel comfort, and unforgettable memories awaiting guests..."
                      className="w-full min-h-48 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-normal shadow-2xs"
                    />

                    {/* In-Editor Toolbar Docked Inside Detailer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAppendSection("Tour Highlights & Key Experiences", "Describe the top scenic points, guided adventures, and must-see attractions...")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow active:scale-95"
                          title="Append a highlighted section"
                        >
                          <Plus size={13} /> Add Highlight Section
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAppendSection("Scenic Route & Landscape", "Describe the route beauty, coastlines, and photographic vistas...")}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          + Scenic Route
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAppendSection("Included Travel Comfort", "Highlight comfortable vehicle transfers, curated accommodation, and attentive service...")}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          + Included Comfort
                        </button>

                        <button
                          type="button"
                          onClick={handleTemplate}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          <Sparkles size={11} className="text-amber-500" /> Template
                        </button>

                        <button
                          type="button"
                          onClick={handleFormatSpacing}
                          disabled={!form.long_description}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                        >
                          Clean Spacing
                        </button>
                      </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
                      <Info size={13} className="text-blue-500 shrink-0" />
                      <span>
                        Use structured section titles (e.g. <strong className="text-slate-700">Tour Highlights:</strong> or <strong className="text-slate-700">Included Comfort:</strong>) to make long tour overviews easy to scan and read for prospective guests.
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <label key={key} className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
                  <textarea
                    value={form[key] ?? ""}
                    onChange={(e) => update(key, e.target.value)}
                    rows={3}
                    placeholder="Brief 1-2 sentence overview for cards and meta snippets..."
                    className={`min-h-24 resize-y ${inputClass}`}
                  />
                </label>
              );
            })}
          </FormSection>
          )}

          {showSettings && (
          <FormSection role={role} icon={FileText} title="Publishing settings" description="Visibility and booking behavior for this tour.">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Visibility</span>
              <select value={form.tour_visibility ?? "public"} onChange={(e) => update("tour_visibility", e.target.value)} className={inputClass}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.featured === "true"} onChange={(e) => update("featured", String(e.target.checked))} />
              <span className="text-sm font-semibold text-dash-body">Featured tour</span>
            </label>

            <label className="flex items-center gap-2 pt-6 md:col-span-2">
              <input type="checkbox" checked={form.requires_supplier_confirmation !== "false"} onChange={(e) => update("requires_supplier_confirmation", String(e.target.checked))} />
              <span className="text-sm font-semibold text-dash-body">Requires supplier confirmation before a paid booking is confirmed</span>
            </label>
            {form.requires_supplier_confirmation === "false" && (
              <p className="text-xs text-dash-subtle md:col-span-2">
                Off: a fully paid booking with an assigned supplier confirms immediately, without waiting on supplier acceptance.
              </p>
            )}

            <div className="md:col-span-2 mt-2 border-t border-dash-border-soft pt-4">
              <p className="text-xs font-black uppercase tracking-wide text-dash-subtle">Deposit options</p>
              <p className="mt-0.5 text-xs text-dash-subtle">Let customers secure this tour with a deposit instead of paying in full. Once the cutoff below is reached, only full payment is offered.</p>
            </div>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Deposit type</span>
              <select value={form.deposit_type ?? "fixed"} onChange={(e) => update("deposit_type", e.target.value)} className={inputClass}>
                <option value="fixed">Fixed amount</option>
                <option value="percentage">Percentage of total</option>
              </select>
            </label>

            {(form.deposit_type ?? "fixed") === "percentage" ? (
              <label data-field="deposit_percentage" className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Minimum deposit (%)</span>
                <input
                  name="deposit_percentage"
                  type="number"
                  min={0}
                  max={100}
                  value={form.deposit_percentage ?? ""}
                  onChange={(e) => {
                    update("deposit_percentage", e.target.value);
                    if (errors.deposit_percentage) clearError("deposit_percentage");
                  }}
                  className={getInputClass("deposit_percentage")}
                />
                {errors.deposit_percentage && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                    <AlertCircle size={13} className="shrink-0 text-red-500" />
                    <span>{errors.deposit_percentage}</span>
                  </p>
                )}
              </label>
            ) : (
              <label data-field="booking_deposit" className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Minimum deposit ({form.currency || "USD"})</span>
                <input
                  name="booking_deposit"
                  type="number"
                  min={0}
                  value={form.booking_deposit ?? ""}
                  onChange={(e) => {
                    update("booking_deposit", e.target.value);
                    if (errors.booking_deposit) clearError("booking_deposit");
                  }}
                  className={getInputClass("booking_deposit")}
                />
                {errors.booking_deposit && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                    <AlertCircle size={13} className="shrink-0 text-red-500" />
                    <span>{errors.booking_deposit}</span>
                  </p>
                )}
              </label>
            )}

            <FormDropdownField
              name="deposit_cutoff_days"
              label="Deposit allowed until (days before departure)"
              value={form.deposit_cutoff_days ?? ""}
              onChange={(val) => update("deposit_cutoff_days", val)}
              options={DEPOSIT_CUTOFF_OPTIONS}
              inputClass={inputClass}
              inputType="number"
              min={0}
              placeholder="e.g. 30"
              helpText="Leave blank to allow a deposit right up to departure. Once fewer days remain, customers see only 'Pay in Full Today'."
            />

            {/* No "Final payment due" field: the balance due date is fixed by
                the client rule -- X weeks (Calendar step's Reserve Now buffer)
                before the Minimum Advance Booking cutoff, same for customers
                and agents (tour_availability.deposit_balance_due_date). */}
            <p className="md:col-span-2 text-[11px] text-slate-500">
              Balance due date: the remaining balance is due the buffer weeks (Calendar &amp; Availability step) before the Minimum Advance Booking cutoff.
            </p>

            <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Tax &amp; service fee</p>
              <p className="mt-0.5 text-xs text-slate-400">Added on top of the discounted subtotal at checkout -- shown to the customer as a separate line, not folded into the tour price.</p>
            </div>

            <label data-field="tax_percentage" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Tax (%)</span>
              <input
                name="tax_percentage"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.tax_percentage ?? ""}
                onChange={(e) => {
                  update("tax_percentage", e.target.value);
                  if (errors.tax_percentage) clearError("tax_percentage");
                }}
                className={getInputClass("tax_percentage")}
                placeholder="0"
              />
              {errors.tax_percentage ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.tax_percentage}</span>
                </p>
              ) : (
                <span className="mt-1 block text-[11px] text-slate-400">Percentage applied to the discounted subtotal.</span>
              )}
            </label>

            <label data-field="service_fee" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Service fee ({form.currency || "USD"})</span>
              <input
                name="service_fee"
                type="number"
                min={0}
                step="0.01"
                value={form.service_fee ?? ""}
                onChange={(e) => {
                  update("service_fee", e.target.value);
                  if (errors.service_fee) clearError("service_fee");
                }}
                className={getInputClass("service_fee")}
                placeholder="0"
              />
              {errors.service_fee ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.service_fee}</span>
                </p>
              ) : (
                <span className="mt-1 block text-[11px] text-slate-400">Flat amount added once per booking, regardless of traveller count.</span>
              )}
            </label>
          </FormSection>
          )}

          {showLocation && (
          <>
          <FormSection
            role={role}
            icon={MapPinned}
            title="Location & supplier"
            description={isSupplier ? "Choose the tour location. The tour remains assigned to your supplier account." : "Where the tour happens and who runs it."}
          >
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Supplier</span>
              <select
                value={form.supplier_id ?? ""}
                onChange={(e) => update("supplier_id", e.target.value)}
                disabled={isSupplier}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`}
              >
                <option value="">{isSupplier ? "Your supplier account" : "- None -"}</option>
                {isSupplier && form.supplier_id && (
                  <option value={form.supplier_id}>Your supplier account</option>
                )}
                {!isSupplier && suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.label}</option>
                ))}
              </select>
            </label>

            <label data-field="category_id" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">
                Tour category
                <span className="ml-1 text-red-500 font-bold">*</span>
              </span>
              <select
                name="category_id"
                value={form.category_id ?? ""}
                onChange={(e) => {
                  update("category_id", e.target.value);
                  if (errors.category_id) clearError("category_id");
                }}
                className={getInputClass("category_id")}
              >
                <option value="">- Select category -</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.label}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.category_id}</span>
                </p>
              )}
            </label>

            <label data-field="country_id" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">
                Country
                <span className="ml-1 text-red-500 font-bold">*</span>
              </span>
              <select
                name="country_id"
                value={form.country_id ?? ""}
                onChange={(e) => {
                  update("country_id", e.target.value);
                  setSelectedStateId("");
                  update("city_id", "");
                  if (errors.country_id) clearError("country_id");
                }}
                className={getInputClass("country_id")}
              >
                <option value="">- Select country -</option>
                {countries.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
              {errors.country_id && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.country_id}</span>
                </p>
              )}
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">State</span>
              <select
                value={selectedStateId}
                onChange={(e) => {
                  setSelectedStateId(e.target.value);
                  update("city_id", "");
                }}
                disabled={!form.country_id}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">- {form.country_id ? "Select state" : "Select country first"} -</option>
                {states.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">City</span>
              <select
                value={form.city_id ?? ""}
                onChange={(e) => update("city_id", e.target.value)}
                disabled={!form.country_id}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">- {form.country_id ? "Select city" : "Select country first"} -</option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </label>
          </FormSection>

          <FormSection
            role={role}
            icon={Tags}
            title="Subcategories"
            description={
              form.category_id
                ? "Showing subcategories for the selected category."
                : "Select a category above to narrow this list, or pick from all subcategories."
            }
          >
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {visibleSubcategories.length === 0 ? (
                <p className="text-sm text-dash-subtle">No subcategories available.</p>
              ) : (
                visibleSubcategories.map((subcategory) => {
                  const active = selectedSubcategoryIds.includes(subcategory.id);
                  return (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => toggleSubcategory(subcategory.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? "border-dash-brand bg-[#EDF5FF] text-dash-brand-hover"
                          : "border-dash-border text-dash-muted hover:bg-dash-bg"
                      }`}
                    >
                      {subcategory.label}
                    </button>
                  );
                })
              )}
            </div>
          </FormSection>
          </>
          )}

          {showMedia && (
          <FormSection role={role} icon={ImageIcon} title="Media" description="Images and downloads for the tour listing.">
            <AdminAssetUpload label="Banner image" value={form.banner_image ?? ""} onChange={(value) => update("banner_image", value)} />
            <AdminAssetUpload label="Map image" value={form.map_image ?? ""} onChange={(value) => update("map_image", value)} />
            <AdminAssetUpload label="Mobile cover image" value={form.mobile_cover_image ?? ""} onChange={(value) => update("mobile_cover_image", value)} />
            <AdminAssetUpload label="Brochure (PDF)" value={form.brochure_pdf ?? ""} onChange={(value) => update("brochure_pdf", value)} />
            <label data-field="tour_video_url" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Tour video URL</span>
              <input
                name="tour_video_url"
                value={form.tour_video_url ?? ""}
                onChange={(e) => {
                  update("tour_video_url", e.target.value);
                  if (errors.tour_video_url) clearError("tour_video_url");
                }}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                className={getInputClass("tour_video_url")}
              />
              {errors.tour_video_url && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.tour_video_url}</span>
                </p>
              )}
            </label>
          </FormSection>
          )}

          {showSeo && (
          <FormSection role={role} icon={Search} title="SEO" description="Metadata for search engines and social sharing.">
            {seoFields.map(([key, label]) => (
              <label key={key} data-field={key} className={key === "seo_description" ? "md:col-span-2 block" : "block"}>
                <span className="mb-1 flex items-end justify-between gap-2 text-xs font-bold uppercase text-slate-600">
                  <span>{label} <span className="font-medium normal-case text-slate-400">(optional)</span></span>
                  {FIELD_MAX[key] && (
                    <span className={`text-[11px] font-semibold normal-case ${(form[key] ?? "").length > FIELD_MAX[key] ? "text-red-600" : "text-slate-400"}`}>
                      {(form[key] ?? "").length}/{FIELD_MAX[key]}
                    </span>
                  )}
                </span>
                {key === "seo_description" ? (
                  <textarea
                    name={key}
                    value={form[key] ?? ""}
                    onChange={(e) => {
                      update(key, e.target.value);
                      if (errors[key]) clearError(key);
                    }}
                    className={`min-h-20 ${getInputClass(key)}`}
                  />
                ) : (
                  <input
                    name={key}
                    value={form[key] ?? ""}
                    onChange={(e) => {
                      update(key, e.target.value);
                      if (errors[key]) clearError(key);
                    }}
                    className={getInputClass(key)}
                  />
                )}
                {errors[key] ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                    <AlertCircle size={13} className="shrink-0 text-red-500" />
                    <span>{errors[key]}</span>
                  </p>
                ) : (
                  FIELD_HINTS[key] && <span className="mt-1 block text-[11px] text-slate-400">{FIELD_HINTS[key]}</span>
                )}
              </label>
            ))}
            <label data-field="slug" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">URL slug</span>
              <input
                name="slug"
                value={form.slug ?? ""}
                onChange={(e) => {
                  update("slug", e.target.value);
                  if (errors.slug) clearError("slug");
                }}
                placeholder="Auto-generated from title if left blank (e.g. 5-day-golden-triangle)"
                className={getInputClass("slug")}
              />
              {errors.slug && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.slug}</span>
                </p>
              )}
            </label>
            <label data-field="focus_keyword" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Focus keyword</span>
              <input
                name="focus_keyword"
                value={form.focus_keyword ?? ""}
                onChange={(e) => update("focus_keyword", e.target.value)}
                className={inputClass}
                placeholder="e.g. golden triangle tour"
              />
            </label>
            <label data-field="canonical_url" className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Canonical URL</span>
              <input
                name="canonical_url"
                value={form.canonical_url ?? ""}
                onChange={(e) => {
                  update("canonical_url", e.target.value);
                  if (errors.canonical_url) clearError("canonical_url");
                }}
                className={getInputClass("canonical_url")}
                placeholder="https://tourvaa.com/tours/..."
              />
              {errors.canonical_url && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0 text-red-500" />
                  <span>{errors.canonical_url}</span>
                </p>
              )}
            </label>
            <AdminAssetUpload label="Open Graph image" value={form.open_graph_image ?? ""} onChange={(value) => update("open_graph_image", value)} />
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.search_visibility !== "false"} onChange={(e) => update("search_visibility", String(e.target.checked))} />
              <span className="text-sm font-semibold text-dash-body">Visible to search engines</span>
            </label>
          </FormSection>
          )}

          {!embedded && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE6F3] bg-white px-5 py-4 shadow-[0_10px_30px_-28px_rgba(28,83,160,.8)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-dash-text">Ready to save this tour?</p>
              <p className="mt-0.5 text-[11px] text-dash-subtle">
                {isSupplier
                  ? "Your current publishing status is preserved. Submit the tour for approval from the editor header."
                  : "Publishing status is controlled by the Tour Approval workflow and the Publish/Disable toggle on the Tours list, not from this form."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("tour-form-save-bar")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dash-border px-5 py-2.5 text-sm font-bold text-dash-body transition hover:-translate-y-0.5 hover:bg-dash-bg"
            >
              <Save size={16} /> Go to save
            </button>
          </div>
          )}
        </form>
      )}
      {dialog}
    </div>
  );
}
