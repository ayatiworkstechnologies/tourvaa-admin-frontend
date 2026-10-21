"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import Link from "next/link";
import {
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryExploreFaqSectionProps {
  info: CountryDestinationInfo;
  showRelated?: boolean;
  showDirectory?: boolean;
  showFaq?: boolean;
}

export default function CountryExploreFaqSection({
  info,
  showRelated = true,
  showDirectory = true,
  showFaq = true,
}: CountryExploreFaqSectionProps) {
  // Frequently Asked Questions state (first item open by default like screenshot)
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? -1 : index);
  };

  const worthExploring = info.related_destinations || [];
  const directoryItems = info.destination_directory || [];
  const directoryColumns = Array.from({ length: 6 }, (_, columnIndex) =>
    directoryItems.filter((_, itemIndex) => itemIndex % 6 === columnIndex),
  ).filter((column) => column.length > 0);
  const faqs = info.faqs || [];

  return (
    <div className="bg-white text-slate-900">
      {/* ── 11. Countries Worth Exploring Section ── */}
      {showRelated && worthExploring.length > 0 && <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-100">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Countries worth exploring
            </h2>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {worthExploring.map((country) => (
              <Link
                key={country.slug}
                href={`/destinations/${country.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden rounded-[16px] bg-slate-100">
                    {country.image && <img
                      src={country.image}
                      alt={country.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-106"
                    />}
                    {country.region && <span className="absolute top-2.5 left-2.5 rounded-full bg-pub-accent px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                      {country.region}
                    </span>}
                  </div>

                  <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-sky-700 transition">
                    {country.name}
                  </h3>
                </div>

                {country.from_price && <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">From</span>
                  <strong className="text-sm font-black text-slate-900">{country.from_price}</strong>
                </div>}
              </Link>
            ))}
          </div>
        </div>
      </section>}

      {/* ── 12. Country Directory Grid ── */}
      {showDirectory && directoryColumns.length > 0 && <section className="py-12 sm:py-14 border-b border-slate-100">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-left">
            Popular destinations in Asia &amp; Worldwide
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 text-xs font-semibold text-slate-600 text-left">
            {directoryColumns.map((col, cIdx) => (
              <div key={cIdx} className="space-y-2.5">
                {col.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/destinations/${item.slug}`}
                    className="block hover:text-pub-accent transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ── 13. Frequently Asked Questions Accordion ── */}
      {showFaq && faqs.length > 0 && <section id="section-faq" className="py-16 sm:py-20">
        <div className="mx-auto max-w-[960px] px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
              Everything you need to know before packing your bags for {info.country_name}.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;

              return (
                <div
                  key={idx}
                  className={`rounded-[20px] transition-all duration-200 border ${
                    isOpen
                      ? "border-sky-200 bg-sky-50/40 shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900 pr-4">
                      {faq.question}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                        isOpen ? "bg-pub-accent text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-sky-100/60 mt-1 pt-3">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>}
    </div>
  );
}

