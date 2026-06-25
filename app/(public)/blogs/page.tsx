import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

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
    <main className="min-h-screen bg-[#F7F9FC] pb-20">
      {/* Header */}
      <section className="bg-[#0F172A] py-14 text-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#43A9F6]">Blog</p>
          <h1 className="mt-2 text-4xl font-bold">Travel stories & guides</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Expert travel advice, destination guides, and stories from the road — written by our team and partner naturalists.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {/* Category pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c} className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition ${c === "All" ? "border-[#0284C7] bg-[#E7F5FF] text-[#0284C7]" : "border-[#E7EAF0] bg-white text-[#667085] hover:border-[#0284C7] hover:text-[#0284C7]"}`}>
              {c}
            </span>
          ))}
        </div>

        {/* Featured post */}
        <Link href={`/blogs/${posts[0].slug}`} className="group mb-8 flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E7EAF0] hover:ring-[#43A9F6]">
          <div className="flex-1 p-7 md:p-8">
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full bg-[#E7F5FF] px-3 py-1 font-bold text-[#0284C7]">{posts[0].category}</span>
              <span className="text-[#98A2B3]">{posts[0].date}</span>
              <span className="text-[#98A2B3]">{posts[0].readTime}</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[#121826] group-hover:text-[#0284C7] md:text-3xl">{posts[0].title}</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#667085]">{posts[0].excerpt}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0284C7]">
              Read article <ArrowRight size={14} />
            </div>
          </div>
          <div className="hidden w-64 shrink-0 overflow-hidden lg:block">
            <img src={posts[0].img} alt={posts[0].title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          </div>
        </Link>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(1).map((post) => (
            <Link key={post.slug} href={`/blogs/${post.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E7EAF0] hover:ring-[#43A9F6]">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={post.img} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#E7F5FF] px-2.5 py-1 font-bold text-[#0284C7]">{post.category}</span>
                  <span className="text-[#98A2B3]">{post.readTime}</span>
                </div>
                <h3 className="mt-2 font-bold text-[#121826] group-hover:text-[#0284C7]">{post.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#667085]">{post.excerpt}</p>
                <p className="mt-3 text-xs text-[#98A2B3]">{post.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
