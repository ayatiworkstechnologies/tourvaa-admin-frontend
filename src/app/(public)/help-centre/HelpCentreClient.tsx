"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  LuSearch as Search,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuMessageCircle as MessageCircle,
  LuArrowRight as ArrowRight,
  LuCircleHelp as HelpCircle,
} from "react-icons/lu";

interface Article {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Category {
  id: string;
  number: number;
  name: string;
  description: string;
  articles: Article[];
}

const HELP_CATEGORIES: Category[] = [
  {
    id: "about",
    number: 1,
    name: "About Tourvaa",
    description: "Find out everything about Tourvaa and why you should book with us!",
    articles: [
      {
        id: "what-is-tourvaa",
        title: "What is Tourvaa?",
        content: (
          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            <p>
              Tourvaa is an Organised Adventure Platform specialising in booking multi-day organised tours with a vast selection of over 2,500 tour operators across the globe.
            </p>

            <h4 className="font-bold text-slate-900 pt-2">Key benefits of choosing Tourvaa</h4>
            <ul className="space-y-2 pl-1">
              <li>
                <strong className="text-slate-900">• Security:</strong> We prioritize secure payments, ensuring your details and bookings are safe.
              </li>
              <li>
                <strong className="text-slate-900">• Trust:</strong> Access impartial and trusted reviews to make informed choices about your adventures.
              </li>
              <li>
                <strong className="text-slate-900">• Support:</strong> Our adventure travel experts are here to deliver premium customer service, available 24/7 to assist you.
              </li>
              <li>
                <strong className="text-slate-900">• Accessibility:</strong> We strive to make life-enriching experiences effortlessly accessible, bridging the gap for travelers seeking seamless, enjoyable tours.
              </li>
              <li>
                <strong className="text-slate-900">• Savings:</strong> Our free loyalty program - Tourvaa+, unlocks member-only savings on tours in every corner of the world.
              </li>
            </ul>

            <h4 className="font-bold text-slate-900 pt-2">Our mission</h4>
            <p>
              We want to bridge the gap for travelers, offering them a seamless and enjoyable experience when exploring the world through fun-filled tours.
            </p>

            <h4 className="font-bold text-slate-900 pt-2">Our mission</h4>
            <p>
              For further information about us, visit{" "}
              <Link
                href="/about"
                className="font-semibold text-sky-600 underline hover:text-sky-800 transition"
              >
                About Tourvaa: Organised Adventure Platform | Learn Our Story &amp; Team
              </Link>
            </p>
          </div>
        ),
      },
      {
        id: "why-book",
        title: "Why book with Tourvaa?",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              Booking with Tourvaa gives you access to the world&apos;s best multi-day group and private tours with guaranteed departure dates, vetted local leaders, 24/7 emergency support, and verified real customer reviews.
            </p>
            <p>
              Additionally, our best price guarantee and flexible cancellation policies give you complete peace of mind from inquiry to return flight.
            </p>
          </div>
        ),
      },
      {
        id: "how-contact",
        title: "How do I contact Tourvaa?",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              You can contact our 24/7 global support team through:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Our 24/7 live virtual assistant Scout and live chat specialists</li>
              <li>Your personal Booking Conversation Page for active reservations</li>
              <li>Our official <Link href="/contact" className="text-sky-600 font-semibold underline">Contact Us</Link> portal</li>
            </ul>
          </div>
        ),
      },
      {
        id: "booking-protection",
        title: "How is my booking protected with Tourvaa?",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              Every booking made through Tourvaa is protected with bank-grade 256-bit SSL encryption, escrow payment protection where funds are securely transferred to operators only according to tour milestones, and full insolvency partner guarantees.
            </p>
          </div>
        ),
      },
      {
        id: "operators-entity",
        title: "Are Tourvaa and tour operators the same entity?",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              No. Tourvaa is an online adventure booking platform that connects travelers with licensed, vetted independent tour operators and local adventure specialists worldwide. The operator designs and operates the physical tour on the ground.
            </p>
          </div>
        ),
      },
      {
        id: "learn-operator",
        title: "How do I learn about an operator on Tourvaa?",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              Every tour detail page features an Operator Profile section showing their background, years in operation, traveler rating, sustainability practices, and authentic verified customer reviews.
            </p>
          </div>
        ),
      },
      {
        id: "contact-operator",
        title: "How do I contact the tour operator through Tourvaa?",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              Once you have an inquiry or confirmed reservation, you can message the tour operator directly using the secure Booking Conversation Page on your dashboard.
            </p>
          </div>
        ),
      },
      {
        id: "suspicious-messages",
        title: "How to identify and report suspicious messages",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              Tourvaa will never ask you to transfer funds to external accounts, pay via wire transfers outside our checkout, or share passwords. If you receive an off-platform payment request, report it immediately to security@tourvaa.com.
            </p>
          </div>
        ),
      },
      {
        id: "tourvaa-meets",
        title: "What is Tourvaa Meets?",
        content: (
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              Tourvaa Meets is our community feature connecting confirmed travelers joining the same departure date before their adventure begins, enabling you to introduce yourself and coordinate packing advice.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "operator",
    number: 2,
    name: "I'm an operator",
    description: "Guidance for tour operators, DMC partners, and adventure suppliers.",
    articles: [
      {
        id: "operator-list",
        title: "How do I list my tours on Tourvaa?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Tour operators can sign up through our <Link href="/portal/supplier/login" className="text-sky-600 font-semibold underline">Supplier Portal</Link>. Our Business Development team reviews licensing, safety records, and insurance before listing.
          </p>
        ),
      },
      {
        id: "operator-payouts",
        title: "How do operator payouts work?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Payouts are processed automatically in your preferred currency according to agreed departure terms, deposited directly into your designated business bank account.
          </p>
        ),
      },
      {
        id: "operator-manage",
        title: "How do I update tour itineraries and departures?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Log in to your Operator Dashboard to manage departure dates, real-time availability slots, seasonal pricing, and itinerary inclusions.
          </p>
        ),
      },
    ],
  },
  {
    id: "finding-tour",
    number: 3,
    name: "Finding your dream tour",
    description: "Search filters, travel styles, and choosing the right trip.",
    articles: [
      {
        id: "how-to-filter",
        title: "How can I filter tours by duration, budget, or destination?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Use our interactive filter bar at the top of the <Link href="/tours" className="text-sky-600 font-semibold underline">Tours Catalog</Link> to filter by country, duration ranges (1–3, 4–7, 8+ days), budget per person, travel styles, and departure month.
          </p>
        ),
      },
      {
        id: "group-vs-private",
        title: "What is the difference between group and private tours?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Group tours have scheduled departures where you travel with fellow adventurers (typically 8–16 people). Private tours are reserved exclusively for you and your travel companions with flexible departure dates and custom pacing.
          </p>
        ),
      },
    ],
  },
  {
    id: "adventuring-faq",
    number: 4,
    name: "Adventuring FAQ",
    description: "Physical fitness ratings, packing, and accommodation standards.",
    articles: [
      {
        id: "fitness-level",
        title: "How do I know the physical fitness rating of a tour?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Each tour displays a Physical Activity rating from Easy (leisure walks) to Demanding (high-altitude hiking or long trekking days), detailed on the tour overview page.
          </p>
        ),
      },
      {
        id: "solo-travelers",
        title: "Are tours suitable for solo travelers?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Over 50% of our travelers embark solo! You can choose to be paired with a traveler of the same gender to avoid single supplements, or choose a private single room upgrade.
          </p>
        ),
      },
    ],
  },
  {
    id: "booking-tour",
    number: 5,
    name: "Booking a tour on Tourvaa",
    description: "Step-by-step booking procedure and instant confirmations.",
    articles: [
      {
        id: "booking-process",
        title: "What are the steps to confirm a booking?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Choose your departure date, specify the number of travelers, configure room type and add-ons, and proceed through our secure checkout. You can either pay a deposit or the full balance.
          </p>
        ),
      },
      {
        id: "instant-confirmation",
        title: "Are departures instantly confirmed?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Tours labeled &ldquo;Guaranteed Departure&rdquo; or &ldquo;Instant Confirmation&rdquo; are confirmed immediately. For bespoke or request-based departures, the operator confirms availability within 24–48 hours.
          </p>
        ),
      },
    ],
  },
  {
    id: "river-cruises",
    number: 6,
    name: "River cruises FAQ",
    description: "Waterways, ship cabins, dining, and shore excursions.",
    articles: [
      {
        id: "river-cruises-included",
        title: "What is typically included on river cruise packages?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            River cruise itineraries typically include outside river-view staterooms, full board dining with local wine/beer at dinner, daily guided shore excursions, and Wi-Fi aboard.
          </p>
        ),
      },
    ],
  },
  {
    id: "pricing-payments",
    number: 7,
    name: "Pricing and payments",
    description: "Deposits, payment plans, currencies, and secure transactions.",
    articles: [
      {
        id: "payment-options",
        title: "Can I pay in installments or put down a deposit?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Yes! For bookings made more than 60 days before departure, you can secure your reservation with a low deposit, and the remaining balance will be due closer to your tour start date.
          </p>
        ),
      },
      {
        id: "currencies-accepted",
        title: "Which currencies does Tourvaa accept?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            We support multi-currency checkouts including USD, EUR, GBP, AUD, CAD, NZD, and INR. You can switch your preferred currency in the top header.
          </p>
        ),
      },
    ],
  },
  {
    id: "canceling-tour",
    number: 8,
    name: "Canceling my tour",
    description: "Refunds, cancellation timelines, and date changes.",
    articles: [
      {
        id: "cancel-policy-summary",
        title: "What is the standard cancellation timeline?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Cancellations made 14+ days before departure generally receive a full refund or full credit voucher. Between 7 to 13 days, a 50% refund applies. Within 7 days, bookings are non-refundable. Check your specific tour cancellation policy tab for exact details.
          </p>
        ),
      },
      {
        id: "transfer-date",
        title: "Can I change my tour date instead of canceling?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Most operators permit free or low-fee date transfers if requested at least 30 days before departure. Contact our support team or use your booking conversation page to request a date adjustment.
          </p>
        ),
      },
    ],
  },
  {
    id: "resolve-issues",
    number: 9,
    name: "How to resolve issues during your tour",
    description: "24/7 ground assistance, operator escalation, and complaints.",
    articles: [
      {
        id: "emergency-support",
        title: "Who do I contact if an issue arises on the tour?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            First notify your Tour Leader on the ground. If you require further escalation, contact Tourvaa&apos;s 24/7 emergency operations line available in your booking confirmation voucher.
          </p>
        ),
      },
    ],
  },
  {
    id: "loyalty-program",
    number: 10,
    name: "Tourvaa+ Loyalty Program and Savings",
    description: "Earning travel credits, referral perks, and VIP discounts.",
    articles: [
      {
        id: "tourvaa-plus",
        title: "How does the Tourvaa+ loyalty program work?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Tourvaa+ is automatically activated with your free account. You earn credits on every completed adventure, which can be applied directly towards any future booking.
          </p>
        ),
      },
    ],
  },
  {
    id: "manage-account",
    number: 11,
    name: "Manage my account",
    description: "Profiles, passwords, notifications, and privacy settings.",
    articles: [
      {
        id: "update-profile",
        title: "How do I update my contact information?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Log in and visit your Account Settings to update your name, email, phone number, and passport details for tour manifests.
          </p>
        ),
      },
    ],
  },
  {
    id: "conversation-page",
    number: 12,
    name: "Booking Conversation Page",
    description: "Direct operator chat, itinerary questions, and dietary requests.",
    articles: [
      {
        id: "using-conversation",
        title: "How do I access the booking conversation page?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Navigate to <Link href="/profile/bookings" className="text-sky-600 font-semibold underline">My Bookings</Link>, select your tour, and click &ldquo;Message Operator&rdquo; to send dietary requests, flight arrival times, and customized queries.
          </p>
        ),
      },
    ],
  },
  {
    id: "travel-insurance",
    number: 13,
    name: "Travel insurance",
    description: "Coverage requirements, medical evacuation, and claims.",
    articles: [
      {
        id: "insurance-mandatory",
        title: "Is travel insurance mandatory for multi-day tours?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Comprehensive medical insurance including emergency medical evacuation is mandatory for all international tours. You will be requested to provide your policy number before departure.
          </p>
        ),
      },
    ],
  },
  {
    id: "esims",
    number: 14,
    name: "eSIMs",
    description: "Mobile international data, connectivity, and setup instructions.",
    articles: [
      {
        id: "esim-setup",
        title: "Can I get an eSIM for my tour destination?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Yes! Tourvaa partners with leading global eSIM providers to offer high-speed regional data packages you can activate on your smartphone prior to departure.
          </p>
        ),
      },
    ],
  },
  {
    id: "visas",
    number: 15,
    name: "Visas",
    description: "Entry requirements, e-Visas, and official invitation letters.",
    articles: [
      {
        id: "visa-responsibility",
        title: "Who is responsible for obtaining visas?",
        content: (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Travelers are responsible for verifying passport validity (minimum 6 months from entry) and securing appropriate tourist visas. Tourvaa supplies official booking confirmation vouchers to submit with visa applications.
          </p>
        ),
      },
    ],
  },
];

export default function HelpCentreClient() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("about");
  const [openArticleId, setOpenArticleId] = useState<string>("what-is-tourvaa");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeCategory =
    HELP_CATEGORIES.find((c) => c.id === activeCategoryId) || HELP_CATEGORIES[0];

  // Search filtering
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeCategory.articles;
    }
    const q = searchQuery.toLowerCase().trim();
    // Search across ALL categories if user enters search query
    const results: Article[] = [];
    for (const cat of HELP_CATEGORIES) {
      for (const art of cat.articles) {
        if (
          art.title.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
        ) {
          results.push(art);
        }
      }
    }
    return results;
  }, [searchQuery, activeCategory]);

  const toggleArticle = (id: string) => {
    setOpenArticleId((prev) => (prev === id ? "" : id));
  };

  return (
    <main className="min-h-screen bg-[#FAFAFB] text-slate-900 pb-24">
      {/* ── 1. Page Header ── */}
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8 pt-8 sm:pt-12 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-950">
              Tourvaa Customer Support Help Centre
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal">
              Welcome to the Tourvaa Help Centre - everything you need to plan, book, and enjoy your adventure.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-sm w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles or questions..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Two-Column Help Center Body ── */}
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-8 sm:gap-10 items-start">
          {/* ── Left Sidebar: TABLE OF CONTENTS ── */}
          <aside className="rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-2xs lg:sticky lg:top-24">
            <h3 className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Table of Contents
            </h3>

            <nav className="mt-1 flex flex-col space-y-0.5 max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin">
              {HELP_CATEGORIES.map((cat) => {
                const isActive = cat.id === activeCategoryId && !searchQuery;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategoryId(cat.id);
                      setSearchQuery("");
                      if (cat.articles.length > 0) {
                        setOpenArticleId(cat.articles[0].id);
                      }
                    }}
                    className={`flex items-center text-left rounded-lg px-3 py-2.5 text-xs transition-all ${
                      isActive
                        ? "bg-[#EAF5FC] text-[#0284C7] font-bold shadow-2xs"
                        : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-left font-medium opacity-80">
                      {cat.number}
                    </span>
                    <span className="truncate">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Right Content Area: Articles in Category ── */}
          <section className="space-y-4">
            {/* Top helper note above card */}
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {searchQuery
                ? `Showing search results for "${searchQuery}" (${filteredArticles.length} found)`
                : activeCategory.description}
            </p>

            {/* Articles Box */}
            <div className="rounded-[22px] border border-slate-200/90 bg-white p-6 sm:p-9 shadow-2xs">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mb-6">
                Articles in this category
              </h2>

              {filteredArticles.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredArticles.map((article) => {
                    const isOpen = openArticleId === article.id;

                    return (
                      <div
                        key={article.id}
                        className={`transition-all duration-200 ${
                          isOpen ? "py-4" : "py-3.5"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleArticle(article.id)}
                          className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                        >
                          <span
                            className={`text-sm sm:text-base font-bold transition-colors ${
                              isOpen
                                ? "text-slate-950"
                                : "text-slate-800 group-hover:text-sky-700"
                            }`}
                          >
                            {article.title}
                          </span>

                          <span className="text-slate-400 group-hover:text-slate-600 shrink-0">
                            {isOpen ? (
                              <ChevronUp size={18} className="text-slate-900" strokeWidth={2} />
                            ) : (
                              <ChevronDown size={18} strokeWidth={2} />
                            )}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="mt-4 pt-3 border-t border-slate-100/80 text-slate-700 animate-in fade-in duration-200">
                            {article.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <HelpCircle size={36} className="mx-auto text-slate-300" />
                  <h3 className="mt-3 text-base font-bold text-slate-800">
                    No articles found matching &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Try searching for another keyword or select a category from the Table of Contents.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Reset search
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Still Need Help Card */}
            <div className="mt-8 rounded-[20px] border border-slate-200/80 bg-slate-100/60 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Can&apos;t find what you&apos;re looking for?
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  Our customer care specialists are available 24/7 to assist you.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("tourvaa:open-chat"))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0A1128] hover:bg-slate-850 text-white text-xs font-bold px-5 py-2.5 shadow-xs transition"
                >
                  <MessageCircle size={14} />
                  <span>Start Live Chat</span>
                </button>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-5 py-2.5 shadow-2xs transition"
                >
                  <span>Contact Us</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
