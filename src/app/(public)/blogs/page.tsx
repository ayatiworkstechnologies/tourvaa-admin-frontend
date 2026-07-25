"use client";

import { useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

/* eslint-disable @next/next/no-img-element */

const posts = [
  {
    slug: "top-5-monsoon-destinations",
    title: "Top 5 Monsoon Destinations in India",
    date: "June 10, 2026",
    category: "Travel Tips",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=900&q=75",
    excerpt: "Discover why the monsoon season is the best time to explore India's lush landscapes and hidden waterfalls. From the Western Ghats to the Northeast, we pick the top routes.",
  },
  {
    slug: "solo-travel-guide",
    title: "The Complete Solo Traveller's Guide",
    date: "May 28, 2026",
    category: "Guide",
    readTime: "8 min read",
    img: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=900&q=75",
    excerpt: "Everything you need to know about planning a safe, rewarding solo journey through South Asia - from budgeting and packing to booking and staying connected.",
  },
  {
    slug: "wildlife-photography-tips",
    title: "Wildlife Photography Tips from the Field",
    date: "May 15, 2026",
    category: "Photography",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=75",
    excerpt: "Expert advice from our partner naturalists on capturing the perfect safari shot without disturbing the wildlife around you.",
  },
];

const categories = ["All", ...Array.from(new Set(posts.map((post) => post.category)))];

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filteredPosts = activeCategory === "All" ? posts : posts.filter((post) => post.category === activeCategory);
  const [featured, ...rest] = filteredPosts;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#063c42] pb-20 pt-36 text-white">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-teal-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-orange-600/20 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Blog</p>
          <h1 className="mt-4 text-5xl font-black drop-shadow-sm md:text-6xl">Travel stories & guides</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Expert travel advice, destination guides, and stories from the road - written by our team and partner naturalists.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        {/* Category pills */}
        <div className="mb-10 flex flex-wrap gap-2.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-bold transition-all ${c === activeCategory ? "border-teal-600 bg-teal-50 text-teal-600" : "border-zinc-200 bg-white text-zinc-500 hover:border-teal-600 hover:text-teal-600"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {!featured ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white py-20 text-center">
            <p className="text-lg font-bold text-zinc-500">No articles in this category yet.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            <Link href={`/blogs/${featured.slug}`} className="group mb-12 flex overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="flex-1 p-8 md:p-10">
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-600">{featured.category}</span>
                  <span className="text-zinc-400">{featured.date}</span>
                  <span className="text-zinc-400">{featured.readTime}</span>
                </div>
                <h2 className="mt-5 text-3xl font-black text-zinc-950 group-hover:text-teal-600 transition-colors md:text-4xl">{featured.title}</h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-500">{featured.excerpt}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal-600 transition-colors group-hover:text-teal-700">
                  Read article <ArrowRight size={16} />
                </div>
              </div>
              <div className="hidden w-1/3 shrink-0 overflow-hidden lg:block">
                <img src={featured.img} alt={featured.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
            </Link>

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link key={post.slug} href={`/blogs/${post.slug}`} className="group overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={post.img} alt={post.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-600">{post.category}</span>
                        <span className="text-zinc-400">{post.readTime}</span>
                      </div>
                      <h3 className="mt-4 text-xl font-black text-zinc-950 group-hover:text-teal-600 transition-colors leading-snug">{post.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-500 flex-1">{post.excerpt}</p>
                      <p className="mt-5 text-xs font-bold uppercase tracking-widest text-zinc-400">{post.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
