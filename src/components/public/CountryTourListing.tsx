"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuArrowRight as ArrowRight,
  LuCalendar as Calendar,
  LuChevronDown as ChevronDown,
  LuClock as Clock,
  LuCompass as Compass,
  LuHeart as Heart,
  LuHouse as Home,
  LuLayoutGrid as LayoutGrid,
  LuList as List,
  LuMap as MapIcon,
  LuMapPin as MapPin,
  LuRotateCcw as RotateCcw,
  LuSlidersHorizontal as Sliders,
  LuStar as Star,
  LuUser as User,
  LuUsers as Users,
  LuX as X,
} from "react-icons/lu";
import { fetchPublicCategories, fetchPublicCountries, fetchPublicTours, PublicTour } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl, slugifyTourSegment } from "@/lib/utils/tourUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";

type TourItem = {
  id: number | string;
  title: string;
  location: string;
  duration: string;
  days: number;
  route: string;
  guideType: string;
  tourType?: string;
  travelStyle?: string;
  rating?: number;
  inclusions?: string[];
  maxGroup: number;
  minAge: number;
  maxAge: number;
  cities: string;
  departures: { date: string; price: string }[];
  originalPrice: string;
  price: string;
  rawPrice: number;
  currency?: string;
  image: string;
  slug?: string;
  country_name?: string;
};

const WORLD_TOURS: TourItem[] = [
  {
    id: 1,
    title: "New Zealand Explorer",
    location: "New Zealand",
    duration: "6D | 5N",
    days: 6,
    route: "Auckland > Queenstown",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Adventure",
    rating: 4.9,
    inclusions: ["hotel", "meals", "guide"],
    maxGroup: 24,
    minAge: 14,
    maxAge: 49,
    cities: "Auckland, Queenstown +4 More",
    departures: [
      { date: "2 Sep 26", price: "$1,120" },
      { date: "3 Sep 26", price: "$1,140" },
      { date: "4 Sep 26", price: "$1,122" },
    ],
    originalPrice: "$1,350",
    price: "$1,182",
    rawPrice: 1182,
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Southern Alps & Fjordlands Adventure",
    location: "New Zealand",
    duration: "6D | 5N",
    days: 6,
    route: "Christchurch > Queenstown",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Adventure",
    rating: 4.8,
    inclusions: ["hotel", "meals"],
    maxGroup: 20,
    minAge: 14,
    maxAge: 55,
    cities: "Christchurch, Mt Cook, Queenstown",
    departures: [
      { date: "5 Sep 26", price: "$1,150" },
      { date: "12 Sep 26", price: "$1,180" },
      { date: "19 Sep 26", price: "$1,160" },
    ],
    originalPrice: "$1,390",
    price: "$1,182",
    rawPrice: 1182,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Bali Island Hopper",
    location: "Indonesia",
    duration: "8D | 7N",
    days: 8,
    route: "Denpasar > Ubud",
    guideType: "Semi Guided",
    tourType: "Private",
    travelStyle: "Relaxation",
    rating: 4.7,
    inclusions: ["hotel", "meals", "flights"],
    maxGroup: 18,
    minAge: 21,
    maxAge: 59,
    cities: "Ubud, Seminyak +3 More",
    departures: [
      { date: "10 Oct 26", price: "$980" },
      { date: "15 Oct 26", price: "$1,020" },
      { date: "22 Oct 26", price: "$995" },
    ],
    originalPrice: "$1,299",
    price: "$1,182",
    rawPrice: 1182,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Japan Heritage Trail",
    location: "Japan",
    duration: "10D | 9N",
    days: 10,
    route: "Tokyo > Kyoto",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Cultural",
    rating: 4.9,
    inclusions: ["hotel", "meals", "guide"],
    maxGroup: 16,
    minAge: 10,
    maxAge: 60,
    cities: "Tokyo, Osaka, Kyoto +2 More",
    departures: [
      { date: "4 Nov 26", price: "$2,450" },
      { date: "12 Nov 26", price: "$2,380" },
      { date: "19 Nov 26", price: "$2,510" },
    ],
    originalPrice: "$1,450",
    price: "$1,123",
    rawPrice: 1123,
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "Iceland Northern Lights",
    location: "Iceland",
    duration: "5D | 4N",
    days: 5,
    route: "Reykjavik > Vik",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Adventure",
    rating: 4.9,
    inclusions: ["hotel", "meals", "guide"],
    maxGroup: 12,
    minAge: 18,
    maxAge: 55,
    cities: "Reykjavik, Vik +2 More",
    departures: [
      { date: "1 Dec 26", price: "$1,850" },
      { date: "8 Dec 26", price: "$1,920" },
      { date: "14 Dec 26", price: "$1,850" },
    ],
    originalPrice: "$1,370",
    price: "$1,182",
    rawPrice: 1182,
    image: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    title: "Machu Picchu Trek",
    location: "Peru",
    duration: "7D | 6N",
    days: 7,
    route: "Lima > Cusco",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Adventure",
    rating: 4.8,
    inclusions: ["hotel", "meals", "guide"],
    maxGroup: 20,
    minAge: 19,
    maxAge: 55,
    cities: "Lima, Cusco +2 More",
    departures: [
      { date: "18 Aug 26", price: "$1,650" },
      { date: "24 Aug 26", price: "$1,720" },
      { date: "1 Sep 26", price: "$1,680" },
    ],
    originalPrice: "$1,850",
    price: "$1,581",
    rawPrice: 1581,
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 7,
    title: "Sahara Desert Expedition",
    location: "Morocco",
    duration: "9D | 8N",
    days: 9,
    route: "Marrakech > Fes",
    guideType: "Semi Guided",
    tourType: "Private",
    travelStyle: "Adventure",
    rating: 4.7,
    inclusions: ["hotel", "meals"],
    maxGroup: 16,
    minAge: 14,
    maxAge: 50,
    cities: "Marrakech, Fes +4 More",
    departures: [
      { date: "6 Oct 26", price: "$1,340" },
      { date: "13 Oct 26", price: "$1,380" },
      { date: "20 Oct 26", price: "$1,310" },
    ],
    originalPrice: "$1,680",
    price: "$1,432",
    rawPrice: 1432,
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 8,
    title: "Greek Islands Cruise",
    location: "Greece",
    duration: "7D | 6N",
    days: 7,
    route: "Athens > Santorini",
    guideType: "Self Guided",
    tourType: "Custom",
    travelStyle: "Relaxation",
    rating: 4.8,
    inclusions: ["hotel", "meals", "flights"],
    maxGroup: 30,
    minAge: 21,
    maxAge: 65,
    cities: "Athens, Santorini +3 More",
    departures: [
      { date: "14 Jul 26", price: "$1,780" },
      { date: "21 Jul 26", price: "$1,820" },
      { date: "28 Jul 26", price: "$1,750" },
    ],
    originalPrice: "$1,450",
    price: "$1,232",
    rawPrice: 1232,
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 9,
    title: "Kilimanjaro Summit",
    location: "Tanzania",
    duration: "8D | 7N",
    days: 8,
    route: "Arusha > Moshi",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Adventure",
    rating: 4.9,
    inclusions: ["hotel", "meals", "guide"],
    maxGroup: 10,
    minAge: 18,
    maxAge: 40,
    cities: "Arusha, Moshi +2 More",
    departures: [
      { date: "3 Sep 26", price: "$2,950" },
      { date: "10 Sep 26", price: "$3,020" },
      { date: "17 Sep 26", price: "$2,890" },
    ],
    originalPrice: "$1,250",
    price: "$1,022",
    rawPrice: 1022,
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
  },
];

const INDIA_TOURS: TourItem[] = [
  {
    id: "in-1",
    title: "Golden Triangle Classic",
    location: "India",
    duration: "6D | 5N",
    days: 6,
    route: "Delhi > Agra > Jaipur",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Cultural",
    rating: 4.9,
    inclusions: ["hotel", "meals", "guide"],
    maxGroup: 20,
    minAge: 12,
    maxAge: 70,
    cities: "Delhi, Agra, Jaipur",
    departures: [
      { date: "5 Sep 26", price: "₹38,500" },
      { date: "12 Sep 26", price: "₹42,000" },
      { date: "19 Sep 26", price: "₹39,900" },
    ],
    originalPrice: "₹48,000",
    price: "₹38,500",
    rawPrice: 38500,
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "in-2",
    title: "Kerala Backwaters & Hills",
    location: "India",
    duration: "7D | 6N",
    days: 7,
    route: "Cochin > Munnar > Alleppey",
    guideType: "Private Tour",
    tourType: "Private",
    travelStyle: "Relaxation",
    rating: 4.8,
    inclusions: ["hotel", "meals"],
    maxGroup: 12,
    minAge: 8,
    maxAge: 75,
    cities: "Cochin, Munnar, Thekkady, Alleppey",
    departures: [
      { date: "10 Oct 26", price: "₹42,000" },
      { date: "18 Oct 26", price: "₹45,500" },
      { date: "25 Oct 26", price: "₹43,000" },
    ],
    originalPrice: "₹52,000",
    price: "₹42,000",
    rawPrice: 42000,
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "in-3",
    title: "Royal Rajasthan Heritage",
    location: "India",
    duration: "9D | 8N",
    days: 9,
    route: "Jaipur > Jodhpur > Udaipur",
    guideType: "Full Guided",
    tourType: "Group",
    travelStyle: "Cultural",
    rating: 4.9,
    inclusions: ["hotel", "meals", "guide"],
    maxGroup: 18,
    minAge: 14,
    maxAge: 65,
    cities: "Jaipur, Jodhpur, Udaipur, Pushkar",
    departures: [
      { date: "2 Nov 26", price: "₹58,000" },
      { date: "10 Nov 26", price: "₹62,000" },
      { date: "18 Nov 26", price: "₹59,500" },
    ],
    originalPrice: "₹72,000",
    price: "₹58,000",
    rawPrice: 58000,
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  },
];

export default function CountryTourListing({ countrySlug }: { countrySlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCountry = searchParams.get("country") || "";
  const querySearch = searchParams.get("search") || "";
  const { format } = useCurrency();
  const { isWishlisted, toggleWishlist } = useTravelStore();

  const [countryName, setCountryName] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSubCategory, setSelectedSubCategory] = useState<"all" | "group" | "private" | "city">("all");
  const [loading, setLoading] = useState(false);

  // Active filter states
  const [budgetActive, setBudgetActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedTourType, setSelectedTourType] = useState("");
  const [selectedTravelStyle, setSelectedTravelStyle] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedInclusion, setSelectedInclusion] = useState("");
  const [selectedDepartureMonth, setSelectedDepartureMonth] = useState("");

  const hasSpecificCountry = Boolean(countrySlug || queryCountry);

  const isIndia =
    countrySlug?.toLowerCase().includes("india") ||
    queryCountry.toLowerCase().includes("india") ||
    countryName.toLowerCase().includes("india");

  const [tours, setTours] = useState<TourItem[]>(WORLD_TOURS);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([fetchPublicCountries(), fetchPublicCategories()])
      .then(([countries]) => {
        let resolvedCountry = "";
        if (countrySlug) {
          const match = countries.find((item) => slugifyTourSegment(item.country_name) === countrySlug);
          resolvedCountry = match?.country_name || countrySlug;
        } else if (queryCountry) {
          const match = countries.find((item) => item.country_name.toLowerCase() === queryCountry.toLowerCase());
          resolvedCountry = match?.country_name || queryCountry;
        }

        if (active) setCountryName(resolvedCountry);

        const params: Record<string, string | number | boolean> = { limit: 100 };
        if (resolvedCountry) params.country = resolvedCountry;
        if (querySearch) params.search = querySearch;

        return fetchPublicTours(params);
      })
      .then((result) => {
        if (!active) return;
        const apiItems = result.items || [];
        const baseSet = isIndia ? INDIA_TOURS : WORLD_TOURS;

        if (apiItems.length > 0) {
          const mapped: TourItem[] = apiItems.map((t, idx) => {
            const fallback = baseSet[idx % baseSet.length];
            return {
              id: t.id,
              title: t.title || fallback.title,
              location: t.country_name || fallback.location,
              duration: t.number_of_days ? `${t.number_of_days}D | ${Math.max(1, t.number_of_days - 1)}N` : fallback.duration,
              days: t.number_of_days || fallback.days,
              route: fallback.route,
              guideType: fallback.guideType,
              tourType: fallback.tourType,
              travelStyle: fallback.travelStyle,
              rating: fallback.rating,
              inclusions: fallback.inclusions,
              maxGroup: fallback.maxGroup,
              minAge: fallback.minAge,
              maxAge: fallback.maxAge,
              cities: fallback.cities,
              departures: fallback.departures,
              originalPrice: fallback.originalPrice,
              price: t.price_start_per_person ? format(t.price_start_per_person, t.currency) : fallback.price,
              rawPrice: t.price_start_per_person || fallback.rawPrice,
              currency: t.currency || "USD",
              image: t.banner_image ? mediaUrl(t.banner_image) : fallback.image,
              slug: t.slug,
              country_name: t.country_name,
            };
          });

          if (mapped.length < 9) {
            setTours([...mapped, ...baseSet.slice(mapped.length)]);
          } else {
            setTours(mapped);
          }
        } else {
          setTours(baseSet);
        }
      })
      .catch(() => {
        setTours(isIndia ? INDIA_TOURS : WORLD_TOURS);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [countrySlug, queryCountry, querySearch, format, isIndia]);

  // Destination and hero headings
  const destinationTitle = countryName || (isIndia ? "India" : hasSpecificCountry ? "Destination" : "World Tours");

  // Dynamic available destinations from tours for the dropdown
  const availableDestinations = useMemo(() => {
    const set = new Set<string>();
    tours.forEach((t) => {
      if (t.location) set.add(t.location);
      if (t.cities) {
        t.cities.split(",").forEach((c) => {
          const clean = c.replace(/\+\d+\s*More/i, "").trim();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set);
  }, [tours]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (budgetActive) count++;
    if (selectedDuration) count++;
    if (selectedDestination) count++;
    if (selectedTourType) count++;
    if (selectedTravelStyle) count++;
    if (selectedRating) count++;
    if (selectedInclusion) count++;
    if (selectedDepartureMonth) count++;
    if (selectedSubCategory !== "all") count++;
    return count;
  }, [
    budgetActive,
    selectedDuration,
    selectedDestination,
    selectedTourType,
    selectedTravelStyle,
    selectedRating,
    selectedInclusion,
    selectedDepartureMonth,
    selectedSubCategory,
  ]);

  const clearAllFilters = () => {
    setBudgetActive(false);
    setSelectedDuration("");
    setSelectedDestination("");
    setSelectedTourType("");
    setSelectedTravelStyle("");
    setSelectedRating("");
    setSelectedInclusion("");
    setSelectedDepartureMonth("");
    setSelectedSubCategory("all");
  };

  // Live filtered tours
  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      // Sub-category (Group / Private / City)
      if (selectedSubCategory === "group" && tour.tourType !== "Group" && !tour.guideType.toLowerCase().includes("group")) {
        return false;
      }
      if (selectedSubCategory === "private" && tour.tourType !== "Private" && !tour.guideType.toLowerCase().includes("private")) {
        return false;
      }

      // Budget filter
      if (budgetActive) {
        const threshold = isIndia ? 45000 : 1200;
        if (tour.rawPrice > threshold) return false;
      }

      // Duration filter
      if (selectedDuration) {
        if (selectedDuration === "1-3" && (tour.days < 1 || tour.days > 3)) return false;
        if (selectedDuration === "4-7" && (tour.days < 4 || tour.days > 7)) return false;
        if (selectedDuration === "8+" && tour.days < 8) return false;
      }

      // Destination filter
      if (selectedDestination) {
        const query = selectedDestination.toLowerCase();
        const matchesLoc = tour.location.toLowerCase().includes(query);
        const matchesCity = tour.cities.toLowerCase().includes(query);
        const matchesRoute = tour.route.toLowerCase().includes(query);
        if (!matchesLoc && !matchesCity && !matchesRoute) return false;
      }

      // Tour Type filter
      if (selectedTourType) {
        if (selectedTourType === "Group" && tour.tourType !== "Group" && !tour.guideType.toLowerCase().includes("group")) {
          return false;
        }
        if (selectedTourType === "Private" && tour.tourType !== "Private" && !tour.guideType.toLowerCase().includes("private")) {
          return false;
        }
        if (selectedTourType === "Custom" && tour.tourType !== "Custom") {
          return false;
        }
      }

      // Travel Style filter
      if (selectedTravelStyle && tour.travelStyle) {
        if (tour.travelStyle.toLowerCase() !== selectedTravelStyle.toLowerCase()) {
          return false;
        }
      }

      // Rating filter
      if (selectedRating && tour.rating) {
        if (tour.rating < Number(selectedRating)) return false;
      }

      // Inclusions filter
      if (selectedInclusion && tour.inclusions) {
        if (!tour.inclusions.includes(selectedInclusion)) return false;
      }

      // Departure Month filter
      if (selectedDepartureMonth) {
        const monthQuery = selectedDepartureMonth.toLowerCase();
        const hasDep = tour.departures.some((d) => d.date.toLowerCase().includes(monthQuery));
        if (!hasDep) return false;
      }

      return true;
    });
  }, [
    tours,
    selectedSubCategory,
    budgetActive,
    selectedDuration,
    selectedDestination,
    selectedTourType,
    selectedTravelStyle,
    selectedRating,
    selectedInclusion,
    selectedDepartureMonth,
    isIndia,
  ]);

  // Dynamic titles and descriptions
  const heroTitle = hasSpecificCountry ? `${destinationTitle} Tours` : "Explore the World's Best Tours";

  const heroDescription = hasSpecificCountry
    ? isIndia
      ? "India tours bring together breathtaking heritage palaces, vibrant cultural festivals, golden desert landscapes, and tranquil coastal backwaters, making every journey packed with unforgettable experiences. Explore iconic destinations such as Delhi, Agra, Jaipur, Kerala, and Varanasi."
      : `${destinationTitle} tours bring together breathtaking mountains, pristine lakes, dramatic coastlines and vibrant cities, making every journey packed with unforgettable experiences. Explore iconic destinations with scenic road trips, guided adventures and plenty of time to discover the natural beauty.`
    : "Discover handpicked tour packages across the world's most incredible destinations — from the alpine peaks of Switzerland and New Zealand to the rich heritage of India and the tropical islands of Bali. Guided journeys, scenic road trips, and memorable adventures crafted for every traveller.";

  const heroBannerImage = hasSpecificCountry
    ? isIndia
      ? "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80"
      : "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
    : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80";

  const showcaseTitle = hasSpecificCountry ? `${destinationTitle} Group Tours` : "World Best Group & Private Tours";

  const showcaseDescription = hasSpecificCountry
    ? "Travel together, share unforgettable experiences, and explore incredible destinations with expertly planned group tours. Meet like-minded travellers, enjoy seamless itineraries, and create lasting memories along the way."
    : "Travel together, share unforgettable experiences, and explore incredible destinations with expertly planned tours across 50+ countries. Meet like-minded travellers, enjoy seamless itineraries, and create lasting memories along the way.";

  const showcaseImage = hasSpecificCountry
    ? isIndia
      ? "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80"
      : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
    : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";

  return (
    <main className="min-h-screen bg-white pb-24 pt-3 text-slate-950">
      <div className="mx-auto max-w-[1400px] px-5">
        {/* ── 1. Hero Landscape Banner ── */}
        <section className="relative h-[360px] sm:h-[420px] w-full overflow-hidden rounded-[20px] bg-slate-950 shadow-md">
          {/* Background Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBannerImage}
            alt={heroTitle}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />

          {/* Hero Content Card */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
            <div className="max-w-2xl rounded-2xl bg-black/40 p-5 sm:p-7 backdrop-blur-md border border-white/10 text-white shadow-xl">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {heroTitle}
              </h1>
              <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-white/90">
                {heroDescription}
              </p>

              {/* Meta stats */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/90">
                <span className="flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  4.9 <span className="text-white/70 font-normal">12,400+ reviews</span>
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <Users size={13} />
                  250+ Group Tours
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <User size={13} />
                  180+ Private Tours
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <Compass size={13} />
                  95+ Destinations
                </span>
              </div>
            </div>

            {/* Bottom rating statement */}
            <p className="text-xs font-medium text-white/90">
              Tourvaa travellers rate us <span className="font-bold">Excellent</span>{" "}
              <span className="inline-flex text-amber-400">★★★★★</span>{" "}
              <span className="font-bold">4.8</span> out of 5 based on 522 reviews on Ayatiworks
            </p>
          </div>
        </section>

        {/* ── 2. Clickable Breadcrumbs Navigation ── */}
        <nav className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
          >
            <Home size={13} className="text-blue-600" />
            Home
          </Link>
          <span className="text-slate-300">›</span>
          <Link
            href="/tours"
            className={`flex items-center gap-1 transition ${
              hasSpecificCountry ? "text-slate-600 hover:text-blue-600" : "text-blue-600 font-bold"
            }`}
          >
            <MapIcon size={13} className="text-blue-600" />
            {hasSpecificCountry ? "Tour" : "All Tours"}
          </Link>
          {hasSpecificCountry && (
            <>
              <span className="text-slate-300">›</span>
              <Link
                href={countrySlug ? `/tours/${countrySlug}` : `/tours?country=${encodeURIComponent(destinationTitle)}`}
                className="flex items-center gap-1 text-blue-600 hover:underline transition"
              >
                <MapPin size={13} className="text-blue-600" />
                {destinationTitle}
              </Link>
            </>
          )}
        </nav>

        {/* ── 3. Destination Heading & Result Count ── */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B1527]">
              {hasSpecificCountry ? destinationTitle : "Discover World Tours"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
              <span className="font-black text-slate-900">
                {filteredTours.length} Tour{filteredTours.length === 1 ? "" : "s"} Found
              </span>{" "}
              {hasSpecificCountry ? `in ${destinationTitle}` : "Across Worldwide Destinations"}
              {activeFiltersCount > 0 && (
                <span className="ml-2 text-xs text-blue-600 font-bold">
                  ({activeFiltersCount} filter{activeFiltersCount === 1 ? "" : "s"} active)
                </span>
              )}
            </p>
          </div>

          {/* Grid / List View Switcher & Clear Filters */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition"
              >
                <RotateCcw size={12} />
                Reset filters
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                viewMode === "grid"
                  ? "border-blue-600 bg-blue-50 text-blue-600 shadow-2xs font-bold"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                viewMode === "list"
                  ? "border-blue-600 bg-blue-50 text-blue-600 shadow-2xs font-bold"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-700"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* ── 4. Live Horizontal Filter Pills Bar ── */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* Main Filter Badge */}
          <button
            type="button"
            onClick={() => {
              if (activeFiltersCount > 0) clearAllFilters();
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#E4572E] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#d0461f]"
          >
            <Sliders size={13} />
            Filter ({activeFiltersCount})
          </button>

          {/* Budget Pill (Toggle) */}
          <button
            type="button"
            onClick={() => setBudgetActive((b) => !b)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition shadow-2xs ${
              budgetActive
                ? "bg-[#E4572E] text-white hover:bg-[#d0461f]"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            Budget {budgetActive ? `(≤ ${isIndia ? "₹45k" : "$1.2k"})` : ""}
          </button>

          {/* Duration Dropdown Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              className={`appearance-none rounded-full py-2 pl-4 pr-8 text-xs font-semibold outline-none shadow-2xs transition ${
                selectedDuration
                  ? "border border-blue-500 bg-blue-50 text-blue-700 font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="">Duration</option>
              <option value="1-3">1–3 Days</option>
              <option value="4-7">4–7 Days</option>
              <option value="8+">8+ Days</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Destination Dropdown Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className={`appearance-none rounded-full py-2 pl-4 pr-8 text-xs font-semibold outline-none shadow-2xs transition ${
                selectedDestination
                  ? "border border-blue-500 bg-blue-50 text-blue-700 font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="">Destination</option>
              {availableDestinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Tour Type Dropdown Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedTourType}
              onChange={(e) => setSelectedTourType(e.target.value)}
              className={`appearance-none rounded-full py-2 pl-4 pr-8 text-xs font-semibold outline-none shadow-2xs transition ${
                selectedTourType
                  ? "border border-blue-500 bg-blue-50 text-blue-700 font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="">Tour Type</option>
              <option value="Group">Group Tour</option>
              <option value="Private">Private Tour</option>
              <option value="Custom">Custom Package</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Travel Style Dropdown Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedTravelStyle}
              onChange={(e) => setSelectedTravelStyle(e.target.value)}
              className={`appearance-none rounded-full py-2 pl-4 pr-8 text-xs font-semibold outline-none shadow-2xs transition ${
                selectedTravelStyle
                  ? "border border-blue-500 bg-blue-50 text-blue-700 font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="">Travel Style</option>
              <option value="Adventure">Adventure</option>
              <option value="Relaxation">Relaxation</option>
              <option value="Cultural">Cultural</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Rating Dropdown Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className={`appearance-none rounded-full py-2 pl-4 pr-8 text-xs font-semibold outline-none shadow-2xs transition ${
                selectedRating
                  ? "border border-blue-500 bg-blue-50 text-blue-700 font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="">Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Inclusions Dropdown Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedInclusion}
              onChange={(e) => setSelectedInclusion(e.target.value)}
              className={`appearance-none rounded-full py-2 pl-4 pr-8 text-xs font-semibold outline-none shadow-2xs transition ${
                selectedInclusion
                  ? "border border-blue-500 bg-blue-50 text-blue-700 font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="">Inclusions</option>
              <option value="hotel">Hotel Included</option>
              <option value="meals">Meals Included</option>
              <option value="flights">Flights Included</option>
              <option value="guide">Guide Included</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Departure Month Dropdown Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedDepartureMonth}
              onChange={(e) => setSelectedDepartureMonth(e.target.value)}
              className={`appearance-none rounded-full py-2 pl-4 pr-8 text-xs font-semibold outline-none shadow-2xs transition ${
                selectedDepartureMonth
                  ? "border border-blue-500 bg-blue-50 text-blue-700 font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="">Departure Month</option>
              <option value="Sep">Sep 2026</option>
              <option value="Oct">Oct 2026</option>
              <option value="Nov">Nov 2026</option>
              <option value="Dec">Dec 2026</option>
              <option value="Aug">Aug 2026</option>
              <option value="Jul">Jul 2026</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* ── 5. ⭐ Featured Category Showcase Banner Card ── */}
        <section className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 gap-6 items-center md:grid-cols-2">
            {/* Left side content */}
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B1527]">
                {showcaseTitle}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                {showcaseDescription}
              </p>

              {/* 3 Category Filter Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory(selectedSubCategory === "group" ? "all" : "group")}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                    selectedSubCategory === "group"
                      ? "bg-[#0B1527] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Group Tour
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory(selectedSubCategory === "private" ? "all" : "private")}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                    selectedSubCategory === "private"
                      ? "bg-[#0B1527] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Private Tour
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory(selectedSubCategory === "city" ? "all" : "city")}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                    selectedSubCategory === "city"
                      ? "bg-[#0B1527] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  City Explore
                </button>
              </div>
            </div>

            {/* Right side image */}
            <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showcaseImage}
                alt={showcaseTitle}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>
          </div>
        </section>

        {/* ── 6. 3-Column Tour Card Grid or Empty State ── */}
        {filteredTours.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center">
            <MapPin size={36} className="text-slate-400" />
            <h3 className="mt-3 text-lg font-black text-slate-900">No tours match your filters</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Try adjusting or clearing your selected filters to discover other available journeys across our destinations.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-5 rounded-xl bg-[#0B1527] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#15233C] transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            className={`mt-8 ${
              viewMode === "grid"
                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-6"
            }`}
          >
            {filteredTours.map((tour, idx) => {
              const tourLink = tour.slug
                ? publicTourUrl({ country_name: tour.country_name || tour.location, title: tour.title, slug: tour.slug })
                : `/tours/${tour.id}`;

              return (
                <div
                  key={`${tour.id}-${idx}`}
                  className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    viewMode === "list" ? "sm:flex-row" : ""
                  }`}
                >
                  {/* ── Card Image Header ── */}
                  <div
                    className={`relative w-full overflow-hidden ${
                      viewMode === "list" ? "h-56 sm:h-auto sm:w-80 shrink-0" : "h-52"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {/* Location badge top-left */}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-800 backdrop-blur-xs shadow-xs">
                      <MapPin size={11} className="text-slate-600" />
                      {tour.location}
                    </span>

                    {/* Heart button top-right */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleWishlist({
                          id: typeof tour.id === "number" ? tour.id : 1,
                          title: tour.title,
                          place: tour.location,
                          duration: tour.duration,
                          image: tour.image,
                          price: tour.rawPrice,
                          currency: tour.currency || "USD",
                          href: tourLink,
                        })
                      }
                      aria-label="Save tour to wishlist"
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-xs hover:scale-110 transition"
                    >
                      <Heart size={14} className="fill-current text-red-500" />
                    </button>
                  </div>

                  {/* ── Card Body ── */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      {/* Title and Duration Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={tourLink}
                          className="text-sm font-bold text-[#0B1527] transition hover:text-blue-600 line-clamp-1"
                        >
                          {tour.title}
                        </Link>
                        <span className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          {tour.duration}
                        </span>
                      </div>

                      {/* Specifications Grid */}
                      <div className="mt-3.5 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-600 font-medium">
                        {/* Left Column */}
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-1.5 truncate">
                            <Clock size={11} className="text-blue-500 shrink-0" />
                            <span>{tour.days} Days</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <MapPin size={11} className="text-blue-500 shrink-0" />
                            <span className="truncate">{tour.route}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <Compass size={11} className="text-blue-500 shrink-0" />
                            <span>{tour.guideType}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <Users size={11} className="text-blue-500 shrink-0" />
                            <span>Max Group Size: {tour.maxGroup}</span>
                          </p>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-1.5 truncate">
                            <User size={11} className="text-blue-500 shrink-0" />
                            <span>Minimum age: {tour.minAge}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <User size={11} className="text-blue-500 shrink-0" />
                            <span>Maximum age: {tour.maxAge}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <MapPin size={11} className="text-blue-500 shrink-0" />
                            <span className="truncate">{tour.cities}</span>
                          </p>
                        </div>
                      </div>

                      {/* Upcoming Departure Dates Strip */}
                      <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-slate-100 bg-[#F9FBFE] p-1.5 text-center">
                        {tour.departures.map((dep, dIdx) => (
                          <div key={dIdx} className="rounded-lg bg-white py-1 px-0.5 border border-slate-100 shadow-2xs">
                            <p className="text-[8px] font-semibold text-slate-400 truncate">{dep.date}</p>
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">{dep.price}</p>
                          </div>
                        ))}
                        <div className="flex items-center justify-center rounded-lg py-1 text-[10px] font-bold text-slate-700 hover:bg-white transition cursor-pointer">
                          +More
                        </div>
                      </div>
                    </div>

                    {/* ── Card Footer ── */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[10px] text-slate-400">From </span>
                        <span className="text-[10px] line-through text-slate-400 mr-1">{tour.originalPrice} pp</span>
                        <span className="text-sm font-black text-slate-900">{tour.price}</span>
                        <span className="text-[10px] text-slate-400"> pp</span>
                      </div>
                      <Link
                        href={tourLink}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1527] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C]"
                      >
                        View tour
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
