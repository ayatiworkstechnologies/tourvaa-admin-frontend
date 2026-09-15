"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCompass as Compass,
  LuGlobe as Globe,
  LuMapPin as MapPin,
  LuSearch as Search,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuCalendar as Calendar,
  LuX as X,
  LuMountain as Mountain,
  LuTreePalm as TreePalm,
  LuLandmark as Landmark,
  LuUtensils as Utensils,
  LuTrainFront as TrainFront,
  LuBinoculars as Binoculars,
  LuSquareCheckBig as SquareCheckBig,
  LuBookOpen as BookOpen,
} from "react-icons/lu";
import {
  fetchFavouriteCountries,
  fetchPopularDestinations,
  fetchPublicCountries,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";

// Master Destination Country with region and snippet
export interface CountryCardItem {
  name: string;
  badge?: string;
  region: "Asia" | "Europe" | "Americas" | "Africa & Middle East" | "Oceania";
  image: string;
  snippet: string;
  href?: string;
  guideSlug?: string;
  tourCount?: number;
}

// ── Default 28 Countries, starting with the exact 8 from user's screenshot ──
const MASTER_DESTINATION_COUNTRIES: CountryCardItem[] = [
  {
    name: "Morocco",
    badge: "Morocco",
    region: "Africa & Middle East",
    image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=900&q=80",
    snippet: "Trek the Sahara aboard a camel. Browse the vibrant souks of Marrakech. Uncover the imperial cities.",
    guideSlug: "morocco",
  },
  {
    name: "Egypt",
    badge: "Egypt",
    region: "Africa & Middle East",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=900&q=80",
    snippet: "Our best-selling destination! Cruise the Nile, marvel at the Pyramids, explore the tombs of Luxor.",
    guideSlug: "egypt",
  },
  {
    name: "Iceland",
    badge: "Iceland",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=900&q=80",
    snippet: "Iceland in winter is home to the Northern Lights, while in summer the waterfalls are breathtaking.",
    guideSlug: "iceland",
  },
  {
    name: "Sri Lanka",
    badge: "Sri Lanka",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=80",
    snippet: "Sri Lanka's Cultural Triangle offers such attractions as the Sigiriya Fortress and Dambulla caves.",
    guideSlug: "sri-lanka",
  },
  {
    name: "Turkey",
    badge: "Turkey",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80",
    snippet: "From the city in two continents, Istanbul, to the cave cities of Cappadocia, make Turkey your next trip.",
    guideSlug: "turkey",
  },
  {
    name: "India",
    badge: "India",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=80",
    snippet: "First timers to India will want to take in the Golden Triangle of Delhi, Jaipur and Agra.",
    guideSlug: "india",
  },
  {
    name: "Vietnam",
    badge: "Vietnam",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
    snippet: "Visitors to Vietnam can cruise Halong Bay. They can ride a rickshaw around Hanoi. And so much more.",
    guideSlug: "vietnam",
  },
  {
    name: "China",
    badge: "China",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80",
    snippet: "Walk the Great Wall, stand before the Terracotta Army, and explore the Forbidden City.",
    guideSlug: "china",
  },
  {
    name: "New Zealand",
    badge: "New Zealand",
    region: "Oceania",
    image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=900&q=80",
    snippet: "Explore dramatic alpine fjords, pristine glaciers, geothermal geysers, and rich Maori culture.",
    guideSlug: "new-zealand",
  },
  {
    name: "Thailand",
    badge: "Thailand",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=900&q=80",
    snippet: "Tropical islands, gilded Buddhist temples, vibrant floating night bazaars, and world-class street food.",
    guideSlug: "thailand",
  },
  {
    name: "Italy",
    badge: "Italy",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80",
    snippet: "Renaissance art masterpieces, sun-drenched Amalfi cliffs, Tuscan vineyards, and ancient Roman ruins.",
    guideSlug: "italy",
  },
  {
    name: "Spain",
    badge: "Spain",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=900&q=80",
    snippet: "Sun-soaked Mediterranean plazas, Moorish palace courtyards, tapas culture, and passionate flamenco.",
    guideSlug: "spain",
  },
  {
    name: "Japan",
    badge: "Japan",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
    snippet: "Sleek bullet trains, ancient Kyoto shrines, Mount Fuji vistas, and serene cherry blossom gardens.",
    guideSlug: "japan",
  },
  {
    name: "Switzerland",
    badge: "Switzerland",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=900&q=80",
    snippet: "Glide across emerald lakes, ride alpine scenic railways, and hike beneath the iconic Matterhorn peak.",
    guideSlug: "switzerland",
  },
  {
    name: "Australia",
    badge: "Australia",
    region: "Oceania",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=80",
    snippet: "Snorkel the Great Barrier Reef, explore the Red Centre Outback, and cruise beneath Sydney Harbour Bridge.",
    guideSlug: "australia",
  },
  {
    name: "Canada",
    badge: "Canada",
    region: "Americas",
    image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=900&q=80",
    snippet: "Marvel at turquoise glacial lakes, towering Rocky Mountain peaks, and vast untamed boreal wilderness.",
    guideSlug: "canada",
  },
  {
    name: "United States",
    badge: "United States",
    region: "Americas",
    image: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=900&q=80",
    snippet: "Epic cross-country road trips, world-famous national parks, dramatic canyons, and legendary skylines.",
    guideSlug: "united-states",
  },
  {
    name: "Greece",
    badge: "Greece",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=80",
    snippet: "Iconic whitewashed Aegean villages, cobalt-blue domes, ancient Classical ruins, and azure island waters.",
    guideSlug: "greece",
  },
  {
    name: "France",
    badge: "France",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
    snippet: "Fairytale Loire châteaux, fragrant Provence lavender fields, world-class gastronomy, and romantic Paris.",
    guideSlug: "france",
  },
  {
    name: "United Arab Emirates",
    badge: "United Arab Emirates",
    region: "Africa & Middle East",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
    snippet: "Futuristic skyscrapers, golden desert dunes, luxury dhow cruises, and grand marble mosques.",
    guideSlug: "united-arab-emirates",
  },
  {
    name: "Singapore",
    badge: "Singapore",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80",
    snippet: "Gardens by the Bay supertrees, multicultural heritage quarters, and legendary street food hawker markets.",
    guideSlug: "singapore",
  },
  {
    name: "United Kingdom",
    badge: "United Kingdom",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80",
    snippet: "Historic royal castles, sweeping Scottish Highlands, mystery stone circles, and cozy village taverns.",
    guideSlug: "united-kingdom",
  },
  {
    name: "Portugal",
    badge: "Portugal",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
    snippet: "Sunlit coastal cliffs, vintage Lisbon trams, Douro wine valleys, and golden Algarve sea caves.",
    guideSlug: "portugal",
  },
  {
    name: "Ireland",
    badge: "Ireland",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&w=900&q=80",
    snippet: "Dramatic Atlantic sea cliffs, emerald rolling hills, ancient Celtic castles, and lively folk music.",
    guideSlug: "ireland",
  },
  {
    name: "Croatia",
    badge: "Croatia",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80",
    snippet: "Medieval Adriatic walled citadels, sapphire blue island bays, and thousand-island sailing cruises.",
    guideSlug: "croatia",
  },
  {
    name: "Norway",
    badge: "Norway",
    region: "Europe",
    image: "https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?auto=format&fit=crop&w=900&q=80",
    snippet: "Deep Norwegian fjords, Arctic wildlife, the Midnight Sun, and magical winter Northern Lights.",
    guideSlug: "norway",
  },
  {
    name: "Indonesia",
    badge: "Indonesia",
    region: "Asia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    snippet: "Lush Ubud rice terraces, sacred volcanic water temples, and pristine Komodo island waters.",
    guideSlug: "indonesia",
  },
  {
    name: "Qatar",
    badge: "Qatar",
    region: "Africa & Middle East",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80",
    snippet: "Museum of Islamic Art, vibrant Souq Waqif alleys, Arabian Gulf boat tours, and desert dune safaris.",
    guideSlug: "qatar",
  },
];

// Region Tabs
const REGIONS = [
  "All Destinations",
  "Asia",
  "Europe",
  "Americas",
  "Africa & Middle East",
  "Oceania",
] as const;

type RegionTab = (typeof REGIONS)[number];

// Travel Styles
const TRAVEL_STYLES = [
  {
    title: "Alpine & Mountain Expeditions",
    subtitle: "Soaring glacial summits, high-altitude passes & dramatic fjords",
    countries: "New Zealand • Switzerland • Canada",
    icon: Mountain,
    badge: "Epic Nature",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    href: "/tours?tag=Alpine",
  },
  {
    title: "Tropical Isles & Coastal Havens",
    subtitle: "Turquoise lagoons, coral reefs, palms & barefoot relaxation",
    countries: "Thailand • Indonesia • Greece • Spain",
    icon: TreePalm,
    badge: "Sun & Sea",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    href: "/tours?tag=Beach",
  },
  {
    title: "Ancient Civilizations & Wonders",
    subtitle: "Sacred temples, pharaoh tombs, marble palaces & ruins",
    countries: "India • Egypt • Italy • Greece",
    icon: Landmark,
    badge: "Heritage",
    image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&w=800&q=80",
    href: "/tours?tag=Cultural",
  },
  {
    title: "Wild Safaris & Natural Reserves",
    subtitle: "Royal Bengal tigers, the Big Five, marine life & outback fauna",
    countries: "India • Kenya • Australia • Canada",
    icon: Binoculars,
    badge: "Wildlife",
    image: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80",
    href: "/tours?tag=Safari",
  },
  {
    title: "Culinary & Cultural Odysseys",
    subtitle: "Street food markets, centuries-old wine estates & traditions",
    countries: "Japan • Italy • France • Spain",
    icon: Utensils,
    badge: "Food & Wine",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    href: "/tours?tag=Food",
  },
  {
    title: "Scenic Rail & Epic Road Trips",
    subtitle: "World-renowned rail routes and sweeping coastal highways",
    countries: "New Zealand • Switzerland • United Kingdom",
    icon: TrainFront,
    badge: "Grand Journeys",
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80",
    href: "/tours?tag=Rail",
  },
];

// Seasonal Guide
const SEASONS = [
  {
    season: "Spring (March - May)",
    tagline: "Blooming landscapes, mild temperatures & vibrant city life",
    topPicks: ["Japan (Cherry Blossoms)", "Italy (Spring In Tuscany)", "Spain & Portugal", "Himalayan Foothills"],
    icon: "🌸",
    color: "from-rose-50 to-pink-50 border-rose-200/80 text-rose-900",
  },
  {
    season: "Summer (June - August)",
    tagline: "Alpine hiking, Midnight Sun & coastal exploration",
    topPicks: ["Switzerland (Matterhorn Trails)", "Canadian Rockies", "Norway (Fjords)", "United Kingdom & Ireland"],
    icon: "☀️",
    color: "from-amber-50 to-orange-50 border-amber-200/80 text-amber-900",
  },
  {
    season: "Autumn (September - November)",
    tagline: "Golden foliage, pleasant weather & harvesting festivals",
    topPicks: ["India (Golden Triangle & Festivals)", "Morocco (Sahara Treks)", "Greece & Mediterranean", "Japan (Autumn Leaves)"],
    icon: "🍂",
    color: "from-orange-50 to-red-50 border-orange-200/80 text-orange-900",
  },
  {
    season: "Winter (December - February)",
    tagline: "Southern hemisphere warmth, ski wonderlands & desert escapes",
    topPicks: ["New Zealand (Summer Adventures)", "Thailand & Southeast Asia", "UAE & Qatar (Desert Glamping)", "Australia (Coastal Tours)"],
    icon: "❄️",
    color: "from-sky-50 to-blue-50 border-sky-200/80 text-sky-900",
  },
];

export default function DestinationsPage() {
  const [countriesList, setCountriesList] = useState<CountryCardItem[]>(
    MASTER_DESTINATION_COUNTRIES,
  );
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<RegionTab>("All Destinations");

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetchPublicCountries(),
      fetchFavouriteCountries(),
      fetchPopularDestinations(),
    ])
      .then(([publicCountriesRes, favRes, popDestRes]) => {
        if (!active) return;

        const publicCountries =
          publicCountriesRes.status === "fulfilled" && Array.isArray(publicCountriesRes.value)
            ? publicCountriesRes.value
            : [];

        const favCountries =
          favRes.status === "fulfilled" && Array.isArray(favRes.value)
            ? favRes.value.filter((r) => r.is_active !== false)
            : [];

        const popDestinations =
          popDestRes.status === "fulfilled" && Array.isArray(popDestRes.value)
            ? popDestRes.value.filter((d) => d.is_active !== false)
            : [];

        // Build quick lookup maps
        const tourCountByName = new Map<string, number>();
        publicCountries.forEach((c) => {
          tourCountByName.set(c.country_name.toLowerCase().trim(), c.tour_count || 0);
        });

        const cmsSnippetByName = new Map<string, string>();
        const cmsImageByName = new Map<string, string>();

        favCountries.forEach((f) => {
          if (f.title) {
            const key = f.title.toLowerCase().trim();
            if (f.snippet) cmsSnippetByName.set(key, f.snippet);
            if (f.image) cmsImageByName.set(key, mediaUrl(f.image));
          }
        });

        popDestinations.forEach((d) => {
          if (d.title) {
            const key = d.title.toLowerCase().trim();
            if (d.description && !cmsSnippetByName.has(key)) {
              cmsSnippetByName.set(key, d.description);
            }
            if (d.image && !cmsImageByName.has(key)) {
              cmsImageByName.set(key, mediaUrl(d.image));
            }
          }
        });

        // Update default master list with CMS / API data
        setCountriesList((prev) =>
          prev.map((item) => {
            const key = item.name.toLowerCase().trim();
            const liveCount = tourCountByName.get(key);
            const cmsSnippet = cmsSnippetByName.get(key);
            const cmsImage = cmsImageByName.get(key);

            return {
              ...item,
              tourCount: liveCount !== undefined ? liveCount : item.tourCount,
              snippet: cmsSnippet || item.snippet,
              image: cmsImage || item.image,
              href: `/tours?country=${encodeURIComponent(item.name)}`,
            };
          }),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filter countries by search query and region tab
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();

    return countriesList.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.snippet.toLowerCase().includes(q);

      const matchesRegion =
        selectedRegion === "All Destinations" || c.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [countriesList, search, selectedRegion]);

  // Region counts for badges
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "All Destinations": countriesList.length,
    };
    REGIONS.forEach((reg) => {
      if (reg !== "All Destinations") {
        counts[reg] = countriesList.filter((c) => c.region === reg).length;
      }
    });
    return counts;
  }, [countriesList]);

  return (
    <main className="min-h-screen bg-[#FAFAFB] text-slate-900 pb-24 selection:bg-orange-500 selection:text-white">
      {/* ── 1. Hero Landscape Section ── */}
      <section className="relative overflow-hidden bg-[#071B26] text-white">
        {/* Background Image with Ambient Glow */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=85"
            alt="World Travel Destinations"
            className="h-full w-full object-cover object-center opacity-30 scale-105 transform animate-in fade-in duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071B26] via-[#071B26]/85 to-[#05141D]/95" />
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
        </div>

        <div className="relative mx-auto max-w-[1380px] px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-20">
          <div className="max-w-3xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-200 backdrop-blur-md shadow-xs">
              <Sparkles size={13} className="text-orange-400" />
              <span>Explore 70+ Countries &amp; 2,500+ Curated Adventures</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white">
              Where will your story take you next?{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Explore the world.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm sm:text-base font-normal leading-relaxed text-slate-300 max-w-2xl">
              Explore the destinations travellers love most, from sun-soaked coastlines and Sahara dunes to iconic cultural gems, ancient temples, and unforgettable alpine tours.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative flex items-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/40 transition focus-within:bg-white focus-within:border-white focus-within:shadow-sky-950/20 group">
              <Search
                size={20}
                className="ml-3 text-white/70 group-focus-within:text-slate-700 shrink-0"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country (e.g. Morocco, Egypt, Iceland, India, New Zealand)..."
                className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-white group-focus-within:text-slate-900 placeholder:text-white/60 group-focus-within:placeholder:text-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mr-2 flex items-center gap-1 rounded-lg bg-black/20 group-focus-within:bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-white group-focus-within:text-slate-700 hover:opacity-80 cursor-pointer"
                >
                  <X size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Trending Quick Chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs text-white/75 font-medium">
              <span className="text-slate-400 font-semibold text-[11px] mr-1">Trending:</span>
              {["Morocco", "Egypt", "Iceland", "Sri Lanka", "Turkey", "India", "New Zealand", "Thailand"].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setSearch(chip);
                      setSelectedRegion("All Destinations");
                    }}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-xs transition hover:bg-white/25 hover:text-white cursor-pointer"
                  >
                    {chip}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-400 backdrop-blur-md">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-base sm:text-lg font-black text-white">70+ Countries</p>
                <p className="text-[11px] text-slate-300 font-medium">Worldwide Destinations</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sky-400 backdrop-blur-md">
                <Compass size={20} />
              </div>
              <div>
                <p className="text-base sm:text-lg font-black text-white">2,500+ Tours</p>
                <p className="text-[11px] text-slate-300 font-medium">Multi-Day Packages</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-400 backdrop-blur-md">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-base sm:text-lg font-black text-white">100% Protected</p>
                <p className="text-[11px] text-slate-300 font-medium">Escrow Milestone Payments</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-amber-400 backdrop-blur-md">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-base sm:text-lg font-black text-white">Verified Guides</p>
                <p className="text-[11px] text-slate-300 font-medium">Vetted Local Operators</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Sticky Continent & Region Filter Bar ── */}
      <section className="sticky top-0 z-30 border-y border-slate-200/80 bg-white/95 backdrop-blur-md py-3.5 shadow-xs">
        <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-2 shrink-0">
              {REGIONS.map((region) => {
                const isActive = selectedRegion === region;
                const count = regionCounts[region] || 0;

                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setSelectedRegion(region)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#0A1128] text-white shadow-md shadow-slate-900/15"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    }`}
                  >
                    <span>{region}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="hidden md:block text-xs font-semibold text-slate-500 shrink-0">
              Showing <strong className="text-slate-900 font-black">{filteredCountries.length}</strong> countries
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Main Country Cards Grid (Exact Design Matching Screenshot) ── */}
      <section className="mx-auto max-w-[1380px] px-5 sm:px-8 pt-10 sm:pt-14">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">
            {search
              ? `Countries matching "${search}"`
              : selectedRegion === "All Destinations"
              ? "Favourite Countries for Travellers"
              : `Top Countries in ${selectedRegion}`}
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl mx-auto">
            Explore the destinations travellers love most, from sun-soaked coastlines to iconic cultural gems and unforgettable experiences.
          </p>
        </div>

        {/* 4 Country Cards per Row Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[420px] rounded-[20px] bg-slate-200/80 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCountries.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {filteredCountries.map((country) => {
              const toursUrl =
                country.href || `/tours?country=${encodeURIComponent(country.name)}`;
              const guideSlug = country.guideSlug || slugifyTourSegment(country.name);

              return (
                <div
                  key={country.name}
                  className="group relative h-[420px] w-full overflow-hidden rounded-[20px] bg-white p-4 border border-slate-200/80 shadow-xs transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-slate-300 hover:shadow-lg hover:-translate-y-1.5 focus:outline-none flex flex-col"
                >
                  {/* Clickable Card Link to Country Tours */}
                  <Link
                    href={toursUrl}
                    className="relative h-full w-full overflow-hidden rounded-[16px] bg-slate-900 block focus:outline-none"
                  >
                    {/* Inner Image with 16px radius */}
                    <img
                      src={country.image}
                      alt={country.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Gradient overlays for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/15 pointer-events-none" />

                    {/* Top-Left Location Badge (Exact Orange Pill with MapPin) */}
                    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <MapPin size={11} className="shrink-0 text-white" />
                      <span>{country.badge || country.name}</span>
                    </span>

                    {/* Top-Right Optional Guide Link */}
                    {guideSlug && (
                      <Link
                        href={`/destinations/${guideSlug}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`View ${country.name} Destination Guide`}
                        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white/90 hover:text-white transition shadow-xs"
                      >
                        <BookOpen size={10} />
                        <span>Guide</span>
                      </Link>
                    )}

                    {/* Bottom Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 text-left">
                      <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight drop-shadow-sm transition-colors duration-200 group-hover:text-pub-secondary">
                        {`${country.name} tours`}
                      </h3>
                      <div className="mt-2.5 flex items-start gap-2 text-xs text-white/90 leading-relaxed font-medium">
                        <SquareCheckBig
                          size={14}
                          className="mt-0.5 shrink-0 text-orange-400 stroke-[2.2] transition-transform duration-300 group-hover:scale-110 group-hover:text-pub-secondary"
                        />
                        <p className="line-clamp-3 text-white/90 drop-shadow">
                          {country.snippet}
                        </p>
                      </div>

                      {/* Bottom view tours micro link */}
                      <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-[11px] font-bold text-white/80 group-hover:text-white transition">
                        <span>Explore {country.name} Packages</span>
                        <ArrowRight size={12} className="transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <MapPin size={28} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No destinations found for &ldquo;{search}&rdquo;
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              We couldn&apos;t find any country matching your search. Try another query or reset the filters to view all favourite countries.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedRegion("All Destinations");
              }}
              className="mt-5 rounded-full bg-[#0A1128] px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ── 4. Explore Destinations by Travel Style ── */}
      <section className="mx-auto max-w-[1380px] px-5 sm:px-8 pt-16 sm:pt-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-orange-600">
            <Compass size={14} />
            <span>Curated Experiences</span>
          </div>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Explore Destinations by Travel Style
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Whether you crave rugged alpine summits, pristine tropical beaches, or ancient temple wonders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAVEL_STYLES.map((style) => {
            const Icon = style.icon;
            return (
              <Link
                key={style.title}
                href={style.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-xs transition duration-300 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={style.image}
                    alt={style.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-106"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />

                  <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-900 shadow-sm">
                    <Icon size={12} className="text-orange-500" />
                    <span>{style.badge}</span>
                  </span>

                  <div className="absolute inset-x-4 bottom-3">
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {style.title}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {style.subtitle}
                    </p>
                    <p className="mt-2 text-[11px] font-bold text-sky-700">
                      Popular: {style.countries}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-sky-700">
                    <span>Browse Style Tours</span>
                    <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 5. Seasonal Travel Calendar ── */}
      <section className="mx-auto max-w-[1380px] px-5 sm:px-8 pt-16 sm:pt-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-700">
            <Calendar size={14} />
            <span>Seasonal Travel Calendar</span>
          </div>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            When is the Best Time to Travel?
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Plan your holidays around optimal weather windows, wildlife migrations, and cultural festivals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SEASONS.map((season) => (
            <div
              key={season.season}
              className={`rounded-[22px] border p-6 bg-gradient-to-b ${season.color} shadow-xs transition hover:shadow-md`}
            >
              <div className="text-2xl">{season.icon}</div>
              <h3 className="mt-3 text-base font-black tracking-tight text-slate-950">
                {season.season}
              </h3>
              <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed">
                {season.tagline}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Ideal Destinations:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs font-semibold text-slate-800">
                  {season.topPicks.map((pick) => (
                    <li key={pick} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-900 shrink-0" />
                      <span>{pick}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Why Book Destinations with Tourvaa ── */}
      <section className="mx-auto max-w-[1380px] px-5 sm:px-8 pt-16 sm:pt-20">
        <div className="rounded-[26px] border border-slate-200/90 bg-white p-8 sm:p-12 shadow-xs">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">
              The Tourvaa Standard
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Why Explore Destinations with Tourvaa?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              We take the uncertainty out of global travel so you can immerse yourself fully in every country.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col justify-between rounded-2xl bg-slate-50/80 p-5 border border-slate-100">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Globe size={20} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-950">
                  2,500+ Handpicked Tours
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                  Compare multi-day group and private itineraries across 70+ destinations from the world&apos;s leading licensed operators.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-slate-50/80 p-5 border border-slate-100">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-950">
                  100% Financial Protection
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                  Bank-grade encryption, escrow payment protection, and transparent cancellation policies ensure complete peace of mind.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-slate-50/80 p-5 border border-slate-100">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Compass size={20} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-950">
                  Vetted Local Guides
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                  Travel with licensed local leaders who bring authentic culture, history, and secret vantage points to life.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-slate-50/80 p-5 border border-slate-100">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Sparkles size={20} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-950">
                  24/7 Global On-Trip Care
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                  Our emergency travel specialists and virtual assistant Scout are on standby 24/7 before, during, and after your adventure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Custom Travel Consultation Banner ── */}
      <section className="mx-auto max-w-[1380px] px-5 sm:px-8 pt-12 sm:pt-16">
        <div className="relative overflow-hidden rounded-[26px] bg-[#0A1128] p-8 sm:p-12 text-white shadow-xl">
          {/* Subtle scenic backdrop */}
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
            alt="Scenic landscape"
            className="absolute inset-y-0 right-0 hidden md:block w-1/2 h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1128] via-[#0A1128]/95 to-transparent" />

          <div className="relative max-w-xl">
            <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
              Bespoke Trip Planning
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Can&apos;t decide which destination fits your dream vacation?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Our travel specialists know these countries inside out. We can help you tailor an itinerary, choose the right departure season, and match you with the best licensed local operator.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-6 py-3 shadow-lg shadow-orange-500/25 transition"
              >
                <span>Plan My Custom Trip</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-6 py-3 backdrop-blur-xs transition"
              >
                <span>Browse All 2,500+ Tours</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
