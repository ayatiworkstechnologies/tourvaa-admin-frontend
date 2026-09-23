"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCalendar as Calendar } from "react-icons/lu";
import { CmsBlog, fetchPublicBlogs } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { defaultViewAllUrl, type HomeExtraSection } from "./extraSectionsTypes";

// Renderers for the non-tour section types an admin can add from CMS > Home
// Page > "+ Add new section" (card grid, offer card, blog cards, text,
// image + text). Styled to sit alongside the built-in homepage sections.
// All fields are plain text rendered via JSX (never as HTML).

function Shell({ background, children }: { background: string; children: ReactNode }) {
  return (
    <section className={`relative w-full overflow-hidden py-14 sm:py-18 ${background}`}>
      <div className="relative z-10 mx-auto max-w-[1400px] px-5">{children}</div>
    </section>
  );
}

function Heading({ section, action }: { section: HomeExtraSection; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">{section.title}</h2>
        {section.subtitle && <p className="mt-1.5 max-w-2xl text-sm sm:text-base text-slate-600">{section.subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Paragraphs({ body, className }: { body: string; className: string }) {
  return (
    <>
      {body
        .split("\n")
        .filter((l) => l.trim())
        .map((line, i) => (
          <p key={i} className={className}>
            {line}
          </p>
        ))}
    </>
  );
}

function Button({ href, label, variant = "dark" }: { href: string; label: string; variant?: "dark" | "light" }) {
  return (
    <Link
      href={href || "/"}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold shadow-sm transition ${
        variant === "light" ? "bg-white text-slate-950 hover:bg-slate-100" : "bg-pub-primary text-white hover:opacity-90"
      }`}
    >
      {label} <ArrowRight size={15} />
    </Link>
  );
}

export function ExtraCardsSection({ section, background }: { section: HomeExtraSection; background: string }) {
  const cards = section.cards.filter((c) => c.title || c.image || c.description);
  if (!cards.length) return null;
  return (
    <Shell background={background}>
      <Heading section={section} />
      <div className="reveal-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => {
          const inner = (
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-2.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              {card.image && (
                <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-100">
                  <img src={mediaUrl(card.image)} alt={card.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              )}
              <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                {card.title && <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-pub-accent">{card.title}</h3>}
                {card.description && <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{card.description}</p>}
                {card.link && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-pub-accent">
                    Explore <ArrowRight size={13} />
                  </span>
                )}
              </div>
            </article>
          );
          return card.link ? (
            <Link key={i} href={card.link} className="block h-full">
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
    </Shell>
  );
}

export function ExtraOfferSection({ section }: { section: HomeExtraSection }) {
  return (
    <section className="w-full py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="relative overflow-hidden rounded-[26px] bg-pub-primary shadow-xl">
          {section.image && (
            <>
              <img src={mediaUrl(section.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A] via-[#0B1F3A]/80 to-[#0B1F3A]/10" />
            </>
          )}
          <div className="relative z-10 flex min-h-[260px] max-w-2xl flex-col justify-center px-6 py-10 sm:px-12">
            {section.badge && (
              <span className="mb-3 inline-flex w-fit rounded-full bg-pub-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {section.badge}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">{section.title}</h2>
            {section.subtitle && <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/85">{section.subtitle}</p>}
            {section.button_text && (
              <div className="mt-6">
                <Button href={section.button_link} label={section.button_text} variant="light" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Latest posts, fetched once per page load and shared by every blog section.
let pendingBlogs: Promise<CmsBlog[]> | null = null;
const loadBlogs = () => (pendingBlogs ??= fetchPublicBlogs().catch(() => []));

export function ExtraBlogsSection({ section, background }: { section: HomeExtraSection; background: string }) {
  const [blogs, setBlogs] = useState<CmsBlog[] | null>(null);
  useEffect(() => {
    let active = true;
    loadBlogs().then((items) => {
      if (active) setBlogs(items);
    });
    return () => {
      active = false;
    };
  }, []);

  if (blogs === null || blogs.length === 0) return null;
  const posts = [...blogs]
    .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
    .slice(0, Math.min(section.limit, 8));

  return (
    <Shell background={background}>
      <Heading
        section={section}
        action={
          <Link href={section.view_all_url.trim() || defaultViewAllUrl(section)} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-pub-accent hover:underline sm:inline-flex">
            {section.view_all_text.trim() || "View all posts"} <ArrowRight size={14} />
          </Link>
        }
      />
      <div className="reveal-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <Link key={post.id} href={`/blogs/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-2.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100">
              {post.featured_image && (
                <img src={mediaUrl(post.featured_image)} alt={post.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              )}
            </div>
            <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
              {(post.published_at || post.created_at) && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Calendar size={11} />
                  {new Date(post.published_at || post.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-pub-accent">{post.title}</h3>
              {post.excerpt && <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-pub-accent">
                Read more <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

export function ExtraTextSection({ section, background }: { section: HomeExtraSection; background: string }) {
  if (!section.body.trim()) return null;
  return (
    <Shell background={background}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">{section.title}</h2>
        {section.subtitle && <p className="mt-2 text-base font-medium text-slate-700">{section.subtitle}</p>}
        <div className="mt-4 space-y-3">
          <Paragraphs body={section.body} className="text-sm sm:text-base leading-relaxed text-slate-600" />
        </div>
      </div>
    </Shell>
  );
}

export function ExtraImageTextSection({ section, background }: { section: HomeExtraSection; background: string }) {
  if (!section.body.trim() && !section.image) return null;
  const imageFirst = section.image_position !== "right";
  return (
    <Shell background={background}>
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-14">
        {section.image && (
          <div className={`overflow-hidden rounded-[22px] border border-slate-200/80 shadow-sm ${imageFirst ? "md:order-1" : "md:order-2"}`}>
            <img src={mediaUrl(section.image)} alt={section.title} className="h-full max-h-[420px] w-full object-cover" />
          </div>
        )}
        <div className={imageFirst ? "md:order-2" : "md:order-1"}>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">{section.title}</h2>
          {section.subtitle && <p className="mt-2 text-base font-medium text-slate-700">{section.subtitle}</p>}
          <div className="mt-4 space-y-3">
            <Paragraphs body={section.body} className="text-sm sm:text-base leading-relaxed text-slate-600" />
          </div>
          {section.button_text && (
            <div className="mt-6">
              <Button href={section.button_link} label={section.button_text} />
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
