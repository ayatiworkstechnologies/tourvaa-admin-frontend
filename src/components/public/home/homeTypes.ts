import React from "react";
import {
  CmsDestination,
  CmsReview,
  PublicCountry,
  PublicTour,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import {
  LuClock as Clock,
  LuMapPin as MapPin,
  LuUser as User,
  LuUsers as Users,
} from "react-icons/lu";

export type TourFeature = { icon: React.ElementType; text: string };

export type Tour = {
  id?: number;
  title: string;
  place: string;
  image: string;
  days: string;
  durationTag?: string;
  reviews: string;
  rating?: number;
  features: TourFeature[];
  rawPrice?: number | null;
  originalPrice?: number | null;
  discountBadge?: string;
  currency?: string;
  slug?: string;
};

export const PLACEHOLDER_IMAGE = "/images/tour-card-fallback.jpg";

export type CountryWorthExploring = {
  name: string;
  count: string;
  image: string;
  rating?: number;
  badge?: string;
  price?: number | null;
  currency?: string;
};

export type CountryDestination = {
  name: string;
  image: string;
  snippet: string;
  tourCount?: number;
  badge?: string;
  href?: string;
};

export const DEFAULT_FAVOURITE_COUNTRIES: CountryDestination[] = [
  {
    name: "Morocco",
    badge: "Morocco",
    image: "/images/destination-desert.jpg",
    snippet:
      "Trek the Sahara aboard a camel. Browse the vibrant souks of Marrakech. Uncover the imperial cities.",
    href: "/tours?country=Morocco",
  },
  {
    name: "Egypt",
    badge: "Egypt",
    image: "/images/destination-alpine.jpg",
    snippet:
      "Our best-selling destination! Cruise the Nile, marvel at the Pyramids, explore the tombs of Luxor.",
    href: "/tours?country=Egypt",
  },
  {
    name: "Iceland",
    badge: "Iceland",
    image: "/images/hero-1.jpg",
    snippet:
      "Iceland in winter is home to the Northern Lights, while in summer the waterfalls are breathtaking.",
    href: "/tours?country=Iceland",
  },
  {
    name: "Sri Lanka",
    badge: "Sri Lanka",
    image: "/images/hero-2.jpg",
    snippet:
      "Sri Lanka's Cultural Triangle offers such attractions as the Sigiriya Fortress and Dambulla caves.",
    href: "/tours?country=Sri+Lanka",
  },
  {
    name: "Turkey",
    badge: "Turkey",
    image: "/images/hero-3.jpg",
    snippet:
      "From the city in two continents, Istanbul, to the cave cities of Cappadocia, make Turkey your next trip.",
    href: "/tours?country=Turkey",
  },
  {
    name: "India",
    badge: "India",
    image: "/images/destination-desert.jpg",
    snippet:
      "First timers to India will want to take in the Golden Triangle of Delhi, Jaipur and Agra.",
    href: "/tours?country=India",
  },
  {
    name: "Vietnam",
    badge: "Vietnam",
    image: "/images/destination-alpine.jpg",
    snippet:
      "Visitors to Vietnam can cruise Halong Bay. They can ride a rickshaw around Hanoi. And so much more.",
    href: "/tours?country=Vietnam",
  },
  {
    name: "China",
    badge: "China",
    image: "/images/hero-1.jpg",
    snippet:
      "Walk the Great Wall, stand before the Terracotta Army, and explore the Forbidden City.",
    href: "/tours?country=China",
  },
];

export function stableHash(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return hash >>> 0;
}

export function mapPublicTour(tour: PublicTour): Tour {
  const durationLabel = tour.number_of_days
    ? `${tour.number_of_days} Day${tour.number_of_days === 1 ? "" : "s"}${tour.number_of_days > 1 ? ` / ${tour.number_of_days - 1} Nights` : ""}`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hour${tour.number_of_hours === 1 ? "" : "s"}`
      : "Flexible";

  const durationTag = tour.number_of_days
    ? `${tour.number_of_days}D | ${Math.max(0, tour.number_of_days - 1)}N`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hours`
      : undefined;

  const route =
    tour.start_location && tour.end_location
      ? `${tour.start_location} → ${tour.end_location}`
      : tour.city_name || tour.country_name || "Multiple Destinations";

  const features: TourFeature[] = [
    { icon: Clock, text: durationLabel },
    { icon: MapPin, text: route },
    { icon: User, text: "Age Range: 12–70" },
    { icon: Users, text: `Max Group Size: ${tour.group_size || 20}` },
  ];

  const hasDiscount = Boolean(
    tour.discount_percentage &&
      tour.original_price_per_person != null &&
      tour.discounted_price_per_person != null
  );
  const rawPrice = hasDiscount
    ? tour.discounted_price_per_person
    : tour.price_start_per_person;
  const originalPrice = hasDiscount ? tour.original_price_per_person : null;
  const discountBadge = tour.discount_percentage
    ? `Save ${Math.round(tour.discount_percentage)}%`
    : undefined;

  return {
    id: tour.id,
    title: tour.title,
    place: tour.country_name || tour.city_name || "Worldwide",
    image: tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER_IMAGE,
    days: durationLabel,
    durationTag,
    reviews: tour.rating_count
      ? `${tour.rating_count.toLocaleString()} reviews`
      : "",
    rating: tour.rating_count ? (tour.rating_average ?? undefined) : undefined,
    features,
    rawPrice,
    originalPrice,
    discountBadge,
    currency: tour.currency || "USD",
    slug: tour.slug,
  };
}

export function topDestinationsFromCountries(
  countries: PublicCountry[],
  cmsDestinations: CmsDestination[],
  limit: number,
): CountryWorthExploring[] {
  const countryById = new Map(countries.map((c) => [c.id, c]));
  const countryByName = new Map(
    countries.map((c) => [c.country_name.trim().toLowerCase(), c]),
  );

  if (cmsDestinations.length) {
    return [...cmsDestinations]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .slice(0, limit)
      .map((item) => {
        const match =
          (item.country_id != null ? countryById.get(item.country_id) : undefined) ??
          countryByName.get(item.title.trim().toLowerCase());
        const tourCount = match?.tour_count || 0;
        return {
          name: match?.country_name || item.title,
          count: `${tourCount} package${tourCount === 1 ? "" : "s"}`,
          image: item.image ? mediaUrl(item.image) : PLACEHOLDER_IMAGE,
          price: null as number | null,
          currency: "USD",
        };
      });
  }

  return [...countries]
    .filter((country) => (country.tour_count || 0) > 0)
    .sort((a, b) => (b.tour_count || 0) - (a.tour_count || 0))
    .slice(0, limit)
    .map((country) => ({
      name: country.country_name,
      count: `${country.tour_count} package${country.tour_count === 1 ? "" : "s"}`,
      image: PLACEHOLDER_IMAGE,
      price: null as number | null,
      currency: "USD",
    }));
}

export type ReviewItem = {
  quote: string;
  name: string;
  city: string;
  tourName: string;
  initials: string;
  rating: number;
  image?: string | null;
};

export const CURATED_REVIEWS: ReviewItem[] = [
  {
    quote:
      "Booked a 7-day Rajasthan tour through Tourvaa. Everything was flawless — hotels, transport, guides. I didn't have to think once.",
    name: "Priya Menon",
    city: "Kerala, India",
    tourName: "Rajasthan Heritage Tour",
    initials: "PM",
    rating: 5,
  },
  {
    quote:
      "The Golden Triangle package was absolutely worth every dirham. The team was responsive and the itinerary was perfectly paced.",
    name: "Khalid Al-Rashid",
    city: "Dubai, UAE",
    tourName: "Golden Triangle Escape",
    initials: "KA",
    rating: 5,
  },
  {
    quote:
      "Discovered Tourvaa on Instagram and booked a Kerala houseboat trip on a whim. Genuinely the best holiday I've ever had.",
    name: "Anjali Sharma",
    city: "Bengaluru, India",
    tourName: "Kerala Backwaters & Hills",
    initials: "AS",
    rating: 5,
  },
  {
    quote:
      "Our Swiss Alps trip was organized down to the minute. The train passes, hotel vouchers and local guides were top notch!",
    name: "David Miller",
    city: "London, UK",
    tourName: "Swiss Alps Explorer",
    initials: "DM",
    rating: 5,
  },
  {
    quote:
      "Exploring Japan during cherry blossom season with Tourvaa was a dream come true. Unbeatable value and service.",
    name: "Sophie Laurent",
    city: "Paris, France",
    tourName: "Cherry Blossom Odyssey",
    initials: "SL",
    rating: 5,
  },
];

export function mapReview(item: CmsReview): ReviewItem {
  const name = item.reviewer_name || "Verified traveller";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VT";
  return {
    quote: item.review_text,
    name,
    image: item.reviewer_image ? mediaUrl(item.reviewer_image) : null,
    city: item.country || "Verified traveller",
    tourName: item.tour_name || "",
    initials,
    rating: Math.max(1, Math.min(5, item.rating || 5)),
  };
}

export const FAQS = [
  {
    question: "How do I book a tour package with Tourvaa?",
    answer:
      "Booking with Tourvaa is simple. Browse our curated tours, select your preferred departure date, choose your group size, and click 'Book Now'. Our travel specialists will confirm your itinerary and assist with all pre-trip preparations.",
  },
  {
    question: "What is your cancellation and refund policy?",
    answer:
      "You can cancel your booking up to 14 days before your departure date for a full refund. For cancellations made between 7 to 13 days prior, we offer a 50% refund. Unfortunately, cancellations made within 7 days of the tour start date are non-refundable. Please read our detailed Terms & Conditions for specific destination and partner policies.",
  },
  {
    question: "Are group discounts available for larger bookings?",
    answer:
      "Yes! We offer exclusive group discounts for bookings of 6 or more travellers. Contact our dedicated support team or submit a custom inquiry on our group booking page to receive customized rates.",
  },
  {
    question: "Does Tourvaa provide comprehensive travel insurance?",
    answer:
      "We partner with leading global insurers to offer comprehensive travel protection plans covering trip cancellations, medical emergencies, baggage loss, and flight delays during your tour.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards (Visa, MasterCard, American Express), Apple Pay, Google Pay, and direct bank wire transfers with secure SSL encryption.",
  },
  {
    question: "Do you offer visa assistance for international tours?",
    answer:
      "Yes, our travel desk provides full visa guidance, documentation checklists, and application support for all international destinations included in our tour packages.",
  },
];

export const DEFAULT_ABOUT_HEADING = "About Tourvaa";
export const DEFAULT_ABOUT_BODY =
  "Tourvaa is a premier travel platform dedicated to crafting extraordinary group travel experiences across the globe. We connect passionate travellers with expertly curated tours, handpicked destinations, and seamless end-to-end booking — from visa assistance to on-ground coordination. Whether it's the serene backwaters of Kerala, the alpine trails of Switzerland, or the vibrant streets of Tokyo, Tourvaa makes every journey effortless, memorable, and truly unforgettable.";

export const DEFAULT_TRANSFER_FEATURES = ["RELIABLE", "CLEAN", "AFFORDABLE", "24/7", "SECURE"];
