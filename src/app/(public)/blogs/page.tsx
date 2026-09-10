"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";
import { CmsBlog, fetchPublicBlogs, subscribeNewsletter } from "@/lib/api/publicClient";

import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import AboutReveal from "@/components/public/AboutReveal";

const CATEGORIES = [
  "All",
  "Destinations",
  "Travel Tips",
  "Culture",
  "Food & Drink",
  "Adventure",
  "News",
];

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80";

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

function readTime(content: string | null) {
  const words = (content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function categoryOf(post: CmsBlog) {
  return (post.tags?.[0] || "General").toUpperCase();
}

function authorInitials(author: string | null) {
  const parts = (author || "Tourvaa").trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "TV";
}

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [posts, setPosts] = useState<CmsBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    fetchPublicBlogs()
      .then((items) => {
        if (!active) return;
        const sorted = [...items].sort((a, b) => (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at));
        setPosts(sorted);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const featuredPost = posts[0] ?? null;
  const remainingPosts = featuredPost ? posts.slice(1) : posts;

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") return remainingPosts;
    const catUpper = activeCategory.toUpperCase();
    return remainingPosts.filter((post) => {
      const tags = (post.tags || []).map((t) => t.toUpperCase());
      if (tags.includes(catUpper)) return true;
      if (catUpper === "FOOD & DRINK") return tags.some((t) => t.includes("FOOD"));
      if (catUpper === "TRAVEL TIPS") return tags.some((t) => t.includes("TIP") || t.includes("SUSTAINAB"));
      return tags.some((t) => t.includes(catUpper) || catUpper.includes(t));
    });
  }, [activeCategory, remainingPosts]);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await subscribeNewsletter(email.trim());
      setMessage("Thank you — travel stories are on their way!");
      setEmail("");
    } catch (err: unknown) {
      setMessage(getApiErrorMessage(err));
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-white text-slate-900 pb-20">
        {/* Top Hero Landscape Banner */}
        <div className="mx-auto max-w-[1400px] px-5 pt-3">
          <section className="relative h-[300px] sm:h-[360px] md:h-[400px] w-full overflow-hidden rounded-[20px] bg-slate-900 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1600&q=80"
              alt="Panoramic alpine mountain vista"
              className="animate-tourvaa-hero h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/15" />
          </section>
        </div>

        <div className="mx-auto max-w-[1400px] px-5 pt-10 sm:pt-14">
          {/* Main Title */}
          <div data-reveal>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tourvaa Blog
            </h1>
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-500 max-w-3xl font-medium">
              Everything you need to know before you go - from visa tips to packing lists, we&apos;ve got you covered on your next global adventure.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div data-reveal className="mt-8 flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-[#E4572E] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Featured Lead Article Card - the most recently published real post */}
          {featuredPost && (
          <div data-reveal className="mt-10">
            <Link
              href={`/blogs/${featuredPost.slug}`}
              className="group block overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="relative h-[260px] sm:h-[320px] md:h-[360px] w-full overflow-hidden rounded-[16px] bg-slate-100">
                  <img
                    src={featuredPost.featured_image ? mediaUrl(featuredPost.featured_image) : FALLBACK_IMAGE}
                    alt={featuredPost.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col justify-center py-2 px-2 sm:px-4">
                  <span className="inline-flex w-fit items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-extrabold text-sky-700">
                    {categoryOf(featuredPost)}
                  </span>

                  <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-950 leading-tight tracking-tight group-hover:text-pub-secondary transition-colors">
                    {featuredPost.title}
                  </h2>

                  {featuredPost.excerpt && (
                    <p className="mt-3 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  )}

                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-xs text-blue-700">
                      {authorInitials(featuredPost.author)}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{featuredPost.author || "Tourvaa Team"}</p>
                      <p className="text-slate-400">{formatDate(featuredPost.published_at || featuredPost.created_at)} · {readTime(featuredPost.content)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          )}

          {/* Latest Articles - real published posts */}
          <div className="mt-16 sm:mt-20">
            <div data-reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Latest Articles
              </h2>
            </div>

            {loading ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-72 animate-pulse rounded-[20px] border border-slate-100/90 bg-slate-50" />
                ))}
              </div>
            ) : loadError ? (
              <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-10 text-center">
                <p className="text-sm font-bold text-slate-700">Articles could not be loaded</p>
                <p className="mt-1 text-xs text-slate-400">Please check your connection and try again.</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-10 text-center">
                <p className="text-sm font-bold text-slate-700">
                  {posts.length === 0 ? "No articles published yet" : "No articles in this category yet"}
                </p>
                <p className="mt-1 text-xs text-slate-400">Check back soon for new guides or explore all articles.</p>
                {posts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory("All")}
                    className="mt-4 rounded-xl bg-[#0B1527] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#15233C]"
                  >
                    View All Articles
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/blogs/${article.slug}`}
                  data-reveal
                  style={delay(index * 60)}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-48 w-full overflow-hidden rounded-[14px] bg-slate-100">
                    <img
                      src={article.featured_image ? mediaUrl(article.featured_image) : FALLBACK_IMAGE}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-3 flex flex-1 flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">
                      {categoryOf(article)}
                    </span>
                    <h3 className="mt-1.5 text-base font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-pub-secondary transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                        {article.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#E4572E] group-hover:underline">
                      <span>Read Article</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>

          {/* Newsletter Subscribe Banner */}
          <div data-reveal className="mt-16 sm:mt-20">
            <section className="rounded-[24px] border border-slate-100/90 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Get Travel Tips Straight to Your Inbox
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
                    Subscribe to receive tactical gear updates, packing checklists, and sudden destination safety bulletins.
                  </p>
                </div>

                <form onSubmit={subscribe} className="flex w-full max-w-md items-center gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B1527] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="h-12 rounded-xl bg-[#0B1527] px-6 text-sm font-black text-white shadow-md hover:bg-[#15233C] transition disabled:opacity-60"
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
              </div>
              {message && (
                <p className="mt-3 text-xs font-bold text-emerald-600">{message}</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </AboutReveal>
  );
}
