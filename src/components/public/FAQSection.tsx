"use client";

import { useState } from "react";
import { LuBot as Bot, LuMousePointerClick as MousePointerClick } from "react-icons/lu";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  category: string;
};

const DEFAULT_FAQS: FAQ[] = [
  {
    id: 0,
    question: "How do I book a tour?",
    answer:
      "Browse our tours and click 'Book Now' on any tour page. You'll be guided through selecting your travel dates, group size, and payment details. Our team confirms your booking within 24 hours.",
    category: "booking",
  },
  {
    id: 1,
    question: "What is the cancellation policy?",
    answer:
      "We offer free cancellation up to 7 days before your tour start date. Cancellations made 3–7 days before incur a 25% fee. Cancellations within 72 hours are non-refundable. Please review each tour's specific policy.",
    category: "booking",
  },
  {
    id: 2,
    question: "Are flights included in the tour price?",
    answer:
      "Most of our tours do not include international flights unless explicitly stated. Internal transfers, accommodation, guided activities, and some meals are typically included. Check the 'What's Included' section of each tour.",
    category: "general",
  },
  {
    id: 3,
    question: "How do I make a payment?",
    answer:
      "We accept all major credit/debit cards, bank transfers, and select digital wallets. A deposit of 30% is required to confirm your booking, with the balance due 30 days before departure.",
    category: "payment",
  },
  {
    id: 4,
    question: "Can I customise a tour?",
    answer:
      "Absolutely! Contact our team or use the AI chat assistant to discuss custom itineraries, private tours, and group packages. We love creating personalised experiences.",
    category: "general",
  },
  {
    id: 5,
    question: "Do I need travel insurance?",
    answer:
      "We strongly recommend travel insurance for all bookings. It should cover medical emergencies, trip cancellation, and personal belongings. Some destinations may require proof of insurance.",
    category: "general",
  },
];

export default function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const displayFaqs = faqs.length > 0 ? faqs : DEFAULT_FAQS;
  const categories = Array.from(new Set(displayFaqs.map((f) => f.category)));
  const filtered =
    activeCategory === "all"
      ? displayFaqs
      : displayFaqs.filter((f) => f.category === activeCategory);

  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <Bot size={16} /> AI-Powered FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500">
            Can&apos;t find your answer? Ask our AI assistant - it&apos;s available 24/7.
          </p>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Accordion */}
        <div className="space-y-3">
          {filtered.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? "border-blue-200 bg-blue-50 shadow-sm"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                >
                  <span
                    className={`font-semibold text-sm md:text-base leading-snug ${
                      isOpen ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform ${
                      isOpen
                        ? "bg-blue-600 text-white rotate-45"
                        : "bg-white border border-gray-200 text-gray-500"
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ask AI CTA */}
        <div className="mt-12 rounded-3xl border border-teal-100 bg-linear-to-br from-teal-50 to-orange-50 p-8 text-center">
          <p className="text-gray-700 font-semibold mb-2">Still have questions?</p>
          <p className="text-sm text-gray-500 mb-4">
            Our AI assistant can answer anything about tours, bookings, visa requirements, and more.
          </p>
          <p className="text-blue-600 font-semibold text-sm inline-flex items-center gap-1.5">
            <MousePointerClick size={16} /> Click the chat button in the bottom-right corner
          </p>
        </div>
      </div>
    </section>
  );
}
