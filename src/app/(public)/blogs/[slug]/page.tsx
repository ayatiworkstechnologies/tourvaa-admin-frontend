import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuCalendar as Calendar, LuClock as Clock } from "react-icons/lu";
import { fetchBlogForServer } from "@/lib/seo/blogMetadata";
import { mediaUrl } from "@/lib/utils/mediaUrl";

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

  const category = "Travel";
  const image = post.featured_image ? mediaUrl(post.featured_image) : FALLBACK_IMAGE;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Hero */}
      <div className="relative h-96 bg-[#063c42] md:h-[500px]">
        <img src={image} alt={post.title} className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-5 pb-10 md:px-8">
          <span className="rounded-full bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">{category}</span>
          <h1 className="mt-4 text-3xl font-black text-white drop-shadow-sm md:text-5xl lg:leading-tight">{post.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-medium text-white/80">
            <span className="flex items-center gap-1.5"><Calendar size={16} className="text-teal-400" />{formatDate(post.published_at)}</span>
            <span className="flex items-center gap-1.5"><Clock size={16} className="text-teal-400" />{readTime(post.content)}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <Link href="/blogs" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-teal-600 transition-colors">
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        {post.excerpt && <p className="mb-8 text-xl font-medium leading-relaxed text-zinc-500">{post.excerpt}</p>}

        <article
          className="space-y-6 text-base leading-relaxed text-zinc-600 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-zinc-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-zinc-950 [&_a]:text-teal-600 [&_a]:underline [&_strong]:text-zinc-950"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        <div className="mt-14 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-xl font-black text-zinc-950 tracking-tight">Ready to experience it yourself?</p>
          <p className="mt-2 text-base text-zinc-500">Browse our handpicked tours and plan your next trip with Tourvaa.</p>
          <Link href="/tours" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5">
            Browse Tours <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
