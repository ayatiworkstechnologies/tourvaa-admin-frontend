import Link from "next/link";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuCalendar as Calendar, LuClock as Clock } from "react-icons/lu";

const posts: Record<string, { title: string; date: string; category: string; readTime: string; img: string; excerpt: string; body: string[] }> = {
  "top-5-monsoon-destinations": {
    title: "Top 5 Monsoon Destinations in India",
    date: "June 10, 2026",
    category: "Travel Tips",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1400&q=80",
    excerpt: "Discover why the monsoon season is the best time to explore India's lush landscapes.",
    body: [
      "India transforms during the monsoon. The parched plains turn vivid green, waterfalls that lie dormant for nine months come roaring to life, and the tourist crowds thin out dramatically — which means you can enjoy some of the country's most spectacular landscapes with far more breathing room.",
      "**1. Coorg, Karnataka** — Rolling coffee estates draped in mist, cascading falls and wide umbrella trees: Coorg in the rains is a quiet, moody retreat. Abbey Falls doubles in volume and the local cardamom and pepper gardens are at their most fragrant.",
      "**2. Cherrapunji, Meghalaya** — One of the wettest places on earth, Cherrapunji becomes almost surreal in June and July. Living root bridges appear through swirling clouds and the valley below Nohkalikai Falls disappears entirely in white spray.",
      "**3. Munnar, Kerala** — The tea gardens go a deep, glossy green against low cloud. Early mornings are worth it for the mist that rolls across the slopes — photograph-worthy and completely peaceful if you avoid the weekend crowds.",
      "**4. Spiti Valley, Himachal Pradesh** — A contrarian pick: while the rest of India gets drenched, the high-altitude trans-Himalayan valley stays dry (it sits in the rain shadow). Clear skies, emptier roads and the dramatic landscape at its most vivid.",
      "**5. Goa's Inland Villages** — Skip the beaches (they're closed) and go inland. The spice farms, Portuguese ruins, and jungle waterfalls of Goa's interior are at their most striking in monsoon, and room rates drop by half.",
      "The key to monsoon travel is flexible planning: book refundable or changeable tickets, carry a dry bag for electronics, and lean into the season rather than fighting it. The reward is an India very few travellers ever see.",
    ],
  },
  "solo-travel-guide": {
    title: "The Complete Solo Traveller's Guide",
    date: "May 28, 2026",
    category: "Guide",
    readTime: "8 min read",
    img: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1400&q=80",
    excerpt: "Everything you need for a safe, rewarding solo journey through South Asia.",
    body: [
      "Solo travel in South Asia is one of the most rewarding things you can do — and also one of the most misunderstood. Done right, it combines total freedom with genuine human connection. Here is the practical guide we wish we'd had.",
      "**Before you go** — Research your visa situation early. India, Sri Lanka, Nepal and Bhutan all have different entry requirements. Make copies of every document and store them in two separate cloud accounts. Tell someone at home your rough itinerary.",
      "**Budget** — A daily budget of AED 150-250 (roughly USD 40-70) is comfortable for mid-range independent travel across India. This covers a decent guesthouse, three meals, local transport and one activity. Keep a small dollar or dirham cash reserve for emergencies.",
      "**Connectivity** — Pick up a local SIM at the airport on arrival. Indian carriers (Airtel, Jio) offer affordable data plans that last 28 or 56 days. Download offline maps for your destinations before each journey.",
      "**Accommodation** — Hostels have improved dramatically across India. Many now have excellent private rooms at hostel prices. Check common-room culture reviews, not just the room itself — the social aspect is half the reason solo travellers choose hostels.",
      "**Safety** — Trust your instincts and leave situations that feel wrong. Share your location with one trusted contact. Avoid announcing your plans too far in advance to new acquaintances. Most people are genuinely helpful but a few situations are worth stepping back from.",
      "**The mental side** — Solo travel has lonely stretches. That is normal and temporary. Carry a journal, use downtime to plan the next section, and let yourself be bored occasionally. The best moments often emerge when you stop filling every hour.",
    ],
  },
  "wildlife-photography-tips": {
    title: "Wildlife Photography Tips from the Field",
    date: "May 15, 2026",
    category: "Photography",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80",
    excerpt: "Expert advice from our partner naturalists on getting the perfect shot.",
    body: [
      "Great wildlife photography is not primarily about equipment — it is about patience, positioning, and understanding animal behaviour. After hundreds of game drives across India's national parks, here is what actually makes the difference.",
      "**Arrive at golden hour** — The light in the first and last hour of the day is softer, warmer, and dramatically better than midday sun. Most animals are also more active at these times. Book early-morning or late-afternoon drives wherever possible.",
      "**Learn to predict, not just react** — Study the animal you are hoping to photograph before you go. A tiger's territory, a leopard's favourite branch, the direction a herd of elephants moves at dusk — knowing this turns a lucky sighting into a planned composition.",
      "**Exposure settings** — Wildlife in motion needs a fast shutter speed (1/800s or faster). Set your camera to shutter-priority mode and let the aperture adjust. For static animals in good light, aperture priority at f/5.6 gives a good depth-of-field balance.",
      "**Respect first, shots second** — Never pressure your guide to move closer than is safe or comfortable for the animal. Stressed animals make poor subjects anyway. The best images come from calm, unhurried situations.",
      "**Back up in the field** — Bring two memory cards. Back up to a laptop or portable hard drive every evening. Losing a week of images to a corrupted card on the last day of a safari is devastating and entirely preventable.",
      "Finally: put the camera down occasionally. Watching a tiger walk silently into the forest without reaching for a lens is a different kind of experience — and often the one you remember longest.",
    ],
  },
};

const fallback = {
  title: "Travel Article",
  date: "2026",
  category: "Blog",
  readTime: "5 min read",
  img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80",
  excerpt: "A travel story from the Tourvaa blog.",
  body: ["This article is coming soon. In the meantime, explore our other travel guides and stories."],
};

function renderBody(text: string) {
  if (text.startsWith("**") && text.includes("**", 2)) {
    const end = text.indexOf("**", 2);
    const bold = text.slice(2, end);
    const rest = text.slice(end + 2);
    return <p key={text} className="leading-relaxed text-zinc-600"><strong className="text-zinc-950">{bold}</strong>{rest}</p>;
  }
  return <p key={text} className="leading-relaxed text-zinc-600">{text}</p>;
}

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug] || fallback;

  const related = Object.entries(posts)
    .filter(([s]) => s !== params.slug)
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      {/* Hero */}
      <div className="relative h-96 bg-zinc-950 md:h-[500px]">
        <img src={post.img} alt={post.title} className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-5 pb-10 md:px-8">
          <span className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">{post.category}</span>
          <h1 className="mt-4 text-3xl font-black text-white drop-shadow-sm md:text-5xl lg:leading-tight">{post.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-medium text-white/80">
            <span className="flex items-center gap-1.5"><Calendar size={16} className="text-indigo-400" />{post.date}</span>
            <span className="flex items-center gap-1.5"><Clock size={16} className="text-indigo-400" />{post.readTime}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <Link href="/blogs" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        <p className="mb-8 text-xl font-medium leading-relaxed text-zinc-500">{post.excerpt}</p>

        <article className="space-y-6 text-base">
          {post.body.map((para) => renderBody(para))}
        </article>

        <div className="mt-14 rounded-3xl border border-zinc-100 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-xl font-black text-zinc-950 tracking-tight">Ready to experience it yourself?</p>
          <p className="mt-2 text-base text-zinc-500">Browse our handpicked tours and plan your next trip with Tourvaa.</p>
          <Link href="/tours" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5">
            Browse Tours <ArrowRight size={16} />
          </Link>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-black tracking-tight text-zinc-950">More articles</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {related.map(([slug, p]) => (
                <Link key={slug} href={`/blogs/${slug}`} className="group overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={p.img} alt={p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">{p.category}</span>
                    <p className="mt-2 text-lg font-black text-zinc-950 group-hover:text-indigo-600 transition-colors">{p.title}</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-400 mt-auto pt-2">{p.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
