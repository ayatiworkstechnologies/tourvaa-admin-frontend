"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { fetchContentBlock } from "@/lib/api/publicClient";
import {
  LuAward as Award,
  LuBadgeCheck as BadgeCheck,
  LuCalendarDays as CalendarDays,
  LuCompass as Compass,
  LuGlobe as Globe,
  LuHeadphones as Headphones,
  LuHeartHandshake as HeartHandshake,
  LuLeaf as Leaf,
  LuMapPin as MapPin,
  LuQuote as Quote,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuTrophy as Trophy,
  LuUsers as Users,
  LuArrowRight as ArrowRight,
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";

const DEFAULT_METRICS = [
  {
    value: "10+",
    label: "Years of Excellence",
    sub: "Founded in 2015 with passion",
    icon: Compass,
    color: "from-blue-500/10 to-sky-500/10 text-sky-600",
  },
  {
    value: "500+",
    label: "Curated Expeditions",
    sub: "Across 80+ countries worldwide",
    icon: Globe,
    color: "from-amber-500/10 to-orange-500/10 text-amber-600",
  },
  {
    value: "50,000+",
    label: "Delighted Travelers",
    sub: "99.2% positive journey rating",
    icon: HeartHandshake,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600",
  },
  {
    value: "4.9★",
    label: "Top-Rated Operator",
    sub: "Over 3,200+ verified reviews",
    icon: Star,
    color: "from-violet-500/10 to-purple-500/10 text-violet-600",
  },
];

const DEFAULT_TEAM = [
  {
    name: "Arjun Mehta",
    role: "Founder & CEO",
    specialty: "60+ Countries Explored",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    bio: "A lifelong explorer who has summited Alpine peaks and trekked Patagonian glaciers. Arjun founded Tourvaa to make transformative, ethical travel seamless for everyone.",
  },
  {
    name: "Priya Sharma",
    role: "Head of Global Operations",
    specialty: "12+ Years Logistics Master",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bio: "With over a decade leading international travel logistics across Asia and Europe, Priya ensures every hotel, private transfer, and permit runs like clockwork.",
  },
  {
    name: "James Walker",
    role: "Lead Tour Producer",
    specialty: "Cultural Heritage Curator",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    bio: "James crafts our signature itineraries, partnering exclusively with certified indigenous storytellers, historians, and local chefs for authentic immersion.",
  },
  {
    name: "Sophia Chen",
    role: "Customer Experience Director",
    specialty: "24/7 Guest Care Lead",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    bio: "Sophia manages our global concierge response desk, making sure every guest feels supported, safe, and valued from pre-booking advice to the flight back home.",
  },
];

const DEFAULT_VALUES = [
  {
    number: "01",
    title: "Best Price Guarantee",
    desc: "Direct operator partnerships guarantee authentic local pricing with zero hidden platform markups or surprise fees at checkout.",
    icon: ShieldCheck,
    badge: "Direct Pricing",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=85",
  },
  {
    number: "02",
    title: "Vetted Local Guides",
    desc: "Every expedition is led by certified, bilingual local insiders who bring their home heritage, hidden eateries, and legends to life.",
    icon: Users,
    badge: "Certified Insiders",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=85",
  },
  {
    number: "03",
    title: "Handcrafted Itineraries",
    desc: "Expertly balanced pacing combining iconic bucket-list sights with generous leisure time and intimate boutique accommodations.",
    icon: CalendarDays,
    badge: "Artisan Pacing",
    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=85",
  },
  {
    number: "04",
    title: "Small Group Intimacy",
    desc: "We cap our group sizes at 12–16 adventurers to foster lifelong friendships without the noise of commercial tour buses.",
    icon: Sparkles,
    badge: "Max 12-16 Guests",
    image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=800&q=85",
  },
  {
    number: "05",
    title: "24/7 Safety Net",
    desc: "Round-the-clock emergency support, rapid re-routing protocols, and comprehensive operator insurance on every continent.",
    icon: Headphones,
    badge: "Always On Call",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=85",
  },
];

const DEFAULT_AWARDS = [
  {
    icon: BadgeCheck,
    title: "TripAdvisor Travelers’ Choice 2024",
    text: "Top 10% worldwide operator excellence",
  },
  {
    icon: Trophy,
    title: "Best Tour Operator – Travel Weekly",
    text: "Honored for responsible tourism innovation",
  },
  {
    icon: Star,
    title: "Google 4.9★ Rating – 3,200+ Reviews",
    text: "Verified independent customer satisfaction",
  },
  {
    icon: Award,
    title: "IATA Certified Agency",
    text: "Highest international aviation & safety standards",
  },
  {
    icon: Leaf,
    title: "Sustainable Tourism Certified",
    text: "100% carbon-offset and local community reinvestment",
  },
];

// Mosaic gallery photos - className stays fixed per position (the layout
// mixes two tall tiles with two stacked pairs and one large centre tile), only
// the image + caption are CMS-editable.
const DEFAULT_GALLERY = [
  { image: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=600&q=80", location: "Bavaria, Germany" },
  { image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80", location: "Bali, Indonesia" },
  { image: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=600&q=80", location: "Krabi, Thailand" },
  { image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80", location: "Sydney, Australia" },
  { image: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=600&q=80", location: "Kyoto, Japan" },
  { image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=600&q=80", location: "Dubai Desert, UAE" },
  { image: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=600&q=80", location: "Tuscany, Italy" },
];

const DEFAULT_HERO = {
  badge_label: "Our Story & Purpose",
  badge_year: "Est. 2015",
  heading: "Connecting Curious Souls to Unforgettable Journeys",
  subtitle: "Tourvaa is a world-class adventure booking platform uniting travelers with vetted local tour leaders across 80+ countries. We curate small group and private expeditions designed for true cultural depth.",
  background_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
  rating_text: "4.9/5 Rating (3,200+ Reviews)",
  vetted_text: "100% Vetted Local Operators",
};

const DEFAULT_STORY = {
  eyebrow: "OUR PHILOSOPHY & MISSION",
  heading: "Crafting Journeys That Redefine Adventure",
  body: "Founded in 2015, Tourvaa began with a simple yet powerful belief: that travel should be transformative, ethical, and deeply personal. What began as a small band of explorers has flourished into a trusted global platform, empowering tens of thousands of travelers to experience hidden mountain passes, remote archipelagoes, and ancient trade routes with total confidence.",
  quote_text: "We don't build tours to check off tourist traps. We build journeys where you step off the beaten track, break bread with welcoming hosts, and return home with a transformed outlook on our shared world.",
  quote_author: "Arjun Mehta, Founder & Chief Explorer at Tourvaa",
};

const DEFAULT_VALUES_HEADING = { eyebrow: "THE TOURVAA DIFFERENCE", heading: "Why Discerning Travelers Choose Us", subtitle: "Engineered from the ground up to protect your budget, amplify your cultural immersion, and keep you safe every mile." };
const DEFAULT_TEAM_HEADING = { eyebrow: "OUR TEAM", heading: "Meet the Explorers Behind Tourvaa", subtitle: "From former expedition leaders to logistics veterans, our global team works tirelessly to ensure your journey is seamless." };
const DEFAULT_AWARDS_HEADING = { eyebrow: "CREDENTIALS & TRUST", heading: "Awards & Global Recognition", subtitle: "Trusted by international travelers and acclaimed for ethical tour operations, certified safety protocols, and guest satisfaction." };

const DEFAULT_CTA = {
  badge_text: "Your Adventure Awaits",
  heading: "Ready to Start Your Journey?",
  subtitle: "Explore our curated collection of 500+ small-group and private tours, or speak with an expedition specialist for tailor-made itineraries.",
  background_image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
  primary_cta_text: "Browse All Tours",
  primary_cta_url: "/tours",
  secondary_cta_text: "Contact Specialists",
  secondary_cta_url: "/contact",
};

type MetricItem = { value?: string; label?: string; sub?: string };
type TeamItem = { name?: string; role?: string; specialty?: string; photo?: string; bio?: string };
type ValueItem = { badge?: string; title?: string; description?: string; image?: string };
type AwardItem = { title?: string; text?: string };
type GalleryItem = { image?: string; location?: string };
type GalleryBlock = { items?: GalleryItem[] };
type MetricsBlock = { items?: MetricItem[] };
type ValuesBlock = { eyebrow?: string; heading?: string; subtitle?: string; items?: ValueItem[] };
type TeamBlock = { eyebrow?: string; heading?: string; subtitle?: string; items?: TeamItem[] };
type AwardsBlock = { eyebrow?: string; heading?: string; subtitle?: string; items?: AwardItem[] };

const VALUE_ICONS = DEFAULT_VALUES.map((v) => v.icon);
const AWARD_ICONS = DEFAULT_AWARDS.map((a) => a.icon);
const METRIC_ICON_COLOR = DEFAULT_METRICS.map((m) => ({ icon: m.icon, color: m.color }));

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

// Fetches an admin-editable content block and returns its `data`, falling
// back to `def` while loading or whenever the block is empty (see
// useSectionCopy.ts for the same pattern used on the homepage).
function useAboutBlock<T extends Record<string, unknown>>(key: string, def: T): T {
  const [data, setData] = useState<T>(def);
  useEffect(() => {
    let active = true;
    fetchContentBlock<T>(key)
      .then((res) => {
        if (active && res?.data && Object.keys(res.data).length) setData({ ...def, ...res.data });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return data;
}

export default function AboutPage() {
  const hero = useAboutBlock("about_page_hero", DEFAULT_HERO);
  const story = useAboutBlock("about_page_story", DEFAULT_STORY);
  const galleryBlock = useAboutBlock<GalleryBlock>("about_page_gallery", {});
  const metricsBlock = useAboutBlock<MetricsBlock>("about_page_metrics", {});
  const valuesHeading = useAboutBlock<ValuesBlock>("about_page_values", DEFAULT_VALUES_HEADING);
  const teamHeading = useAboutBlock<TeamBlock>("about_page_team", DEFAULT_TEAM_HEADING);
  const awardsHeading = useAboutBlock<AwardsBlock>("about_page_awards", DEFAULT_AWARDS_HEADING);
  const cta = useAboutBlock("about_page_cta", DEFAULT_CTA);

  const gallery = galleryBlock.items?.length ? galleryBlock.items.map((it, i) => ({ image: it.image || DEFAULT_GALLERY[i % DEFAULT_GALLERY.length].image, location: it.location || "" })) : DEFAULT_GALLERY;
  // Metrics are intentionally capped at four: that is the visual capacity of
  // this compact trust strip and matches the CMS editor constraint.
  const metricItems = metricsBlock.items?.slice(0, 4);
  const metrics = metricItems?.length
    ? metricItems.map((it, i) => ({ value: it.value || "", label: it.label || "", sub: it.sub || "", icon: METRIC_ICON_COLOR[i % METRIC_ICON_COLOR.length].icon, color: METRIC_ICON_COLOR[i % METRIC_ICON_COLOR.length].color }))
    : DEFAULT_METRICS;
  // This focused trust section is designed for at most five cards. Each
  // card can now bring its own CMS-managed background image.
  const valueItems = valuesHeading.items?.slice(0, 5);
  const values = valueItems?.length
    ? valueItems.map((it, i) => ({ number: String(i + 1).padStart(2, "0"), title: it.title || "", desc: it.description || "", badge: it.badge || "", icon: VALUE_ICONS[i % VALUE_ICONS.length], image: it.image || DEFAULT_VALUES[i % DEFAULT_VALUES.length].image }))
    : DEFAULT_VALUES;
  // The CMS and public layout share a five-card cap so every saved member has
  // a predictable desktop position without creating a mostly empty next row.
  const teamItems = teamHeading.items
    ?.filter((item) => Boolean(item.photo || item.name || item.role || item.specialty || item.bio))
    .slice(0, 5);
  const team = teamItems?.length
    ? teamItems.map((it, i) => ({ name: it.name || "", role: it.role || "", specialty: it.specialty || "", image: it.photo || DEFAULT_TEAM[i % DEFAULT_TEAM.length].image, bio: it.bio || "" }))
    : DEFAULT_TEAM;
  const awardItems = awardsHeading.items
    ?.filter((item) => Boolean(item.title || item.text))
    .slice(0, 5);
  const awards = awardItems?.length
    ? awardItems.map((it, i) => ({ title: it.title || "", text: it.text || "", icon: AWARD_ICONS[i % AWARD_ICONS.length] }))
    : DEFAULT_AWARDS;

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-[#FAFAFC] text-slate-900 pb-24">
        {/* ── 1. Top Cinematic Hero Landscape Banner ── */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-4 sm:pt-6">
          <section className="relative min-h-[360px] sm:min-h-[420px] md:min-h-[460px] w-full overflow-hidden rounded-[26px] bg-slate-950 shadow-xl flex items-center">
            <img
              src={hero.background_image || DEFAULT_HERO.background_image}
              alt="Misty scenic mountain valley with lake"
              className="animate-tourvaa-hero absolute inset-0 h-full w-full object-cover opacity-60 scale-105"
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

            {/* Hero Text Content */}
            <div className="relative z-10 max-w-3xl px-6 sm:px-12 py-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md shadow-xs">
                <Sparkles size={14} className="text-amber-400" />
                <span>{hero.badge_label || DEFAULT_HERO.badge_label}</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">{hero.badge_year || DEFAULT_HERO.badge_year}</span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black tracking-tight text-white font-heading leading-tight drop-shadow-md">
                {hero.heading || DEFAULT_HERO.heading}
              </h1>

              <p className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-white/85 font-medium max-w-2xl">
                {hero.subtitle || DEFAULT_HERO.subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-xs border border-white/20">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span>{hero.rating_text || DEFAULT_HERO.rating_text}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-xs border border-white/20">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>{hero.vetted_text || DEFAULT_HERO.vetted_text}</span>
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── 2. Narrative & Asymmetric Photo Mosaic ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-16 sm:pt-24">
          <div data-reveal className="mx-auto max-w-4xl text-center">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              {story.eyebrow || DEFAULT_STORY.eyebrow}
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-heading">
              {story.heading || DEFAULT_STORY.heading}
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 font-medium max-w-3xl mx-auto">
              {story.body || DEFAULT_STORY.body}
            </p>
          </div>

          {/* Mosaic Gallery - phone layout is a balanced 2-column gallery;
              the editorial mosaic begins at tablet width. */}
          <div className="mt-12 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:items-center sm:gap-4 lg:grid-cols-5">
            <div
              data-reveal
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm sm:hidden"
            >
              <img
                src={gallery[0]?.image}
                alt={gallery[0]?.location || "Gallery photo"}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                <MapPin size={10} /> {gallery[0]?.location}
              </span>
            </div>
            <div
              data-reveal
              className="hidden lg:block group relative h-[280px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
            >
              <img
                src={gallery[0]?.image}
                alt={gallery[0]?.location || "Gallery photo"}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <MapPin size={11} /> {gallery[0]?.location}
              </span>
            </div>

            <div className="contents sm:grid sm:gap-4">
              <div
                data-reveal
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm sm:h-[165px] sm:aspect-auto"
              >
                <img
                  src={gallery[1]?.image}
                  alt={gallery[1]?.location || "Gallery photo"}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> {gallery[1]?.location}
                </span>
              </div>
              <div
                data-reveal
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm sm:h-[165px] sm:aspect-auto"
              >
                <img
                  src={gallery[2]?.image}
                  alt={gallery[2]?.location || "Gallery photo"}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> {gallery[2]?.location}
                </span>
              </div>
            </div>

            <div
              data-reveal
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 shadow-md sm:h-[350px] sm:aspect-auto"
            >
              <img
                src={gallery[3]?.image}
                alt={gallery[3]?.location || "Gallery photo"}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <MapPin size={11} /> {gallery[3]?.location}
              </span>
            </div>

            <div className="contents sm:grid sm:gap-4">
              <div
                data-reveal
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm sm:h-[165px] sm:aspect-auto"
              >
                <img
                  src={gallery[4]?.image}
                  alt={gallery[4]?.location || "Gallery photo"}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> {gallery[4]?.location}
                </span>
              </div>
              <div
                data-reveal
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm sm:h-[165px] sm:aspect-auto"
              >
                <img
                  src={gallery[5]?.image}
                  alt={gallery[5]?.location || "Gallery photo"}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> {gallery[5]?.location}
                </span>
              </div>
            </div>

            <div
              data-reveal
              className="hidden lg:block group relative h-[280px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
            >
              <img
                src={gallery[6]?.image}
                alt={gallery[6]?.location || "Gallery photo"}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <MapPin size={11} /> {gallery[6]?.location}
              </span>
            </div>
          </div>

          {/* Inspirational Founder Quote Card */}
          <div data-reveal className="mt-10 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/70 via-white to-sky-50/40 p-6 sm:p-8 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3A] text-white shadow-2xs">
                <Quote size={18} />
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium italic leading-relaxed text-slate-800">
                  &ldquo;{story.quote_text || DEFAULT_STORY.quote_text}&rdquo;
                </p>
                <p className="mt-2 text-xs font-bold text-pub-secondary">
                  - {story.quote_author || DEFAULT_STORY.quote_author}
                </p>
              </div>
            </div>
          </div>

          {/* Up to four metric cards. Partial rows are deliberately centred. */}
          <div className={`mt-10 grid gap-4 sm:gap-6 ${
            metrics.length === 1
              ? "mx-auto max-w-sm grid-cols-1"
              : metrics.length === 2
                ? "mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2"
                : metrics.length === 3
                  ? "mx-auto max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}>
            {metrics.map((m, index) => {
              const Icon = m.icon;
              return (
                <div
                  key={index}
                  data-reveal
                  style={delay(index * 60)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 font-heading">
                      {m.value}
                    </span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.color}`}>
                      <Icon size={20} />
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-900 leading-snug">
                    {m.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">
                    {m.sub}
                  </div>
                  <div className="mt-4 h-1 w-12 rounded-full bg-pub-secondary/40 group-hover:w-full group-hover:bg-pub-secondary transition-all duration-300" />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Why Choose Tourvaa (up to 3 premium value cards) ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-20 sm:pt-28">
          <div data-reveal className="text-center">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              {valuesHeading.eyebrow || DEFAULT_VALUES_HEADING.eyebrow}
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-heading">
              {valuesHeading.heading || DEFAULT_VALUES_HEADING.heading}
            </h2>
            <p className="mt-3 text-sm text-slate-600 font-medium max-w-xl mx-auto">
              {valuesHeading.subtitle || DEFAULT_VALUES_HEADING.subtitle}
            </p>
          </div>

          <div className={`mt-12 grid gap-5 ${
            values.length === 1
              ? "mx-auto max-w-sm grid-cols-1"
              : values.length === 2
                ? "mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2"
                : values.length === 3
                  ? "mx-auto max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : values.length === 4
                    ? "mx-auto max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          }`}>
            {values.map((v, index) => {
              const Icon = v.icon;

              return (
                <div
                  key={v.number}
                  data-reveal
                  style={delay(index * 60)}
                  tabIndex={0}
                  className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:border-slate-700 hover:shadow-lg focus-visible:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  <img
                    src={v.image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-slate-900/65 via-slate-900/70 to-[#0B1F3A]/95 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-3xl font-black text-slate-300 transition-colors duration-300 group-hover:text-orange-400 group-focus-visible:text-orange-400 font-heading">
                      {v.number}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white group-focus-visible:bg-white/20 group-focus-visible:text-white group-hover:backdrop-blur-xs group-focus-visible:backdrop-blur-xs">
                      {v.badge}
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto pt-8">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white group-focus-visible:bg-white/20 group-focus-visible:text-white group-hover:backdrop-blur-xs group-focus-visible:backdrop-blur-xs">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-base font-bold leading-tight text-slate-950 transition-colors duration-300 group-hover:text-white group-focus-visible:text-white font-heading">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-xs font-normal leading-relaxed text-slate-600 transition-colors duration-300 group-hover:!text-white group-focus-visible:!text-white">
                      {v.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. Meet the Leadership & Curators ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-20 sm:pt-28">
          <div data-reveal>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              {teamHeading.eyebrow || DEFAULT_TEAM_HEADING.eyebrow}
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-heading">
              {teamHeading.heading || DEFAULT_TEAM_HEADING.heading}
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-medium max-w-xl">
              {teamHeading.subtitle || DEFAULT_TEAM_HEADING.subtitle}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            {team.map((member, index) => (
              <div
                key={index}
                data-reveal
                style={delay(index * 60)}
                className="group w-full sm:basis-[calc(50%-0.625rem)] lg:basis-[calc(20%-1rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                <div className="relative h-60 w-full overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                    {member.specialty}
                  </span>
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-base font-bold text-slate-950 font-heading">
                    {member.name}
                  </h3>
                  <p className="text-xs font-bold text-sky-700 mt-0.5">
                    {member.role}
                  </p>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Awards & Industry Recognition ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-14 sm:pt-28">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-pub-secondary sm:text-sm sm:tracking-wider">
              {awardsHeading.eyebrow || DEFAULT_AWARDS_HEADING.eyebrow}
            </span>
            <h2 className="mt-2 text-[1.65rem] font-black leading-tight tracking-tight text-slate-950 font-heading sm:text-3xl">
              {awardsHeading.heading || DEFAULT_AWARDS_HEADING.heading}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              {awardsHeading.subtitle || DEFAULT_AWARDS_HEADING.subtitle}
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-4 min-[480px]:max-w-none min-[480px]:grid-cols-2 sm:mt-10 sm:grid-cols-3 lg:grid-cols-5">
            {awards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  data-reveal
                  style={delay(index * 60)}
                  className="flex min-w-0 flex-col items-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 text-base font-bold leading-snug text-slate-950 font-heading sm:text-sm">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 sm:text-xs">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. Bottom Hero CTA ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-16 sm:pt-24">
          <div
            data-reveal="scale"
            className="relative flex min-h-[320px] sm:min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-[26px] bg-[#0B1F3A] p-8 text-center text-white shadow-xl"
          >
            <img
              src={cta.background_image || DEFAULT_CTA.background_image}
              alt="Sunset mountain lake vista"
              className="absolute inset-0 h-full w-full object-cover opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />

            <div className="relative z-10 max-w-2xl">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs mb-3">
                {cta.badge_text || DEFAULT_CTA.badge_text}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-heading drop-shadow-md">
                {cta.heading || DEFAULT_CTA.heading}
              </h2>
              <p className="mt-3 text-xs sm:text-sm md:text-base text-white/90 font-medium leading-relaxed max-w-xl mx-auto">
                {cta.subtitle || DEFAULT_CTA.subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  href={cta.primary_cta_url || DEFAULT_CTA.primary_cta_url}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-slate-100 hover:-translate-y-0.5"
                >
                  <span>{cta.primary_cta_text || DEFAULT_CTA.primary_cta_text}</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href={cta.secondary_cta_url || DEFAULT_CTA.secondary_cta_url}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-black/30 backdrop-blur-xs px-6 text-sm font-bold text-white shadow-md transition hover:bg-white/20"
                >
                  {cta.secondary_cta_text || DEFAULT_CTA.secondary_cta_text}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AboutReveal>
  );
}
