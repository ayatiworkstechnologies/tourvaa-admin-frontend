import Link from "next/link";
import { LuArrowRight as ArrowRight, LuBookOpen as BookOpen } from "react-icons/lu";

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
    excerpt: "Everything you need to know about planning a safe, rewarding solo journey through South Asia — from budgeting and packing to booking and staying connected.",
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
  {
    slug: "kerala-backwaters-guide",
    title: "Kerala Backwaters: What Nobody Tells You",
    date: "April 30, 2026",
    category: "Destination",
    readTime: "7 min read",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=75",
    excerpt: "Beyond the houseboats, Kerala's backwaters offer quiet village homestays, canoe trails, and local market visits most tourists never see.",
  },
  {
    slug: "himalayan-packing-list",
    title: "The Himalayan Packing List You'll Actually Use",
    date: "April 14, 2026",
    category: "Guide",
    readTime: "4 min read",
    img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=75",
    excerpt: "After hundreds of mountain departures, our team shares exactly what makes it into the bag — and what stays home.",
  },
  {
    slug: "heritage-walks-india",
    title: "10 Heritage Walks Worth Planning a Trip For",
    date: "March 28, 2026",
    category: "Culture",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=75",
    excerpt: "From Ahmedabad's old city lanes to Kolkata's colonial quarters — the best heritage walks across India and how to do them properly.",
  },
];

const categories = ["All", "Travel Tips", "Guide", "Destination", "Photography", "Culture"];

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <section className="bg-zinc-950 py-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Blog</p>
          <h1 className="mt-4 text-5xl font-black drop-shadow-sm md:text-6xl">Travel stories & guides</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Expert travel advice, destination guides, and stories from the road — written by our team and partner naturalists.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        {/* Category pills */}
        <div className="mb-10 flex flex-wrap gap-2.5">
          {categories.map((c) => (
            <span key={c} className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-bold transition-all ${c === "All" ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-zinc-200 bg-white text-zinc-500 hover:border-indigo-600 hover:text-indigo-600"}`}>
              {c}
            </span>
          ))}
        </div>

        {/* Featured post */}
        <Link href={`/blogs/${posts[0].slug}`} className="group mb-12 flex overflow-hidden rounded-3xl bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex-1 p-8 md:p-10">
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">{posts[0].category}</span>
              <span className="text-zinc-400">{posts[0].date}</span>
              <span className="text-zinc-400">{posts[0].readTime}</span>
            </div>
            <h2 className="mt-5 text-3xl font-black text-zinc-950 group-hover:text-indigo-600 transition-colors md:text-4xl">{posts[0].title}</h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-500">{posts[0].excerpt}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition-colors group-hover:text-indigo-700">
              Read article <ArrowRight size={16} />
            </div>
          </div>
          <div className="hidden w-1/3 shrink-0 overflow-hidden lg:block">
            <img src={posts[0].img} alt={posts[0].title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          </div>
        </Link>

        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(1).map((post) => (
            <Link key={post.slug} href={`/blogs/${post.slug}`} className="group overflow-hidden rounded-3xl bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={post.img} alt={post.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">{post.category}</span>
                  <span className="text-zinc-400">{post.readTime}</span>
                </div>
                <h3 className="mt-4 text-xl font-black text-zinc-950 group-hover:text-indigo-600 transition-colors leading-snug">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-500 flex-1">{post.excerpt}</p>
                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-zinc-400">{post.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
