"use client";

import React, { useEffect, useState } from "react";
import { LuChevronDown as ChevronDown } from "react-icons/lu";
import { fetchHelpCentre } from "@/lib/api/publicClient";
import { FAQS } from "./homeTypes";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HomeFaqSectionProps {
  initialFaqs?: FaqItem[];
}

export default function HomeFaqSection({ initialFaqs }: HomeFaqSectionProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs || FAQS);
  const [openIndex, setOpenIndex] = useState<number | null>(1); // Question 2 open by default as shown in mockup

  // Fast independent data loading
  useEffect(() => {
    if (initialFaqs && initialFaqs.length > 0) {
      setFaqs(initialFaqs);
      return;
    }

    let active = true;

    fetchHelpCentre()
      .then((helpResult) => {
        if (!active) return;
        if (helpResult && helpResult.length > 0) {
          const cmsFaqs = helpResult
            .filter((h) => h.is_active !== false)
            .map((h) => ({ question: h.question, answer: h.answer }));
          if (cmsFaqs.length > 0) setFaqs(cmsFaqs);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialFaqs]);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="relative z-10 mx-auto max-w-[1380px] px-5">
      <section className="pt-6 sm:pt-8 pb-3 sm:pb-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 text-center tracking-tight mb-5 sm:mb-7">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3.5">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.question}
                  className={`transition-all duration-300 ease-out ${
                    isOpen
                      ? "rounded-2xl border border-blue-200 bg-blue-50/30 p-5 sm:p-6 shadow-sm ring-1 ring-blue-100"
                      : "rounded-2xl border border-slate-200/80 bg-white px-5 sm:px-6 py-4 sm:py-5 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-xs"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between gap-4 text-left font-bold text-slate-900 text-sm sm:text-base focus:outline-none group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`transition-colors duration-200 ${
                        isOpen
                          ? "text-slate-950 font-bold"
                          : "text-slate-900 font-semibold group-hover:text-pub-secondary"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                        isOpen
                          ? "bg-[#d95d2c] text-white shadow-sm rotate-180 scale-105"
                          : "text-[#d95d2c] bg-slate-100/80 group-hover:bg-pub-secondary/10 group-hover:scale-110"
                      }`}
                    >
                      <ChevronDown size={16} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-3.5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal animate-in fade-in-50 slide-in-from-top-1.5 duration-300 ease-out">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
