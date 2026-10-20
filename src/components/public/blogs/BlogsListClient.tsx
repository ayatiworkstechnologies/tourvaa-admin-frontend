"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCalendar as Calendar,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuClock as Clock,
  LuCompass as Compass,
  LuGlobe as Globe,
  LuCircleHelp as HelpCircle,
  LuSearch as Search,
  LuSparkles as Sparkles,
  LuX as X,
} from "react-icons/lu";
import { CmsBlog, subscribeNewsletter } from "@/lib/api/publicClient";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import AboutReveal from "@/components/public/AboutReveal";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1600&q=80";

const DEFAULT_CATEGORIES = [
  "All",
  "Destinations",
  "Travel Guide",
  "Travel Tips",
  "Adventure",
  "Cultural Heritage",
  "Food & Wine",
  "Packing Tips",
];

const BLOG_FAQS = [
  {
    question: "How often are Tourvaa travel guides and itineraries updated?",
    answer:
      "Our editorial team and verified local tour leaders review destination guides, seasonal advice, and visa advisories on a monthly basis to ensure currency, pricing accuracy, and up-to-date entry rules.",
  },
  {
    question: "Are the visa guidelines, safety advice, and entry requirements verified?",
    answer:
      "Yes. All border entry guidelines, visa policies, transit advice, and vaccination recommendations are cross-checked with official consular portals and verified by local ground operators.",
  },
  {
    question: "Can I request a custom guide or itinerary for a destination not listed?",
    answer:
      "Absolutely! You can reach out to our travel specialists via the 24/7 Chat Widget or support desk, and our destination team will prepare customized itinerary ideas and recommend verified operators.",
  },
  {
    question: "How are the tours, hotels, and experiences featured in these guides selected?",
    answer:
      "We only highlight handpicked experiences from licensed, highly-rated local operators who maintain strict safety certifications, positive Trustpilot ratings (4.5+ stars), and transparent refund policies.",
  },
  {
    question: "Can I submit my own travel story or contribute to the Tourvaa blog?",
    answer:
      "We welcome passionate travelers, travel photographers, and experienced tour leaders! Get in touch with our editorial desk at editorial@tourvaa.com with your story proposal and sample photos.",
  },
  {
    question: "How do I save or bookmark travel articles for offline reading on my trip?",
    answer:
      "You can click the Bookmark icon or share articles to your device. When logged into your Tourvaa customer portal, your saved itineraries and articles sync automatically across your devices.",
  },
];

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

function readTime(content: string | null) {
  const words = (content || "")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function categoryOf(post: CmsBlog) {
  return (post.tags?.[0] || "Travel").toUpperCase();
}

function authorInitials(author: string | null) {
  const parts = (author || "Tourvaa").trim().split(/\s+/);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "TV"
  );
}

interface BlogsListClientProps {
  initialPosts: CmsBlog[];
}

export default function BlogsListClient({ initialPosts }: BlogsListClientProps) {
  const [posts] = useState<CmsBlog[]>(initialPosts);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? -1 : index);
  };

  // Dynamically compute category pills by gathering all unique tags from active posts
  const categories = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        const clean = t.trim();
        if (clean) tagSet.add(clean);
      });
    });

    const dynamicList = Array.from(tagSet);
    // Combine "All" + existing post tags + popular defaults
    const combined = ["All"];
    dynamicList.forEach((t) => {
      if (!combined.includes(t)) combined.push(t);
    });
    DEFAULT_CATEGORIES.forEach((t) => {
      if (!combined.includes(t) && combined.length < 10) combined.push(t);
    });
    return combined;
  }, [posts]);

  // Real-time filtering by category and search query
  const filteredArticles = useMemo(() => {
    return posts.filter((post) => {
      // 1. Category filter
      if (activeCategory !== "All") {
        const catLower = activeCategory.toLowerCase();
        const hasTag = (post.tags || []).some((t) =>
          t.toLowerCase().includes(catLower) || catLower.includes(t.toLowerCase())
        );
        const titleMatch = post.title.toLowerCase().includes(catLower);
        if (!hasTag && !titleMatch) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchExcerpt = (post.excerpt || "").toLowerCase().includes(q);
        const matchContent = (post.content || "").toLowerCase().includes(q);
        const matchTag = (post.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchExcerpt && !matchContent && !matchTag) return false;
      }

      return true;
    });
  }, [posts, activeCategory, searchQuery]);

  // When there are multiple posts and on default view ("All", no search),
  // feature the newest article in the lead card and display the others in the grid.
  // When there is only 1 post or during search/filtering, display all matching articles in the grid (never duplicate).
  const hasMultiplePosts = posts.length > 1;
  const isDefaultView = activeCategory === "All" && !searchQuery.trim() && hasMultiplePosts;
  const featuredPost = isDefaultView ? posts[0] ?? null : null;

  // Articles to display in the grid: exclude featuredPost to prevent duplicate rendering
  const gridArticles = useMemo(() => {
    if (featuredPost) {
      return filteredArticles.filter((article) => article.id !== featuredPost.id);
    }
    return filteredArticles;
  }, [filteredArticles, featuredPost]);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await subscribeNewsletter(email.trim());
      setMessage("Thank you — inspiring travel stories are on their way!");
      setEmail("");
    } catch (err: unknown) {
      setMessage(getApiErrorMessage(err));
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-slate-50/70 pb-20">
        {/* ── 1. Contained Hero Banner (Home Page Banner Style) ── */}
        <div className="relative z-20 mx-auto max-w-[1480px] px-3 pt-3 pb-4 sm:px-5 sm:pb-6">
          <section className="relative flex min-h-[480px] md:min-h-[520px] w-full flex-col items-center justify-between rounded-[24px] p-6 text-center text-white shadow-[0_12px_40px_rgba(15,23,42,0.14)] sm:p-10 overflow-hidden">
            {/* Background image & gradient overlay */}
            <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
              <img
                src={
                  featuredPost?.featured_image
                    ? mediaUrl(featuredPost.featured_image)
                    : FALLBACK_IMAGE
                }
                alt="Scenic travel background"
                className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/75" />
              <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-transparent via-black/20 to-black/60" />
            </div>

            {/* Top Pill Badge */}
            <div className="relative z-10 pt-2 sm:pt-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                <Compass size={14} className="text-amber-300" />
                <span>Tourvaa Travel Magazine &amp; Insider Guides</span>
              </span>
            </div>

            {/* Center Hero Content */}
            <div className="relative z-10 w-full max-w-4xl py-6">
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl sm:leading-[1.15]">
                Inspiring Travel Stories, Guides &amp; Expert Tips
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-base font-medium text-white/90 leading-relaxed drop-shadow-sm">
                From curated itineraries and visa tips to packing checklists and cultural secrets—explore the world with confidence.
              </p>

              {/* ── Search & Filter Bar (Home Page Filter Bar Style) ── */}
              <div className="mx-auto mt-6 max-w-2xl">
                <div className="relative flex items-center rounded-2xl border border-white/35 bg-white/20 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl transition focus-within:border-white focus-within:bg-white/30">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white shrink-0">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles by destination, topic, or keyword..."
                    className="w-full bg-transparent px-3 text-sm font-medium text-white placeholder:text-white/70 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="mr-1 rounded-lg p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Capsule: Verified guides note */}
            <div className="relative z-10 w-full max-w-[960px] mx-auto mt-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs text-white shadow-sm backdrop-blur-md sm:px-6 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-white/80 shrink-0" />
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
                    VERIFIED STORIES
                  </span>
                </div>
                <p className="min-w-0 flex-1 text-center font-medium text-white/90 text-xs sm:text-[13px] truncate">
                  Written by certified tour leaders, travel authors &amp; destination specialists worldwide
                </p>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-300 font-bold shrink-0">
                  <Sparkles size={14} />
                  <span>{posts.length} {posts.length === 1 ? "Guide" : "Guides"} Available</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── 2. Content & Articles Section ── */}
        <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 sm:pt-10">
          {/* Category Filter Pills */}
          <div data-reveal className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      active
                        ? "bg-pub-secondary text-white shadow-sm ring-2 ring-pub-secondary/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {(activeCategory !== "All" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pub-secondary hover:underline cursor-pointer"
              >
                <span>Reset all filters</span>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Featured Lead Article Card (when on All and no search) */}
          {featuredPost && (
            <div data-reveal className="mt-8">
              <Link
                href={`/blogs/${featuredPost.slug}`}
                className="group block overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                  <div className="relative h-[260px] sm:h-[340px] lg:col-span-7 w-full overflow-hidden rounded-[20px] bg-slate-100">
                    <img
                      src={
                        featuredPost.featured_image
                          ? mediaUrl(featuredPost.featured_image)
                          : FALLBACK_IMAGE
                      }
                      alt={featuredPost.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="rounded-full bg-pub-accent/90 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm backdrop-blur-xs">
                        {categoryOf(featuredPost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center py-2 px-2 sm:px-4 lg:col-span-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-pub-secondary">
                      ★ Featured Lead Story
                    </span>

                    <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-slate-950 leading-tight tracking-tight group-hover:text-pub-secondary transition-colors">
                      {featuredPost.title}
                    </h2>

                    {featuredPost.excerpt && (
                      <p className="mt-3 text-sm text-slate-600 font-medium leading-relaxed line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                    )}

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-xs text-blue-700">
                          {authorInitials(featuredPost.author)}
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-slate-900">
                            {featuredPost.author || "Tourvaa Editorial"}
                          </p>
                          <p className="text-slate-400">
                            {formatDate(
                              featuredPost.published_at || featuredPost.created_at
                            )}{" "}
                            · {readTime(featuredPost.content)}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-pub-secondary group-hover:translate-x-0.5 transition-transform">
                        <span>Read Story</span>
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* ── All Articles Grid ── */}
          <div className="mt-12 sm:mt-16">
            <div data-reveal className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : featuredPost
                    ? "More Travel Articles"
                    : "Latest Travel Articles"}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                  Showing {gridArticles.length} {gridArticles.length === 1 ? "article" : "articles"}
                </p>
              </div>
            </div>

            {gridArticles.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Search size={24} />
                </div>
                <p className="mt-4 text-base font-bold text-slate-800">
                  No articles found matching your criteria
                </p>
                <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search terms or select another category to discover inspiring destination stories.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                  }}
                  className="mt-5 rounded-xl bg-pub-secondary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-pub-secondary/90 transition cursor-pointer"
                >
                  View All Articles
                </button>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridArticles.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/blogs/${article.slug}`}
                    data-reveal
                    style={delay(index * 50)}
                    className="group flex flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
                  >
                    {/* Cover image */}
                    <div className="relative h-52 w-full overflow-hidden rounded-[16px] bg-slate-100">
                      <img
                        src={
                          article.featured_image
                            ? mediaUrl(article.featured_image)
                            : FALLBACK_IMAGE
                        }
                        alt={article.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-slate-900/85 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-xs shadow-xs">
                          {categoryOf(article)}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="mt-4 flex flex-1 flex-col">
                      <h3 className="text-base sm:text-lg font-bold text-slate-950 leading-snug line-clamp-2 group-hover:text-pub-secondary transition-colors">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1 font-medium">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Card Footer */}
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formatDate(article.published_at || article.created_at)}</span>
                          <span>•</span>
                          <Clock size={13} className="text-slate-400" />
                          <span>{readTime(article.content)}</span>
                        </div>

                        <span className="inline-flex items-center gap-1 font-bold text-pub-secondary group-hover:translate-x-0.5 transition-transform">
                          <span>Read</span>
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── 3. Frequently Asked Questions Section ── */}
          <div data-reveal className="mt-16 sm:mt-24">
            <section className="mx-auto max-w-4xl">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-sky-800">
                  <HelpCircle size={14} />
                  <span>Got Questions?</span>
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
                  Everything you need to know about Tourvaa travel guides, editorial advice, and verified itineraries.
                </p>
              </div>

              <div className="space-y-3.5">
                {BLOG_FAQS.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`rounded-[20px] transition-all duration-200 border ${
                        isOpen
                          ? "border-sky-200 bg-sky-50/40 shadow-xs ring-2 ring-sky-100"
                          : "border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-bold text-slate-900 pr-4 leading-snug">
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
            </section>
          </div>

          {/* ── 4. Newsletter Subscribe Banner ── */}
          <div data-reveal className="mt-16 sm:mt-24">
            <section className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-gradient-to-br from-[#0B1B33] via-[#0E2548] to-[#12345B] p-8 sm:p-12 text-white shadow-xl">
              <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 backdrop-blur-xs">
                    Join Our Travel Community
                  </span>
                  <h3 className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Get Global Travel Stories Straight to Your Inbox
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
                    Subscribe to receive secret destination recommendations, packing checklists, visa bulletins, and exclusive tour discounts.
                  </p>
                </div>

                <form onSubmit={subscribe} className="flex w-full max-w-md flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 backdrop-blur-md focus:border-white focus:bg-white/15 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="h-12 rounded-xl bg-pub-accent px-6 text-sm font-black text-white shadow-md hover:bg-pub-accent/90 transition disabled:opacity-60 cursor-pointer"
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
              </div>

              {message && (
                <p className="relative z-10 mt-4 text-xs font-bold text-emerald-400">
                  {message}
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </AboutReveal>
  );
}
