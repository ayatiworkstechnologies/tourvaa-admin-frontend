"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type LegalSection = {
  id: string;
  number: number;
  label: string;
  body: ReactNode;
};

export function LegalBullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2.5">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LegalPageLayout({
  eyebrow,
  title,
  subtitle,
  intro,
  sections,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topId = visible[0]?.target.getAttribute("data-section-id");
        if (topId) setActiveId(topId);
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const handleTocClick = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <main className="min-h-screen bg-white pb-24 pt-10 text-slate-900">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">{eyebrow}</p>
          )}
          <h1 className={`text-3xl sm:text-4xl font-black tracking-tight text-slate-900 ${eyebrow ? "mt-2" : ""}`}>
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
          {/* TABLE OF CONTENTS */}
          <aside className="hidden lg:block sticky top-24 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Table of Contents
            </p>
            <nav className="mt-2 space-y-0.5">
              {sections.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleTocClick(s.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className="leading-snug">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* SECTIONS */}
          <div className="min-w-0 space-y-5">
            {intro && <p className="text-sm leading-relaxed text-slate-600">{intro}</p>}
            {sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                data-section-id={s.id}
                ref={(el) => {
                  sectionRefs.current[s.id] = el;
                }}
                className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xs"
              >
                <h2 className="text-base font-bold text-slate-900">
                  {s.number}. {s.label}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
