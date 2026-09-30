import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuCalendar as Calendar, LuClock as Clock } from "react-icons/lu";
import { fetchBlogForServer } from "@/lib/seo/blogMetadata";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import {
  cleanHtmlToHumanText,
  extractFaqsFromContent,
  formatBlogTextToHtml,
} from "@/lib/types/blog";

/* eslint-disable @next/next/no-img-element */

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80";

function readTime(content: string | null) {
  const words = (content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchBlogForServer(slug);
  if (!post) notFound();

  const category = (post.tags?.[0] || "Travel").toUpperCase();
  const image = post.featured_image ? mediaUrl(post.featured_image) : FALLBACK_IMAGE;

  // Extract plain-text FAQs and format natural text into beautiful paragraphs
  const { cleanContent, faqs } = extractFaqsFromContent(post.content || "");
  const humanContent = cleanHtmlToHumanText(cleanContent);
  const formattedHtml = formatBlogTextToHtml(humanContent);

  return (
    <main className="min-h-screen bg-slate-50/70 pb-20">
      {/* ── 1. Contained Hero Banner (Home Page Banner Style) ── */}
      <div className="relative z-20 mx-auto max-w-[1480px] px-3 pt-3 pb-4 sm:px-5 sm:pb-6">
        <section className="relative flex min-h-[440px] md:min-h-[500px] w-full flex-col justify-between rounded-[24px] p-6 text-white shadow-[0_12px_40px_rgba(15,23,42,0.14)] sm:p-10 overflow-hidden">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
            <img
              src={image}
              alt={post.banner_alt || post.title}
              className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-slate-950/30" />
            <div className="absolute inset-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-transparent via-slate-950/20 to-slate-950/80" />
          </div>

          {/* Top Row: Back button & Breadcrumb capsule */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white shadow-sm backdrop-blur-md hover:bg-white/20 transition-all hover:-translate-x-0.5"
            >
              <ArrowLeft size={14} />
              <span>Back to Blog</span>
            </Link>

            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs font-semibold text-white/80">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span className="text-white/40">/</span>
              <Link href="/blogs" className="hover:text-white transition">Blogs</Link>
              <span className="text-white/40">/</span>
              <span className="text-white truncate max-w-[200px]">{post.title}</span>
            </nav>
          </div>

          {/* Bottom Banner Content */}
          <div className="relative z-10 mx-auto w-full max-w-4xl pt-12 pb-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full bg-pub-accent px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                {category}
              </span>
              {post.tags && post.tags.length > 1 && (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-xs">
                  {post.tags.slice(1, 3).join(" • ")}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-4xl md:text-5xl lg:text-[54px] lg:leading-[1.15]">
              {post.banner_title || post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-3.5 max-w-3xl text-sm sm:text-base font-medium leading-relaxed text-white/90 drop-shadow-sm">
                {post.excerpt}
              </p>
            )}

            {/* Meta Row */}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/15 pt-4 text-xs font-semibold text-white/85">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-black text-xs text-white ring-2 ring-white/30 backdrop-blur-xs">
                  {(post.author || "Tourvaa").slice(0, 2).toUpperCase()}
                </div>
                <span>{post.author || "Tourvaa Editorial Team"}</span>
              </div>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-white/70" />
                {formatDate(post.published_at || post.created_at)}
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-white/70" />
                {readTime(post.content)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ── 2. Article Content ── */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <article
          className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed text-slate-700 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-slate-950 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl sm:[&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-slate-950 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-slate-900 [&_p]:leading-relaxed [&_a]:text-pub-secondary [&_a]:font-bold [&_a]:underline hover:[&_a]:text-pub-secondary/80 [&_strong]:text-slate-950 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-pub-secondary [&_blockquote]:bg-slate-100/70 [&_blockquote]:p-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:text-slate-800 [&_details]:my-4 [&_details]:rounded-2xl [&_details]:border [&_details]:border-slate-200/90 [&_details]:bg-white [&_details]:p-4 [&_details]:shadow-2xs [&_details[open]]:border-sky-300 [&_details[open]]:bg-sky-50/20 [&_summary]:font-bold [&_summary]:text-slate-900 [&_summary]:cursor-pointer [&_summary]:select-none"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />

        {/* ── Article FAQs Accordion (Clean Plain-Text FAQs) ── */}
        {faqs.length > 0 && (
          <div className="mt-12 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sky-800">
                Frequently Asked Questions
              </span>
              <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Helpful Tips &amp; Key Questions
              </h3>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 shadow-2xs open:border-sky-300 open:bg-sky-50/20 transition-all cursor-pointer"
                >
                  <summary className="flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 select-none">
                    <span>{faq.question}</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-200/60 pt-2.5">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Tags Footer */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tagged with:</span>
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blogs?category=${encodeURIComponent(tag)}`}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-pub-accent hover:text-pub-accent transition"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Tourvaa Explore CTA */}
        <div className="mt-14 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-8 sm:p-10 text-center shadow-sm">
          <span className="inline-block rounded-full bg-sky-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-sky-800">
            Turn Inspiration Into Reality
          </span>
          <p className="mt-3 text-2xl font-black text-slate-950 tracking-tight sm:text-3xl">
            Ready to experience it yourself?
          </p>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Browse our handpicked tours, expert guides, and verified itineraries to start planning your next journey.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 rounded-xl bg-pub-secondary px-6 py-3.5 text-sm font-bold text-white hover:bg-pub-secondary/90 shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              Browse Tours <ArrowRight size={16} />
            </Link>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Explore More Articles
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
