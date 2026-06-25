import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";

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
    return <p key={text} className="leading-7 text-[#344054]"><strong className="text-[#121826]">{bold}</strong>{rest}</p>;
  }
  return <p key={text} className="leading-7 text-[#344054]">{text}</p>;
}

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug] || fallback;

  const related = Object.entries(posts)
    .filter(([s]) => s !== params.slug)
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-[#F7F9FC] pb-20">
      {/* Hero */}
      <div className="relative h-80 bg-[#0F172A] md:h-96">
        <img src={post.img} alt={post.title} className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0F172A] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-5 pb-8 md:px-8">
          <span className="rounded-full bg-[#0284C7] px-3 py-1 text-xs font-bold text-white">{post.category}</span>
          <h1 className="mt-3 text-2xl font-bold text-white md:text-4xl">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1"><Calendar size={12} />{post.date}</span>
            <span className="flex items-center gap-1"><Clock size={12} />{post.readTime}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <Link href="/blogs" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#0284C7]">
          <ArrowLeft size={13} /> Back to Blog
        </Link>

        <p className="mb-6 text-lg font-semibold text-[#667085]">{post.excerpt}</p>

        <article className="space-y-4 text-sm">
          {post.body.map((para) => renderBody(para))}
        </article>

        <div className="mt-10 rounded-2xl border border-[#E7EAF0] bg-white p-6 text-center">
          <p className="font-bold text-[#121826]">Ready to experience it yourself?</p>
          <p className="mt-1 text-sm text-[#667085]">Browse our handpicked tours and plan your next trip with Tourvaa.</p>
          <Link href="/tours" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1]">
            Browse Tours <ArrowRight size={14} />
          </Link>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 font-bold text-[#121826]">More articles</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {related.map(([slug, p]) => (
                <Link key={slug} href={`/blogs/${slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E7EAF0] hover:ring-[#43A9F6]">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={p.img} alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-bold text-[#0284C7]">{p.category}</span>
                    <p className="mt-1 font-bold text-[#121826] group-hover:text-[#0284C7]">{p.title}</p>
                    <p className="mt-0.5 text-xs text-[#98A2B3]">{p.date}</p>
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
