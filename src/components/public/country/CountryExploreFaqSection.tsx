"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import Link from "next/link";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuCircleHelp as HelpCircle,
  LuSparkles as Sparkles,
  LuArrowRight as ArrowRight,
  LuMapPin as MapPin,
} from "react-icons/lu";
import { CountryDestinationInfo } from "@/lib/types/countryDestination";

export interface CountryExploreFaqSectionProps {
  info: CountryDestinationInfo;
}

export default function CountryExploreFaqSection({ info }: CountryExploreFaqSectionProps) {
  // Frequently Asked Questions state (first item open by default like screenshot)
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? -1 : index);
  };

  // 4 "Countries worth exploring" cards matching screenshot
  const worthExploring = [
    {
      name: "New Zealand",
      slug: "new-zealand",
      region: "Oceania",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
      fromPrice: "$2,499",
      rating: 4.9,
    },
    {
      name: "India",
      slug: "india",
      region: "Asia",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
      fromPrice: "$1,299",
      rating: 4.9,
    },
    {
      name: "Switzerland",
      slug: "switzerland",
      region: "Europe",
      image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
      fromPrice: "$2,199",
      rating: 5.0,
    },
    {
      name: "Thailand",
      slug: "thailand",
      region: "Asia",
      image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80",
      fromPrice: "$1,099",
      rating: 4.8,
    },
  ];

  // Directory links (6 columns)
  const directoryColumns = [
    [
      { name: "Japan", slug: "japan" },
      { name: "Vietnam", slug: "vietnam" },
      { name: "Thailand", slug: "thailand" },
    ],
    [
      { name: "Cambodia", slug: "cambodia" },
      { name: "Indonesia", slug: "indonesia" },
      { name: "Malaysia", slug: "malaysia" },
    ],
    [
      { name: "South Korea", slug: "south-korea" },
      { name: "Singapore", slug: "singapore" },
      { name: "Taiwan", slug: "taiwan" },
    ],
    [
      { name: "Sri Lanka", slug: "sri-lanka" },
      { name: "Nepal", slug: "nepal" },
      { name: "Bhutan", slug: "bhutan" },
    ],
    [
      { name: "Maldives", slug: "maldives" },
      { name: "India", slug: "india" },
      { name: "Laos", slug: "laos" },
    ],
    [
      { name: "Philippines", slug: "philippines" },
      { name: "Mongolia", slug: "mongolia" },
      { name: "Uzbekistan", slug: "uzbekistan" },
    ],
  ];

  // FAQs
  const isChina = info.country_slug === "china" || info.country_name.toLowerCase() === "china";
  const faqs = [
    {
      question: `What is the best way to get a visa for ${info.country_name}?`,
      answer: isChina
        ? "Most international travellers require a tourist (L) visa before arriving in China, obtainable through Chinese Visa Application Service Centers. However, China offers convenient 72/144-hour visa-free transit at international airports including Beijing, Shanghai, and Guangzhou for passport holders from 54 qualifying countries transit-bound for a third country. We provide full official visa confirmation letters for all confirmed tour bookings."
        : `Check current visa regulations for ${info.country_name} prior to departure. Many nationalities are eligible for visa-on-arrival or simple electronic visa (eVisa) entry. Our travel specialists provide full documentation to support your application.`,
    },
    {
      question: "Is it safe to travel solo or in small groups?",
      answer: `${info.country_name} is statistically one of the safest and most welcoming destinations for international travellers, with robust transport infrastructure, low crime rates, and warm hospitality. Our guided small group and private journeys also include licensed local tour leaders and 24/7 emergency concierge support.`,
    },
    {
      question: "What currency is used and are credit cards accepted?",
      answer: isChina
        ? "The local currency is the Chinese Yuan (CNY / RMB). Major hotels, airports, and upscale restaurants accept international credit cards. Mobile payments through Alipay and WeChat Pay (which can now be linked directly to foreign Visa/Mastercard credit cards) are universally accepted everywhere from taxis to street stalls. Carrying a small amount of cash is recommended for rural markets."
        : `The local currency is used for day-to-day transactions. Major credit cards (Visa/Mastercard) are widely accepted in hotels and major restaurants, though carrying cash is advised for local markets, tips, and small shops.`,
    },
    {
      question: "What should I pack for my trip?",
      answer: `Comfortable, broken-in walking shoes are essential for archaeological sites, historic temples, and scenic nature walks. Pack breathable, lightweight layers for spring and autumn, sun protection (hat and sunscreen) for summer, and warm thermal clothing if visiting during winter. A universal electrical plug adapter is also recommended.`,
    },
    {
      question: "Do guides speak English fluently?",
      answer: `Yes, all Tourvaa journeys in ${info.country_name} are conducted by licensed, professional, university-educated local guides who speak fluent English. They bring history, local anecdotes, and hidden gems alive while ensuring seamless logistics throughout your journey.`,
    },
  ];

  return (
    <div className="bg-white text-slate-900">
      {/* ── 11. Countries Worth Exploring Section ── */}
      <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-100">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Countries worth exploring
            </h2>

            {/* Carousel Navigation Arrows matching screenshot */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous destination"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950 transition shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next destination"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950 transition shadow-2xs cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
                    <img
                      src={country.image}
                      alt={country.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-106"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-[#E4572E] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                      {country.region}
                    </span>
                  </div>

                  <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-sky-700 transition">
                    {country.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">From</span>
                  <strong className="text-sm font-black text-slate-900">{country.fromPrice}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. Country Directory Grid ── */}
      <section className="py-12 sm:py-14 border-b border-slate-100">
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
                    className="block hover:text-[#E4572E] transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. Frequently Asked Questions Accordion ── */}
      <section id="section-faq" className="py-16 sm:py-20">
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
                        isOpen ? "bg-[#E4572E] text-white" : "bg-slate-100 text-slate-500"
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
      </section>
    </div>
  );
}
