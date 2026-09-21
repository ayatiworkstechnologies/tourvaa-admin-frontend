"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  LuBookOpen as BookOpen,
  LuCheck as Check,
  LuCopy as Copy,
  LuFileText as FileText,
  LuPrinter as Printer,
  LuSearch as Search,
  LuShieldCheck as ShieldCheck,
  LuArrowUp as ArrowUp,
  LuMail as Mail,
} from "react-icons/lu";

export type LegalSection = {
  id: string;
  number: number;
  label: string;
  body: ReactNode;
};

export function LegalBullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pub-secondary" />
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LegalPageLayout({
  eyebrow = "Legal Information",
  title,
  subtitle,
  intro,
  sections,
  lastUpdated = "September 2026",
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  intro?: ReactNode;
  sections: LegalSection[];
  lastUpdated?: string;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for Active Section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topId = visible[0]?.target.getAttribute("data-section-id");
        if (topId) setActiveId(topId);
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const handleTocClick = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const filteredSections = sections.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#FAFAFC] text-slate-900 pb-28">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-pub-secondary via-sky-500 to-pub-accent transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header Banner */}
      <section className="border-b border-slate-200/80 bg-white pt-8 pb-10 sm:pt-10 sm:pb-12 shadow-2xs">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-400">Legal &amp; Trust</span>
            <span>/</span>
            <span className="text-pub-secondary font-bold">{title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/80 px-3 py-1 text-xs font-bold text-sky-700">
                <ShieldCheck size={14} className="text-sky-600" />
                <span>{eyebrow}</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-slate-950 font-heading leading-tight">
                {title}
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 font-medium max-w-2xl">
                {subtitle}
              </p>

              {/* Metadata Badges */}
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  <FileText size={13} className="text-slate-500" />
                  <span>Last Updated: {lastUpdated}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 border border-emerald-100">
                  <Check size={13} className="text-emerald-600" />
                  <span>Version 2.4 (Active)</span>
                </span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-slate-500 hidden sm:inline">
                  Globally Enforced Standard
                </span>
              </div>
            </div>

            {/* Action Bar (Print / Copy) */}
            <div className="flex items-center gap-2.5 self-start lg:self-end">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Share Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Table of Contents Sticky Sidebar */}
          <aside className="hidden lg:block sticky top-20 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-sky-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Contents
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {sections.length} Clauses
              </span>
            </div>

            {/* Quick Search */}
            <div className="mt-3 relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Filter clauses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-sky-500 focus:bg-white transition"
              />
            </div>

            {/* Navigation List */}
            <nav className="mt-3.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {filteredSections.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleTocClick(s.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-sky-50 text-sky-900 border-l-3 border-sky-600 shadow-2xs font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                        isActive
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className="leading-snug line-clamp-1">{s.label}</span>
                  </button>
                );
              })}

              {filteredSections.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-400">
                  No matching clauses found.
                </p>
              )}
            </nav>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-100 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              <ArrowUp size={12} />
              <span>Back to Top</span>
            </button>
          </aside>

          {/* Section Clauses Body */}
          <div className="min-w-0 space-y-6">
            {intro && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5 text-sm leading-relaxed text-slate-700 font-medium">
                {intro}
              </div>
            )}

            {sections.map((s) => {
              const isActive = s.id === activeId;
              return (
                <section
                  key={s.id}
                  id={s.id}
                  data-section-id={s.id}
                  ref={(el) => {
                    sectionRefs.current[s.id] = el;
                  }}
                  className={`scroll-mt-28 rounded-2xl border bg-white p-6 sm:p-8 shadow-xs transition-all duration-200 ${
                    isActive
                      ? "border-sky-300 ring-1 ring-sky-200/70"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3A] text-xs font-black text-white shadow-2xs">
                      {s.number}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight font-heading">
                      {s.label}
                    </h2>
                  </div>

                  <div className="mt-4 text-sm sm:text-[15px] leading-relaxed text-slate-600 space-y-3 font-normal">
                    {s.body}
                  </div>
                </section>
              );
            })}

            {/* Bottom Support Callout */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-[#0B1F3A] p-6 sm:p-8 text-white shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Need Clarification on This Policy?
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-white/80 font-normal">
                    Our compliance &amp; legal counsel is available to assist
                    travelers and partners with questions.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition"
                  >
                    <Mail size={14} />
                    <span>Contact Team</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
