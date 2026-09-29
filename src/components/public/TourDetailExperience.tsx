"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChevronUp as ChevronUp,
  LuCompass as Compass,
  LuHeart as Heart,
  LuHotel as Hotel,
  LuMapPin as MapPin,
  LuMessageCircle as MessageCircle,
  LuMinus as Minus,
  LuPlus as Plus,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuUser as User,
  LuUsers as Users,
  LuUtensils as Utensils,
  LuX as X,
  LuBus as Bus,
  LuWallet as Wallet,
  LuBox as Box,
  LuMap as MapIcon,
  LuShare2 as Share2,
  LuClock as Clock,
  LuFlame as Flame,
  LuBadgePercent as BadgePercent,
  LuCamera as Camera,
  LuTicket as Ticket,
  LuDownload as Download,
  LuCheckCheck as CheckCheck,
  LuLock as Lock,
  LuCar as Car,
  LuArrowLeftRight as ArrowLeftRight,
  LuSun as Sun,
  LuGauge as Gauge,
} from "react-icons/lu";
import publicApi, { PublicTourDetail } from "@/lib/api/publicClient";
import { destinationUrl } from "@/lib/utils/tourUrl";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import MarketingImage from "@/components/public/MarketingImage";
import ExternalExperiencesSection from "@/components/public/external/ExternalExperiencesSection";
import {
  useTravelStore,
  type TravelItem,
} from "@/providers/TravelStoreProvider";

type Props = {
  tour: PublicTourDetail;
  images: string[];
  initialTravelDate: string;
  initialAdults: number;
  initialChildren: number;
  onTravelDateChange?: (travelDate: string) => void;
  onBook: (selection: {
    travelDate: string;
    adults: number;
    children: number;
    agentAction?: "reserve" | "full";
  }) => void;
  agentBooking?: boolean;
  onWishlist: () => void;
  wishlisted: boolean;
  modal?: React.ReactNode;
};

function renderItemIcon(
  icon: string | null | undefined,
  FallbackIcon: typeof Check,
  colorClass: string,
) {
  if (icon && /^https?:\/\//i.test(icon)) {
    return (
      <MarketingImage
        src={icon}
        alt=""
        width={16}
        height={16}
        className="mt-0.5 h-4 w-4 shrink-0 rounded object-cover"
      />
    );
  }
  if (icon) {
    return (
      <span className="mt-0.5 shrink-0 text-base leading-none">{icon}</span>
    );
  }
  return (
    <FallbackIcon
      size={16}
      className={`mt-0.5 shrink-0 stroke-[3] ${colorClass}`}
    />
  );
}

function splitList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(
      (item) => item && !/^activities:?$/i.test(item) && !/^-+$/.test(item),
    )
    .map((item) => item.replace(/^-\s*/, ""));
}

function TextParagraphs({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function groupTierLabel(personsFrom: number, personsTo: number | null): string {
  return personsTo != null
    ? `${personsFrom}–${personsTo} travellers`
    : `${personsFrom}+ travellers`;
}

type DepartureDateItem = {
  id: string;
  date: string;
  /** YYYY-MM-DD, for API calls (date above is display-formatted). */
  isoDate: string;
  seats: string;
  urgent: boolean;
  slotsRemaining: number | null;
};

type MonthGroup = {
  name: string;
  key: string;
  dates: DepartureDateItem[];
};

function toIsoDate(val?: string | null): string {
  if (!val) return "";
  const s = decodeURIComponent(val).replace(/\+/g, " ").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }
  if (s.includes("T")) return s.split("T")[0];
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return s;
}

// Kept for the structured-itinerary presentation variant that can be enabled
// without changing the stored CMS format.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseItineraryDetail(
  raw: string,
): { title: string | null; body: string }[] {
  if (!raw || typeof raw !== "string") return [];
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const titleRegex =
    /(?:^|\n|(?<=[.!?"]\s+))([A-Z0-9][A-Za-z0-9\s&'/–—\-]+:)\s*/g;
  const matches = [...normalized.matchAll(titleRegex)];

  if (matches.length > 0) {
    const blocks: { title: string | null; body: string }[] = [];
    if (matches[0].index > 0) {
      const pre = normalized.slice(0, matches[0].index).trim();
      if (pre) blocks.push({ title: null, body: pre });
    }
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[1].replace(/:$/, "").trim();
      const contentStart = match.index + match[0].length;
      const contentEnd =
        i + 1 < matches.length ? matches[i + 1].index : normalized.length;
      const body = normalized.slice(contentStart, contentEnd).trim();
      blocks.push({ title, body });
    }
    return blocks;
  }

  const paragraphs = normalized
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.map((p) => {
    const colonIdx = p.indexOf(":");
    if (colonIdx > 0 && colonIdx < 60 && /^[A-Z]/.test(p)) {
      return {
        title: p.slice(0, colonIdx).trim(),
        body: p.slice(colonIdx + 1).trim(),
      };
    }
    return { title: null, body: p };
  });
}

// Fullscreen Lightbox Photo Modal
function LightboxModal({
  photos,
  initialIndex,
  onClose,
}: {
  photos: { url: string; title?: string; caption?: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  // While open: stop the page scrolling behind the gallery, and hide the
  // floating third-party widgets (Elfsight "EN" translator, chat) via
  // globals.css `body.lightbox-open` -- the Elfsight picker floats at a very
  // high z-index and was sitting exactly on top of the close button.
  useEffect(() => {
    document.body.classList.add("lightbox-open");
    return () => document.body.classList.remove("lightbox-open");
  }, []);

  const current = photos[index];

  // Portalled to <body> at the top z-index so no ancestor stacking context
  // or floating widget can cover the controls.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[2147483000] flex flex-col bg-slate-950/95 backdrop-blur-md text-white animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Photo {index + 1} of {photos.length}
          </span>
          {current?.title && (
            <span className="hidden sm:inline text-sm font-semibold text-white/90">
              · {current.title}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo gallery"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
        {photos.length > 1 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() =>
              setIndex((i) => (i - 1 + photos.length) % photos.length)
            }
            className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="relative h-full w-full max-w-5xl flex items-center justify-center">
          <MarketingImage
            src={current?.url || ""}
            alt={current?.title || `Tour photo ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {photos.length > 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
            className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-950/80 border-t border-white/10">
        {current?.caption && (
          <p className="text-center text-xs sm:text-sm text-white/80 max-w-2xl mx-auto mb-3">
            {current.caption}
          </p>
        )}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {photos.map((p, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setIndex(pIdx)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition cursor-pointer ${
                  index === pIdx
                    ? "border-amber-400 ring-2 ring-amber-400/50 scale-105"
                    : "border-white/20 opacity-60 hover:opacity-100"
                }`}
              >
                <MarketingImage
                  src={p.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// Upper bound for the traveller steppers only when the tour publishes neither a
// group size nor departure seats; availability is still enforced by the server.
const MAX_TRAVELLERS_CEILING = 99;

export default function TourDetailExperience({
  tour,
  images,
  initialTravelDate,
  initialAdults,
  initialChildren,
  onTravelDateChange,
  onBook,
  agentBooking = false,
  onWishlist,
  wishlisted,
  modal,
}: Props) {
  const { format } = useCurrency();

  const destination = tour.country_name || tour.city_name || "Destination";
  const city = tour.city_name || "";
  const title = tour.title || "Tour Experience";
  const dayCount = tour.number_of_days || tour.itineraries?.length || 1;
  const durationLabel =
    [
      tour.number_of_hours != null && tour.number_of_hours > 0
        ? `${tour.number_of_hours} Hours`
        : "",
      tour.number_of_days != null && tour.number_of_days > 0
        ? `${tour.number_of_days} Day${tour.number_of_days > 1 ? "s" : ""}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ") ||
    tour.overview?.duration_text ||
    (dayCount > 0 ? `${dayCount} Day Experience` : "");

  const countryFlag = tour.country_flag || "";
  const startLocation = tour.start_location || city || destination;
  const finishLocation =
    tour.finish_location || tour.overview?.end_location || city || destination;
  const routeSummary =
    startLocation && finishLocation && startLocation !== finishLocation
      ? `${startLocation} → ${finishLocation}`
      : startLocation;

  // 100% Dynamic Photo Gallery from Backend
  const galleryItems = useMemo(() => {
    const photos: { url: string; title?: string; caption?: string }[] = [];
    const seen = new Set<string>();

    const addPhoto = (
      url: string | null | undefined,
      titleText?: string,
      capText?: string,
    ) => {
      if (!url) return;
      const resolved = mediaUrl(url);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        photos.push({
          url: resolved,
          title: titleText || title,
          caption: capText || "",
        });
      }
    };

    // Primary banner
    addPhoto(tour.banner_image, title, tour.subtitle || "");

    // Mobile cover
    addPhoto(tour.mobile_cover_image, title);

    // Gallery array from CMS
    if (tour.gallery && tour.gallery.length > 0) {
      tour.gallery.forEach((g) => {
        addPhoto(
          g.image_url,
          g.title || g.caption || title,
          g.caption || g.alt_text,
        );
      });
    }

    // Itineraries images
    if (tour.itineraries && tour.itineraries.length > 0) {
      tour.itineraries.forEach((it) => {
        addPhoto(it.image, it.title, it.short_description);
        if (it.images && it.images.length > 0) {
          it.images.forEach((img) => addPhoto(img, it.title));
        }
      });
    }

    // Additional passed images
    if (images && images.length > 0) {
      images.forEach((img) => addPhoto(img));
    }

    return photos;
  }, [
    tour.banner_image,
    tour.mobile_cover_image,
    tour.gallery,
    tour.itineraries,
    images,
    title,
    tour.subtitle,
  ]);

  // Ensure every tour has at least 5 photos for the unified 5-photo mosaic layout
  const mosaicItems = useMemo(() => {
    const items = [...galleryItems];
    const fallbackPool = [
      "/images/hero-1.jpg",
      "/images/hero-2.jpg",
      "/images/destination-desert.jpg",
      "/images/destination-alpine.jpg",
      "/images/hero-3.jpg",
      "/images/about-mountain.png",
    ];
    let fallbackIndex = 0;
    while (items.length < 5) {
      const fallbackUrl = fallbackPool[fallbackIndex % fallbackPool.length];
      items.push({
        url: fallbackUrl,
        title: `${title} photo ${items.length + 1}`,
        caption: "",
      });
      fallbackIndex++;
    }
    return items;
  }, [galleryItems, title]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (idx = 0) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  // Dynamic Departure Dates from Backend Calendar / Departures
  const realDates = useMemo(() => {
    const source = [...(tour.calendar || []), ...(tour.departures || [])];
    const map = new Map<
      string,
      { id: number | string; date: string; slots?: number; status?: string }
    >();
    // Hide departures inside the Minimum Advance Booking window -- booking
    // creation rejects them (tour_availability.assert_meets_advance_booking_window),
    // so offering them here only leads to an error at checkout.
    const earliest = new Date();
    earliest.setHours(0, 0, 0, 0);
    earliest.setDate(earliest.getDate() + Math.max(0, Number(tour.min_advance_booking_days ?? 0)));
    const earliestKey = `${earliest.getFullYear()}-${String(earliest.getMonth() + 1).padStart(2, "0")}-${String(earliest.getDate()).padStart(2, "0")}`;
    source.forEach((item) => {
      if (
        item &&
        item.date &&
        item.status !== "unavailable" &&
        item.status !== "cancelled" &&
        item.date.split("T")[0] >= earliestKey
      ) {
        const dateKey = item.date.split("T")[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, item);
        }
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [tour.calendar, tour.departures, tour.min_advance_booking_days]);

  const monthGroups: MonthGroup[] = useMemo(() => {
    if (realDates.length === 0) return [];
    const groupMap = new Map<string, DepartureDateItem[]>();
    const monthNameMap = new Map<string, string>();
    realDates.forEach((rd) => {
      const dObj = new Date(
        rd.date.includes("T") ? rd.date : `${rd.date}T00:00:00`,
      );
      if (Number.isNaN(dObj.getTime())) return;
      const year = dObj.getFullYear();
      const monthNum = dObj.getMonth() + 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, "0")}`;
      const monthName = dObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const cardDate = dObj.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const slots = rd.slots ?? null;
      const seats =
        slots == null
          ? "Available"
          : slots > 0
            ? `${slots} Seats Left`
            : "Available";

      if (!groupMap.has(monthKey)) {
        groupMap.set(monthKey, []);
        monthNameMap.set(monthKey, monthName);
      }
      groupMap.get(monthKey)!.push({
        id: String(rd.id || rd.date),
        date: cardDate,
        isoDate: rd.date.split("T")[0],
        seats,
        urgent: slots != null && slots > 0 && slots <= 5,
        slotsRemaining: slots,
      });
    });

    const sortedKeys = Array.from(groupMap.keys()).sort();
    return sortedKeys.map((key) => ({
      name: monthNameMap.get(key) || key,
      key,
      dates: groupMap.get(key)!,
    }));
  }, [realDates]);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [datePageIndex, setDatePageIndex] = useState(0);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement>(null);
  const safeMonthIndex = Math.min(
    Math.max(0, currentMonthIndex),
    Math.max(0, monthGroups.length - 1),
  );
  const currentMonth = useMemo(
    () =>
      monthGroups[safeMonthIndex] || {
        name: "No departures",
        key: "none",
        dates: [],
      },
    [monthGroups, safeMonthIndex],
  );
  const datePageCount = Math.max(1, Math.ceil(currentMonth.dates.length / 3));
  const safeDatePageIndex = Math.min(datePageIndex, datePageCount - 1);
  const visibleDepartureDates = currentMonth.dates.slice(
    safeDatePageIndex * 3,
    safeDatePageIndex * 3 + 3,
  );

  useEffect(() => {
    setDatePageIndex(0);
  }, [safeMonthIndex]);

  useEffect(() => {
    if (!monthMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(event.target as Node)) setMonthMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMonthMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [monthMenuOpen]);

  const [selectedDateId, setSelectedDateId] = useState<string>("");

  useEffect(() => {
    if (initialTravelDate && monthGroups.length > 0) {
      const targetIso = toIsoDate(initialTravelDate);
      for (let mIdx = 0; mIdx < monthGroups.length; mIdx++) {
        const found = monthGroups[mIdx].dates.find(
          (d) => d.isoDate === targetIso || toIsoDate(d.date) === targetIso
        );
        if (found) {
          setCurrentMonthIndex(mIdx);
          setSelectedDateId(found.id);
          return;
        }
      }
    }
  }, [initialTravelDate, monthGroups]);

  useEffect(() => {
    if (currentMonth && currentMonth.dates.length > 0) {
      if (
        !selectedDateId ||
        !currentMonth.dates.some((d) => d.id === selectedDateId)
      ) {
        setSelectedDateId(currentMonth.dates[0].id);
      }
    }
  }, [currentMonth, selectedDateId]);

  // Dynamic Pricing Tiers directly from Backend
  const pricingRows = useMemo(
    () =>
      [...(tour.pricing || [])].sort((a, b) => a.persons_from - b.persons_from),
    [tour.pricing],
  );

  const selectedDeparture = currentMonth.dates.find(
    (d) => d.id === selectedDateId,
  );
  const selectedDepartureIso = selectedDeparture?.isoDate || toIsoDate(selectedDeparture?.date);

  // The price is date-sensitive. Notify the owning page whenever the
  // traveller changes departure so it reloads the server-authoritative
  // seasonal discount and pricing rows.
  useEffect(() => {
    if (selectedDepartureIso) onTravelDateChange?.(selectedDepartureIso);
  }, [selectedDepartureIso, onTravelDateChange]);
  const maxTravellers = Math.max(
    1,
    selectedDeparture?.slotsRemaining ?? (tour.max_group_size || MAX_TRAVELLERS_CEILING),
  );
  const [adults, setAdults] = useState(
    Math.min(initialAdults || 2, maxTravellers),
  );
  const [children, setChildren] = useState(initialChildren || 0);

  useEffect(() => {
    setAdults((a) => {
      const clampedAdults = Math.min(a, maxTravellers);
      setChildren((c) =>
        Math.min(c, Math.max(0, maxTravellers - clampedAdults)),
      );
      return clampedAdults;
    });
  }, [maxTravellers]);

  const travellerCount = adults + children;
  const selectedGroupTier = useMemo(() => {
    const idx = pricingRows.findIndex(
      (row) =>
        travellerCount >= row.persons_from &&
        (row.persons_to == null || travellerCount <= row.persons_to),
    );
    return idx === -1 ? 0 : idx;
  }, [pricingRows, travellerCount]);

  // Dynamic Price Calculations (Using Real Currency & Real Numbers from Tour)
  const tourCurrency = tour.currency || "USD";
  const baseRow = pricingRows[0];
  const selectedRow = pricingRows[selectedGroupTier] ?? baseRow;
  const unitPrice = Number(
    selectedRow?.price_per_person ??
      tour.discounted_price_per_person ??
      tour.price_start_per_person ??
      0,
  );
  const childUnitPrice = Number(
    selectedRow?.child_price_per_person ?? unitPrice,
  );
  const tourPrice = adults * unitPrice + children * childUnitPrice;

  // Real backend discount & reference prices
  const originalUnitPrice = Number(
    selectedRow?.original_price_per_person ?? unitPrice,
  );
  const originalChildUnitPrice = Number(
    selectedRow?.original_child_price_per_person ?? childUnitPrice,
  );
  const baseOriginalUnitPrice = Number(
    baseRow?.original_price_per_person ??
      baseRow?.price_per_person ??
      originalUnitPrice,
  );
  const baseOriginalChildUnitPrice = Number(
    baseRow?.original_child_price_per_person ??
      baseRow?.child_price_per_person ??
      originalChildUnitPrice,
  );
  const originalTourPrice =
    adults * baseOriginalUnitPrice + children * baseOriginalChildUnitPrice;
  const groupDiscount = Math.max(0, Math.round(originalTourPrice - tourPrice));
  const promoActive = Boolean(
    tour.discount_percentage &&
    tour.discount_percentage > 0 &&
    (originalUnitPrice > unitPrice || originalChildUnitPrice > childUnitPrice),
  );
  const totalAmount = Math.max(0, tourPrice);
  const perPersonPrice = Math.round(tourPrice / Math.max(1, travellerCount));

  // Supplier-discount saving on the selected tier: that tier's own pre-discount
  // total minus what is charged. Group-size saving is separate: how much less
  // the selected tier costs than the first (solo) tier, both after discount.
  const tierOriginalTotal =
    adults * originalUnitPrice + children * originalChildUnitPrice;
  // The API gives the two calculation stages separately. When a TourVaa
  // offer exists, the row's comparison price is already after the supplier
  // offer, so reconstruct the raw storefront reference only for this clear
  // customer-facing breakdown.
  const supplierDiscountPercent = Number(tour.supplier_discount_percentage ?? 0);
  const tourvaaDiscountPercent = Number(tour.tourvaa_discount_percentage ?? 0);
  const activeDiscountLabels = [
    supplierDiscountPercent > 0
      ? `${tour.supplier_discount_name || "Supplier discount"} (${supplierDiscountPercent}%)`
      : null,
    tourvaaDiscountPercent > 0
      ? `${tour.tourvaa_discount_name || "TourVaa discount"} (${tourvaaDiscountPercent}%)`
      : null,
  ].filter((label): label is string => Boolean(label));
  const rawTourPrice = tourvaaDiscountPercent > 0 && supplierDiscountPercent > 0
    ? tierOriginalTotal / (1 - supplierDiscountPercent / 100)
    : tierOriginalTotal;
  const afterSupplierTotal = rawTourPrice * (1 - supplierDiscountPercent / 100);
  const supplierDiscountAmount = Math.max(0, rawTourPrice - afterSupplierTotal);
  const tourvaaDiscountAmount = Math.max(0, afterSupplierTotal - tourPrice);
  const totalDiscountSaving = Math.max(0, rawTourPrice - tourPrice);
  const baseUnitPrice = Number(baseRow?.price_per_person ?? unitPrice);
  const baseChildUnitPrice = Number(
    baseRow?.child_price_per_person ?? childUnitPrice,
  );
  const groupSaving = Math.max(
    0,
    Math.round(
      adults * baseUnitPrice + children * baseChildUnitPrice - tourPrice,
    ),
  );

  // "Starting from" is the cheapest tier (after discount), not the selected one.
  const cheapestRow = pricingRows.reduce<
    (typeof pricingRows)[number] | undefined
  >(
    (min, row) =>
      min === undefined || row.price_per_person < min.price_per_person
        ? row
        : min,
    undefined,
  );
  const startingUnitPrice = Number(cheapestRow?.price_per_person ?? unitPrice);
  const startingOriginalPrice = Number(
    cheapestRow?.original_price_per_person ?? startingUnitPrice,
  );
  // A price row compares against the amount after the supplier discount when
  // a TourVaa offer is also active. Rebuild the raw storefront reference.
  const startingRawOriginalPrice =
    tourvaaDiscountPercent > 0 && supplierDiscountPercent > 0
      ? startingOriginalPrice / (1 - supplierDiscountPercent / 100)
      : startingOriginalPrice;
  const startingDiscountSaving = Math.max(
    0,
    startingRawOriginalPrice - startingUnitPrice,
  );
  const startingTierLabel = cheapestRow
    ? groupTierLabel(cheapestRow.persons_from, cheapestRow.persons_to)
    : "";

  // Live deposit offer for the selected date, from the same eligibility
  // rule checkout and booking creation enforce (GET
  // /tours/{id}/deposit-options -> tour_availability._deposit_window): a
  // deposit is only offered when booking more than X weeks before the
  // Minimum Advance cutoff. Customers get the tour's deposit terms ("Secure
  // with a Deposit"); agents get the Reserve Now percentage.
  const [depositOptions, setDepositOptions] = useState<{
    customer: { eligible: boolean; due_date: string | null; deposit_type: "percentage" | "fixed" | null; deposit_percentage: number | null; booking_deposit: number | null };
    agent: { eligible: boolean; due_date: string | null; deposit_percentage: number };
  } | null>(null);
  const selectedIsoDate = selectedDeparture?.isoDate;
  useEffect(() => {
    if (!tour.id || !selectedIsoDate) {
      setDepositOptions(null);
      return;
    }
    let active = true;
    publicApi
      .get(`/tours/${tour.id}/deposit-options`, { params: { travel_date: selectedIsoDate } })
      .then((res) => { if (active) setDepositOptions(res.data?.data ?? null); })
      .catch(() => { if (active) setDepositOptions(null); });
    return () => { active = false; };
  }, [tour.id, selectedIsoDate]);

  const depositOffer = (() => {
    if (!depositOptions || totalAmount <= 0) return null;
    if (agentBooking) {
      const { eligible, due_date, deposit_percentage } = depositOptions.agent;
      if (!eligible) return null;
      return { percent: deposit_percentage, amount: Math.round((totalAmount * deposit_percentage) / 100), dueDate: due_date };
    }
    const c = depositOptions.customer;
    if (!c.eligible) return null;
    if (c.deposit_type === "percentage" && c.deposit_percentage) {
      return { percent: c.deposit_percentage, amount: Math.round((totalAmount * c.deposit_percentage) / 100), dueDate: c.due_date };
    }
    if (c.booking_deposit) {
      return { percent: null, amount: Math.min(totalAmount, c.booking_deposit), dueDate: c.due_date };
    }
    return null;
  })();
  const depositPercent = depositOffer?.percent ?? null;
  const depositDue = depositOffer?.amount ?? null;
  const agentReserveEligible = Boolean(
    agentBooking && depositOptions?.agent.eligible && depositDue != null,
  );

  // Highlights: Dynamic only
  const highlightsList = useMemo(() => {
    if (tour.highlights && tour.highlights.length > 0) {
      return tour.highlights.map((h, idx) => ({
        title: h.title || h.text || `Highlight ${idx + 1}`,
        desc: h.description || "",
        img: h.image
          ? mediaUrl(h.image)
          : galleryItems[idx % Math.max(1, galleryItems.length)]?.url,
      }));
    }
    // If tour has no highlights array but has activities in itinerary, extract them dynamically
    if (tour.itineraries && tour.itineraries.length > 0) {
      const allActivities: { title: string; desc: string; img?: string }[] = [];
      tour.itineraries.forEach((it, iIdx) => {
        const split = splitList(it.activities);
        split.forEach((act) => {
          allActivities.push({
            title: act,
            desc: it.title ? `Featured on ${it.title}` : "",
            img: it.image
              ? mediaUrl(it.image)
              : galleryItems[iIdx % Math.max(1, galleryItems.length)]?.url,
          });
        });
      });
      if (allActivities.length > 0) {
        return allActivities.slice(0, 6);
      }
    }
    return [];
  }, [tour.highlights, tour.itineraries, galleryItems]);

  // Inclusions & Exclusions: 100% Dynamic
  const inclusionsList = useMemo(
    () => tour.inclusions || [],
    [tour.inclusions],
  );
  const exclusionsList = useMemo(
    () => tour.exclusions || [],
    [tour.exclusions],
  );

  // Itineraries: 100% Dynamic
  const [itineraryMode, setItineraryMode] = useState<"detailed" | "overview">(
    "detailed",
  );
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({
    1: true,
  });

  const toggleDay = (day: number) => {
    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const itineraryList = useMemo(() => {
    if (tour.itineraries && tour.itineraries.length > 0) {
      return tour.itineraries.map((it, idx) => {
        const rawSummary = (
          it.short_description ||
          it.description ||
          ""
        ).trim();
        const candidateDetail = (
          it.long_description ||
          (!it.short_description ? it.description : "") ||
          ""
        ).trim();
        const detail =
          candidateDetail && candidateDetail !== rawSummary
            ? candidateDetail
            : "";
        // Skip the separate summary callout when the detail paragraph
        // already opens with that same sentence -- otherwise the exact same
        // line shows up twice in a row (once in the blue callout, again as
        // the first line of the detail box below it).
        const summary =
          detail && detail.toLowerCase().startsWith(rawSummary.toLowerCase())
            ? ""
            : rawSummary;
        const activities = splitList(it.activities);

        return {
          day: it.day || idx + 1,
          title: it.title || `Day ${idx + 1}`,
          summary,
          detail,
          startPoint: it.location ? `${it.location}` : startLocation,
          transport: it.transport || "",
          travelTime: [it.travel_duration, it.travel_distance]
            .filter(Boolean)
            .join(" · "),
          startTime: it.start_time || "",
          endTime: it.end_time || "",
          meals: splitList(it.meals),
          accommodation: it.accommodation || "",
          activities,
          optionalActivities: splitList(it.optional_activities),
          importantNotes: it.important_notes || "",
          location: it.location || "",
          isFreeDay: it.day_type === "free_day",
          photos:
            it.images && it.images.length > 0
              ? it.images.map(mediaUrl)
              : it.image
                ? [mediaUrl(it.image)]
                : galleryItems.slice(0, 3).map((g) => g.url),
        };
      });
    }
    return [];
  }, [tour.itineraries, galleryItems, startLocation]);

  const allDaysExpanded = useMemo(() => {
    return (
      itineraryList.length > 0 && itineraryList.every((d) => openDays[d.day])
    );
  }, [itineraryList, openDays]);

  const toggleAllDays = () => {
    if (allDaysExpanded) {
      setOpenDays({});
    } else {
      const next: Record<number, boolean> = {};
      itineraryList.forEach((d) => {
        next[d.day] = true;
      });
      setOpenDays(next);
    }
  };

  // Sticky Bottom Bar Visibility on Scroll
  const [showStickyBottom, setShowStickyBottom] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const { isCompared, toggleCompare, compareCount } = useTravelStore();
  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  const travelItem: TravelItem = useMemo(
    () => ({
      id: tour.id,
      title: tour.title,
      place:
        [tour.city_name, tour.country_name].filter(Boolean).join(", ") ||
        "Worldwide",
      image: galleryItems[0]?.url || "",
      price: tour.price_start_per_person,
      currency: tour.currency || "USD",
      duration: durationLabel || "",
      href:
        typeof window !== "undefined"
          ? window.location.pathname
          : `/tours/${tour.slug || tour.id}`,
    }),
    [
      tour.id,
      tour.title,
      tour.city_name,
      tour.country_name,
      galleryItems,
      tour.price_start_per_person,
      tour.currency,
      durationLabel,
      tour.slug,
    ],
  );

  const compared = isCompared(tour.id);

  const handleCompareToggle = () => {
    const res = toggleCompare(travelItem);
    if (res.limitReached) {
      setCompareNotice("Compare limit reached (max 4 tours)");
      setTimeout(() => setCompareNotice(null), 3000);
    } else if (res.added) {
      setCompareNotice("Added to comparison!");
      setTimeout(() => setCompareNotice(null), 2500);
    } else {
      setCompareNotice("Removed from comparison");
      setTimeout(() => setCompareNotice(null), 2000);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 480;
      setShowStickyBottom(scrolled);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleBookNow = (agentAction?: "reserve" | "full") => {
    const chosen = currentMonth.dates.find((d) => d.id === selectedDateId);
    const chosenDate = chosen?.isoDate || toIsoDate(chosen?.date) || toIsoDate(initialTravelDate);
    if (!chosenDate) return;
    onBook({
      travelDate: chosenDate,
      adults,
      children,
      agentAction,
    });
  };

  const scrollToBooking = () => {
    const widget = document.getElementById("booking-widget");
    if (widget) {
      widget.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="min-h-screen bg-white pb-28 pt-3 text-slate-900 font-sans antialiased">
      {modal}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && mosaicItems.length > 0 && (
        <LightboxModal
          photos={mosaicItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* ── 1. BREADCRUMBS & TOP ACTIONS ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
          <nav className="flex flex-wrap items-center gap-2 text-slate-500 font-medium">
            <Link href="/" className="hover:text-blue-600 transition">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/tours" className="hover:text-blue-600 transition">
              Tours
            </Link>
            {destination && (
              <>
                <span className="text-slate-300">/</span>
                <Link
                  href={destinationUrl(destination)}
                  className="hover:text-blue-600 transition flex items-center gap-1 font-semibold text-slate-700"
                >
                  {countryFlag && <span>{countryFlag}</span>}
                  <span>{destination}</span>
                </Link>
              </>
            )}
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[280px] sm:max-w-md">
              {title}
            </span>
          </nav>

          <div className="flex items-center gap-2 relative">
            {/* Compare Notification Toast */}
            {compareNotice && (
              <div className="absolute right-0 top-10 z-50 rounded-xl bg-slate-900/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-semibold text-white shadow-xl flex items-center gap-2 animate-fade-in border border-white/10 whitespace-nowrap">
                <span>{compareNotice}</span>
                {compareCount > 0 && (
                  <Link
                    href="/compare"
                    className="underline text-amber-300 hover:text-amber-200 font-bold"
                  >
                    View ({compareCount})
                  </Link>
                )}
              </div>
            )}

            {/* Compare Button */}
            <button
              type="button"
              onClick={handleCompareToggle}
              aria-label={
                compared
                  ? "Remove from tour comparison"
                  : "Add to tour comparison"
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${
                compared
                  ? "border-blue-400 bg-blue-50 text-blue-700 font-bold shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/40"
              }`}
            >
              <ArrowLeftRight
                size={14}
                className={
                  compared ? "text-blue-600 stroke-[2.5]" : "text-slate-500"
                }
              />
              <span>{compared ? "Compared" : "Compare"}</span>
              {compareCount > 0 && (
                <Link
                  href="/compare"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-semibold text-white hover:bg-blue-700 transition"
                  title="View comparison page"
                >
                  {compareCount}
                </Link>
              )}
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <CheckCheck size={14} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} className="text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Save / Wishlist Button */}
            <button
              type="button"
              onClick={onWishlist}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${
                wishlisted
                  ? "border-red-200 bg-red-50 text-red-600 font-bold"
                  : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-600"
              }`}
            >
              <Heart
                size={14}
                className={wishlisted ? "fill-current text-red-600" : ""}
              />
              <span>{wishlisted ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>

        {/* ── 2. TOUR TITLE & REAL BADGES ── */}
        <section className="mt-2">
          <div className="flex flex-wrap items-center gap-2">
            {tour.category_name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                <Sparkles size={12} className="text-blue-600" />
                {tour.category_name}
              </span>
            )}
            {countryFlag && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                <span>{countryFlag}</span>
                <span>{destination}</span>
              </span>
            )}
            {realDates.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
                <Ticket size={12} className="text-amber-600" />
                {realDates.length} Bookable Departures
              </span>
            )}
          </div>

          <h1 className="mt-2.5 text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-950 tracking-tight leading-tight">
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-600">
            {tour.rating_average != null && tour.rating_average > 0 ? (
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="text-slate-900 font-semibold">
                  {tour.rating_average}
                </span>
                {tour.rating_count ? (
                  <span className="text-slate-400 font-normal">
                    ({tour.rating_count} reviews)
                  </span>
                ) : null}
              </div>
            ) : null}
            {routeSummary && (
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                <MapPin size={15} className="text-blue-600" />
                <span>{routeSummary}</span>
              </div>
            )}
            {durationLabel && (
              <div className="flex items-center gap-1 font-medium text-slate-600">
                <Clock size={15} className="text-blue-600" />
                <span>{durationLabel}</span>
              </div>
            )}
            {tour.cancellation_policy &&
              tour.cancellation_policy.length > 0 && (
                <div className="flex items-center gap-1 font-medium text-emerald-600">
                  <Check size={14} className="stroke-[3]" />
                  <span>Cancellation policy available</span>
                </div>
              )}
          </div>
        </section>

        {/* ── 3. DYNAMIC PHOTO GALLERY (Unified 5-Photo Mosaic Layout for ALL Tours) ── */}
        <section className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 h-[340px] sm:h-[420px] md:h-[460px]">
            {/* Slot 1: Large Feature Photo (Spans 2 columns on desktop) */}
            <div
              onClick={() => openLightbox(0)}
              className="group relative md:col-span-2 h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 cursor-pointer shadow-sm"
            >
              <MarketingImage
                src={mosaicItems[0].url}
                alt={mosaicItems[0].title || title}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                <p className="text-base sm:text-xl font-bold text-white line-clamp-1 drop-shadow-md">
                  {title}
                </p>
              </div>
            </div>

            {/* Slots 2 to 5: 2x2 Grid on desktop */}
            <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2.5 h-full">
              {mosaicItems.slice(1, 5).map((item, idx) => {
                const actualIndex = idx + 1;
                const isLast = idx === 3;
                return (
                  <div
                    key={idx}
                    onClick={() => openLightbox(actualIndex)}
                    className="group relative h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    <MarketingImage
                      src={item.url}
                      alt={item.title || `Tour photo ${actualIndex}`}
                      fill
                      sizes="25vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {isLast && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(0);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/45 hover:bg-black/55 backdrop-blur-xs transition text-white font-bold text-xs sm:text-sm gap-2 cursor-pointer"
                      >
                        <Camera size={18} />
                        <span>
                          View All {Math.max(galleryItems.length, 5)} Photos
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* View all photos button on mobile */}
          <div className="mt-2.5 flex justify-end md:hidden">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm cursor-pointer"
            >
              <Camera size={14} />
              <span>View All {Math.max(galleryItems.length, 5)} Photos</span>
            </button>
          </div>
        </section>

        {/* ── 4. DYNAMIC PRICE HIGHLIGHT BANNER ── */}
        <section className="mt-6 rounded-2xl bg-gradient-to-r from-[#0B1F3A] via-[#102A4E] to-[#1E3A8A] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-blue-900/50">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          <div className="absolute right-32 -bottom-20 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Dynamic Price Breakdown */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                {promoActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-950 uppercase tracking-wider shadow-sm">
                    <Flame size={14} className="fill-slate-950" />
                    {activeDiscountLabels.length > 0
                      ? `Offers applied · ${activeDiscountLabels.join(" + ")}`
                      : `Special Promotion · Save ${tour.discount_percentage}%`}
                  </span>
                )}
                {pricingRows.length > 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                    <BadgePercent size={14} className="text-amber-300" />
                    {pricingRows.length} Group Pricing Tiers
                    {startingTierLabel ? ` · Best rate: ${startingTierLabel}` : ""}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
                  Starting from
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {format(startingUnitPrice, tourCurrency)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-blue-200">
                    / person
                  </span>
                </div>
                {promoActive && startingRawOriginalPrice > startingUnitPrice && (
                  <span className="text-base sm:text-lg text-slate-400 line-through font-semibold">
                    {format(startingRawOriginalPrice, tourCurrency)}
                  </span>
                )}
                {promoActive && startingDiscountSaving > 0 ? (
                  <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    Save {format(startingDiscountSaving, tourCurrency)} per person
                  </span>
                ) : groupDiscount > 0 && (
                  <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    Save {format(groupDiscount, tourCurrency)} for your party
                  </span>
                )}
              </div>

              {/* Highlights from Real Data */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-blue-100 font-medium">
                {selectedRow?.child_price_per_person != null && (
                  <span className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-400 stroke-[3]" />
                    <span>
                      <b>Child Rate:</b> {format(childUnitPrice, tourCurrency)}{" "}
                      / child
                    </span>
                  </span>
                )}
                {depositDue != null && (
                  <span className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-400 stroke-[3]" />
                    <span>
                      <b>{agentBooking ? "Reserve Now:" : "Secure with a Deposit:"}</b>{" "}
                      {depositPercent != null ? `${depositPercent}%` : ""} (
                      {format(depositDue, tourCurrency)})
                    </span>
                  </span>
                )}
                {tour.min_advance_booking_days != null && (
                  <span className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-400 stroke-[3]" />
                    <span>
                      Book at least {tour.min_advance_booking_days} days before
                      departure
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: CTA */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <button
                type="button"
                onClick={scrollToBooking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-pub-accent hover:bg-[#cf4b24] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition active:scale-[0.99] cursor-pointer"
              >
                <span>Check Availability &amp; Book</span>
                <ArrowRight size={16} />
              </button>
              <p className="text-[11px] text-blue-200 flex items-center gap-1">
                <Lock size={12} className="text-amber-400" />
                <span>All Taxes &amp; Fees Included · Secure Booking</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. MAIN 2-COLUMN SECTION (DYNAMIC CONTENT + STICKY BOOKING WIDGET) ── */}
        <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_410px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-8">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-10 min-w-0">
            {/* A. OVERVIEW SECTION */}
            <div id="overview" className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Compass size={17} />
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                  Tour Overview
                </h2>
              </div>

              {tour.subtitle && (
                <p className="text-base sm:text-lg font-semibold text-black leading-relaxed">
                  {tour.subtitle}
                </p>
              )}

              {tour.short_description && (
                <TextParagraphs
                  text={tour.short_description}
                  className="text-[15px] font-normal leading-7 text-slate-800 sm:text-base"
                />
              )}

              {tour.long_description && (
                <TextParagraphs
                  text={tour.long_description}
                  className="text-[15px] font-normal leading-7 text-slate-800 sm:text-base"
                />
              )}

              {tour.overview?.why_choose_this_tour && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={15} className="text-blue-600" />
                    <p className="text-sm sm:text-base font-bold text-black">
                      Why Choose This Tour
                    </p>
                  </div>
                  <TextParagraphs
                    text={tour.overview.why_choose_this_tour}
                    className="text-[15px] font-normal leading-7 text-slate-800 sm:text-base"
                  />
                </div>
              )}

              {tour.overview?.ideal_for && (
                <div className="mt-3 flex items-start gap-2">
                  <Users size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="text-[15px] sm:text-base leading-relaxed text-black">
                    <span className="font-bold text-black">Ideal for: </span>
                    {tour.overview.ideal_for}
                  </p>
                </div>
              )}

              {(tour.overview?.transportation_summary ||
                tour.overview?.accommodation_summary) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  {tour.overview?.transportation_summary && (
                    <div className="flex items-start gap-2">
                      <Bus size={15} className="mt-0.5 shrink-0 text-violet-600" />
                      <div>
                        <p className="text-xs font-bold text-black uppercase tracking-wider">
                          Transportation
                        </p>
                        <p className="text-sm leading-relaxed text-black mt-0.5 font-normal">
                          {tour.overview.transportation_summary}
                        </p>
                      </div>
                    </div>
                  )}
                  {tour.overview?.accommodation_summary && (
                    <div className="flex items-start gap-2">
                      <Hotel size={15} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-black uppercase tracking-wider">
                          Accommodation
                        </p>
                        <p className="text-sm leading-relaxed text-black mt-0.5 font-normal">
                          {tour.overview.accommodation_summary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Download Brochure & Map links */}
              {(tour.map_image || tour.tour_video_url || tour.brochure_pdf) && (
                <div className="mt-5 flex flex-wrap gap-2.5 pt-4 border-t border-slate-100">
                  {tour.map_image && (
                    <a
                      href={mediaUrl(tour.map_image)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition"
                    >
                      <MapIcon size={14} />
                      <span>View Route Map</span>
                    </a>
                  )}
                  {tour.brochure_pdf && (
                    <a
                      href={mediaUrl(tour.brochure_pdf)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition"
                    >
                      <Download size={14} />
                      <span>Download Brochure</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── TRAVEL ESSENTIALS / KEY FACTS (Moved directly after Tour Overview) ── */}
            {(durationLabel ||
              tour.max_group_size ||
              tour.min_booking_size ||
              tour.overview?.group_size ||
              tour.tour_language ||
              tour.overview?.tour_type ||
              startLocation ||
              finishLocation ||
              tour.overview?.meal_summary ||
              (tour.itineraries && tour.itineraries.some((it) => it.meals)) ||
              tour.overview?.best_season ||
              tour.overview?.tour_pace ||
              tour.suitable_age_range) && (
              <div id="key-facts" className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Clock size={16} />
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                    Travel Essentials
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-3.5">
                  {durationLabel && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-sky-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white shadow-xs">
                        <Clock size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Duration
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {durationLabel}
                        </p>
                      </div>
                    </div>
                  )}

                  {(tour.max_group_size ||
                    tour.min_booking_size ||
                    tour.overview?.group_size) && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white shadow-xs">
                        <Users size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Group Size
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {tour.min_booking_size && tour.max_group_size
                            ? `${tour.min_booking_size}–${tour.max_group_size} Guests`
                            : tour.max_group_size
                              ? `Up to ${tour.max_group_size} Guests`
                              : tour.overview?.group_size}
                        </p>
                      </div>
                    </div>
                  )}

                  {(tour.tour_language || tour.overview?.tour_type) && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-amber-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white shadow-xs">
                        <User size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Tour Guide
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {tour.tour_language
                            ? `In ${tour.tour_language}`
                            : tour.overview?.tour_type}
                        </p>
                      </div>
                    </div>
                  )}

                  {(startLocation || finishLocation) && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-violet-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white shadow-xs">
                        <Car size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Start / Finish
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {routeSummary}
                        </p>
                      </div>
                    </div>
                  )}

                  {(tour.overview?.meal_summary ||
                    (tour.itineraries &&
                      tour.itineraries.some((it) => it.meals))) && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-rose-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-rose-600 group-hover:text-white shadow-xs">
                        <Utensils size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Meals
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {tour.overview?.meal_summary ||
                            `${(tour.itineraries ?? []).filter((it) => it.meals).length} of ${(tour.itineraries ?? []).length} days include meals`}
                        </p>
                      </div>
                    </div>
                  )}

                  {tour.overview?.best_season && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-orange-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white shadow-xs">
                        <Sun size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Best Season
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {tour.overview.best_season}
                        </p>
                      </div>
                    </div>
                  )}

                  {tour.overview?.tour_pace && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white shadow-xs">
                        <Gauge size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Tour Pace
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {tour.overview.tour_pace}
                        </p>
                      </div>
                    </div>
                  )}

                  {tour.suitable_age_range && (
                    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-teal-300 hover:shadow-md">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white shadow-xs">
                        <Ticket size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          Age Range
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {tour.suitable_age_range}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* B. TOUR HIGHLIGHTS (Rendered dynamically if present) */}
            {highlightsList.length > 0 && (
              <div id="highlights" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Star size={16} className="fill-amber-400" />
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                      Tour Highlights
                    </h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {highlightsList.length} Highlights
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {highlightsList.map((h, i) => (
                    <div
                      key={i}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                    >
                      {h.img && (
                        <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                          <MarketingImage
                            src={h.img}
                            alt={h.title}
                            fill
                            sizes="(min-width: 640px) 50vw, 100vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                          <span className="absolute top-2.5 left-2.5 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                            Highlight #{i + 1}
                          </span>
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-base font-bold text-black leading-snug">
                            {h.title}
                          </h4>
                          {h.desc && (
                            <p className="mt-1 text-sm text-black leading-relaxed line-clamp-3 font-normal">
                              {h.desc}
                            </p>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-[11px] font-semibold text-blue-600">
                          <Check
                            size={12}
                            className="mr-1 text-emerald-600 stroke-[3]"
                          />
                          <span>Included in Experience</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C. DETAILED ITINERARY TIMELINE */}
            {itineraryList.length > 0 && (
              <div id="itinerary" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <MapIcon size={16} />
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                        Itinerary Timeline
                      </h3>
                      {durationLabel && (
                        <p className="text-xs text-slate-500">
                          {durationLabel}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleAllDays}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                    >
                      {allDaysExpanded ? "Collapse All" : "Expand All"}
                    </button>

                    <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setItineraryMode("detailed")}
                        className={`rounded-md px-3 py-1 transition cursor-pointer ${
                          itineraryMode === "detailed"
                            ? "bg-pub-primary text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Detailed
                      </button>
                      <button
                        type="button"
                        onClick={() => setItineraryMode("overview")}
                        className={`rounded-md px-3 py-1 transition cursor-pointer ${
                          itineraryMode === "overview"
                            ? "bg-pub-primary text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Overview
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {itineraryList.map((day, dIdx) => {
                    const isOpen = Boolean(openDays[day.day]);

                    return (
                      <div
                        key={dIdx}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
                      >
                        <button
                          type="button"
                          onClick={() => toggleDay(day.day)}
                          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50/70 cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-xs">
                              {day.day}
                            </span>
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                                Day 0{day.day}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {day.title}
                              </span>
                              {day.isFreeDay && (
                                <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                                  Free day
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition shrink-0">
                            {isOpen ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 bg-white p-5 space-y-4">
                            {day.summary &&
                              (day.summary.length > 160 ? (
                                // Long-form content with no separate short
                                // highlight (e.g. no short_description was
                                // set) -- the compact blue callout below is
                                // meant for a one-line highlight, not a full
                                // multi-sentence paragraph, so this uses the
                                // same plain card treatment as the detail
                                // box instead.
                                <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                                  <p className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5 mb-2.5">
                                    <MapIcon size={14} className="text-blue-500" />
                                    Day Overview
                                  </p>
                                  <TextParagraphs
                                    text={day.summary}
                                    className="text-[15px] font-normal leading-7 text-slate-800 sm:text-base"
                                  />
                                </div>
                              ) : (
                                <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-4">
                                  <p className="text-[15px] sm:text-base font-medium text-black flex items-start gap-2 leading-relaxed">
                                    <Sparkles
                                      size={16}
                                      className="text-blue-600 shrink-0 mt-0.5"
                                    />
                                    <span>{day.summary}</span>
                                  </p>
                                </div>
                              ))}

                            {itineraryMode === "detailed" && day.detail && (
                              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                                <p className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5 mb-2.5">
                                  <MapIcon size={14} className="text-blue-500" />
                                  Full Day Details
                                </p>
                                <TextParagraphs
                                  text={day.detail}
                                  className="text-[15px] font-normal leading-7 text-slate-800 sm:text-base"
                                />
                              </div>
                            )}

                            {/* Quick Facts Strip: Start, Timings, Transport (only if present) */}
                            {(day.startPoint ||
                              (day.startTime && day.endTime) ||
                              day.transport) && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                {day.startPoint && (
                                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 flex items-start gap-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                      <MapPin size={14} />
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Meeting Point
                                      </p>
                                      <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                                        {day.startPoint}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {(day.startTime || day.endTime) && (
                                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 flex items-start gap-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                      <Clock size={14} />
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Timings
                                      </p>
                                      <p className="text-xs font-semibold text-slate-800 mt-0.5">
                                        {[day.startTime, day.endTime]
                                          .filter(Boolean)
                                          .join(" – ")}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {day.transport && (
                                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 flex items-start gap-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                      <Bus size={14} />
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Transport
                                      </p>
                                      <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                                        {day.transport}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Key Stops List */}
                            {day.activities.length > 0 && (
                              <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-black mb-3">
                                  Included Activities &amp; Stops:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm sm:text-[15px]">
                                  {day.activities.map((act, aIdx) => (
                                    <div
                                      key={aIdx}
                                      className="flex items-start gap-2 text-black font-medium"
                                    >
                                      <Check
                                        size={15}
                                        className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]"
                                      />
                                      <span>{act}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Day Photos Grid */}
                            {day.photos.length > 0 && (
                              <div className="grid grid-cols-3 gap-2.5 pt-1">
                                {day.photos.slice(0, 3).map((pUrl, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => openLightbox(pIdx)}
                                    className="relative h-24 sm:h-32 overflow-hidden rounded-xl bg-slate-100 cursor-pointer group shadow-2xs"
                                  >
                                    <MarketingImage
                                      src={pUrl}
                                      alt=""
                                      fill
                                      sizes="33vw"
                                      className="object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Free day: optional partner experiences, only
                                on days an admin flagged as free/leisure
                                (day_type = free_day) - never guessed from
                                the text. Not part of this tour's booking. */}
                            {day.isFreeDay && (
                              <ExternalExperiencesSection
                                placement="show_on_itinerary"
                                source="free-day"
                                variant="compact"
                                limit={3}
                                location={day.location || undefined}
                                country={tour.country_name || undefined}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* D. WHAT'S INCLUDED & NOT INCLUDED (Rendered if either exists) */}
            {(inclusionsList.length > 0 || exclusionsList.length > 0) && (
              <div id="inclusions" className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Box size={16} />
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                      What&apos;s Included &amp; Excluded
                    </h3>
                    <p className="text-xs text-slate-500">
                      Package details for this tour
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-slate-200/80 pt-1">
                  {/* INCLUSIONS */}
                  {inclusionsList.length > 0 && (
                    <div className="md:pr-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                          ✓
                        </span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          What&apos;s Included
                        </h4>
                      </div>
                      <ul className="space-y-3.5 text-sm sm:text-[15px] text-black">
                        {inclusionsList.map((inc, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            {renderItemIcon(
                              inc.icon,
                              Check,
                              "text-emerald-600",
                            )}
                            <div>
                              <p className="font-bold text-black">
                                {inc.text}
                              </p>
                              {inc.description && (
                                <p className="text-xs sm:text-sm text-black/80 mt-0.5 font-normal">
                                  {inc.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* EXCLUSIONS */}
                  {exclusionsList.length > 0 && (
                    <div className="pt-6 md:pt-0 md:pl-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                          ✕
                        </span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                          What&apos;s Not Included
                        </h4>
                      </div>
                      <ul className="space-y-3.5 text-sm sm:text-[15px] text-black">
                        {exclusionsList.map((exc, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            {renderItemIcon(exc.icon, X, "text-rose-500")}
                            <div>
                              <p className="font-bold text-black">
                                {exc.text}
                              </p>
                              {exc.description && (
                                <p className="text-xs sm:text-sm text-black/80 mt-0.5 font-normal">
                                  {exc.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* E. ENHANCE YOUR TOUR (Accommodations / Activities / Extensions) */}
            {(tour.accommodations.length > 0 ||
              tour.optional_activities.length > 0 ||
              tour.extensions.length > 0) && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-950">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Sparkles size={16} />
                  </span>
                  <span>Enhance Your Tour</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tour.accommodations.map((item) => (
                    <div
                      key={`accommodation-${item.id}`}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                        Accommodation
                      </p>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {item.description}
                        </p>
                      )}
                      {item.price != null && (
                        <p className="mt-3 text-xs font-bold text-slate-800">
                          + {format(item.price, tourCurrency)}
                        </p>
                      )}
                    </div>
                  ))}
                  {tour.optional_activities.map((item) => (
                    <div
                      key={`activity-${item.id}`}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-violet-600">
                        Optional activity
                      </p>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-3 space-y-0.5 text-xs font-bold text-slate-800">
                        {item.price != null && (
                          <p>
                            +{" "}
                            {format(item.price, item.currency || tourCurrency)}{" "}
                            / adult
                          </p>
                        )}
                        {item.child_price != null && (
                          <p className="text-slate-600">
                            +{" "}
                            {format(
                              item.child_price,
                              item.currency || tourCurrency,
                            )}{" "}
                            / child
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {tour.extensions.map((item) => (
                    <div
                      key={`extension-${item.id}`}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        Tour extension
                      </p>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {item.description}
                        </p>
                      )}
                      {item.price != null && (
                        <p className="mt-3 text-xs font-bold text-slate-800">
                          + {format(item.price, tourCurrency)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* F. CANCELLATION POLICY */}
            {tour.cancellation_policy &&
              tour.cancellation_policy.length > 0 && (
              <div id="policies" className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <ShieldCheck size={16} />
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                    Cancellation Policy
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                        <Check size={13} className="stroke-[3]" />
                        <span>Refund Schedule</span>
                      </p>
                      <div className="mt-2 divide-y divide-slate-200/60">
                        {tour.cancellation_policy.map((rule, index) => (
                          <div
                            key={index}
                            className="py-2 flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">
                              {rule.days_before_max == null
                                ? `${rule.days_before_min}+ days before departure`
                                : `${rule.days_before_min}–${rule.days_before_max} days before departure`}
                            </span>
                            <span className="font-bold text-emerald-700">
                              {rule.refund_percentage}% refund
                            </span>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              </div>
              )}

            {/* G. REVIEWS (Rendered dynamically only when real reviews exist in backend) */}
            {tour.reviews && tour.reviews.length > 0 && (
              <div id="reviews" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                      Guest Reviews &amp; Ratings
                    </h3>
                    <p className="text-xs text-slate-500">Verified reviews</p>
                  </div>
                  {tour.rating_average != null && (
                    <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200">
                      <Star
                        size={18}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span className="text-base font-black text-slate-950">
                        {tour.rating_average}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        / 5.0
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {tour.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white">
                            {rev.customer_name?.charAt(0) || "G"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {rev.customer_name}
                            </p>
                            {rev.created_at && (
                              <p className="text-[10px] text-slate-500 font-medium">
                                {new Date(rev.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({
                            length: Math.round(rev.rating || 0),
                          }).map((_, s) => (
                            <Star
                              key={s}
                              size={13}
                              className="fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                      </div>
                      {rev.review_text && (
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {rev.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: HIGH-CONVERTING STICKY BOOKING WIDGET ── */}
          <aside
            id="booking-widget"
            className="sticky top-20 w-full rounded-2xl border border-blue-100 bg-white p-4 shadow-xl ring-1 ring-slate-900/5 sm:p-5 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar"
          >
            {/* Price Header */}
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-white shadow-md mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {promoActive
                    ? activeDiscountLabels.length > 1
                      ? `Starting from · ${activeDiscountLabels.length} offers applied`
                      : `Starting from · ${activeDiscountLabels[0] || `${tour.discount_percentage}% OFF`}`
                    : "Starting from"}
                </span>
                {realDates.length > 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {realDates.length} Dates Available
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-2xl sm:text-3xl font-black text-white whitespace-nowrap">
                  {format(startingUnitPrice, tourCurrency)}
                </span>
                <span className="text-xs text-slate-300 whitespace-nowrap">/ person</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px]">
                {promoActive && startingRawOriginalPrice > startingUnitPrice && (
                  <span className="font-semibold text-red-300 line-through decoration-red-300">
                    {format(startingRawOriginalPrice, tourCurrency)}
                  </span>
                )}
                {startingTierLabel && <span className="font-semibold text-emerald-300">for {startingTierLabel}</span>}
              </div>
              {promoActive && activeDiscountLabels.length > 0 && (
                <p className="mt-1 text-[10px] font-semibold text-emerald-300">
                  {activeDiscountLabels.join(" + ")}
                </p>
              )}
              <p className="text-[10px] text-slate-300 mt-1">
                Taxes &amp; Service Fees Included
              </p>
            </div>

            <h3 className="text-base font-bold text-slate-950">
              Select Date &amp; Travellers
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {destination} Tour Experience
            </p>

            {/* Month Departure Navigation */}
            {monthGroups.length > 0 && (
              <div className="mt-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  disabled={safeMonthIndex <= 0}
                  onClick={() =>
                    setCurrentMonthIndex((prev) => Math.max(0, prev - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div ref={monthMenuRef} className="relative min-w-0 flex-1">
                  <button
                    type="button"
                    aria-label="Departure month and year"
                    aria-haspopup="listbox"
                    aria-expanded={monthMenuOpen}
                    onClick={() => setMonthMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xs outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <span className="flex-1 text-center">{currentMonth.name}</span>
                    <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform ${monthMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {monthMenuOpen && (
                    <div role="listbox" aria-label="Available departure months" className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 no-scrollbar">
                      {monthGroups.map((month, index) => {
                        const selected = index === safeMonthIndex;
                        return (
                          <button
                            key={month.key}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setCurrentMonthIndex(index);
                              setMonthMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${selected ? "bg-blue-600 font-bold text-white" : "font-medium text-slate-700 hover:bg-slate-100"}`}
                          >
                            <span>{month.name}</span>
                            {selected && <Check size={13} className="shrink-0 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={safeMonthIndex >= monthGroups.length - 1}
                  onClick={() =>
                    setCurrentMonthIndex((prev) =>
                      Math.min(monthGroups.length - 1, prev + 1),
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Three departure cards at a time, paged within the selected month. */}
            {currentMonth.dates.length > 0 && (
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous available dates"
                  disabled={safeDatePageIndex <= 0}
                  onClick={() => {
                    const nextPage = Math.max(0, safeDatePageIndex - 1);
                    setDatePageIndex(nextPage);
                    const firstDate = currentMonth.dates[nextPage * 3];
                    if (firstDate) setSelectedDateId(firstDate.id);
                  }}
                  className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-25"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="grid min-w-0 flex-1 grid-cols-3 gap-2.5">
                {visibleDepartureDates.map((dep) => {
                  const isSelected = selectedDateId === dep.id;
                  return (
                    <button
                      key={dep.id}
                      type="button"
                      onClick={() => setSelectedDateId(dep.id)}
                      className={`rounded-xl border p-2 text-center transition cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/30 font-bold"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-[11px] font-bold text-slate-900 leading-tight">
                        {dep.date}
                      </span>
                      <span
                        className={`mt-0.5 block text-[9px] ${
                          dep.urgent
                            ? "font-bold text-amber-600"
                            : "text-emerald-600 font-semibold"
                        }`}
                      >
                        {dep.seats}
                      </span>
                    </button>
                  );
                })}
                </div>
                <button
                  type="button"
                  aria-label="Next available dates"
                  disabled={safeDatePageIndex >= datePageCount - 1}
                  onClick={() => {
                    const nextPage = Math.min(datePageCount - 1, safeDatePageIndex + 1);
                    setDatePageIndex(nextPage);
                    const firstDate = currentMonth.dates[nextPage * 3];
                    if (firstDate) setSelectedDateId(firstDate.id);
                  }}
                  className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:opacity-25"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {monthGroups.length > 0 && (
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[10px] leading-4 text-slate-600">
                <p className="font-bold text-slate-700">Can&apos;t find a date that suits you?</p>
                <p>
                  <Link href="/contact" className="font-bold text-blue-600 hover:underline">Get in touch with us</Link>
                  {", or discover "}
                  <Link href="/tours" className="font-bold text-blue-600 hover:underline">similar tours available in {currentMonth.name}</Link>.
                </p>
              </div>
            )}

            {currentMonth.dates.length === 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                No bookable departure dates available for this period.
              </div>
            )}

            {/* Group Rate Highlights from Backend Pricing Table */}
            {pricingRows.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    Group Rate Highlights
                  </h4>
                  <span className="text-[9px] font-bold text-blue-600">
                    {activeDiscountLabels.length > 0
                      ? activeDiscountLabels.join(" + ")
                      : "Auto-applied discount"}
                  </span>
                </div>
                <div className="space-y-1">
                  {pricingRows.map((row, index) => {
                    const isSelected = selectedGroupTier === index;
                    // Group saving vs the solo tier, both after any supplier discount.
                    const saveAmount =
                      index > 0 &&
                      baseRow &&
                      row.price_per_person < baseRow.price_per_person
                        ? Math.round(
                            baseRow.price_per_person - row.price_per_person,
                          )
                        : 0;
                    const rowOriginal = Number(
                      row.original_price_per_person ?? row.price_per_person,
                    );
                    const rowRawOriginal =
                      tourvaaDiscountPercent > 0 && supplierDiscountPercent > 0
                        ? rowOriginal / (1 - supplierDiscountPercent / 100)
                        : rowOriginal;
                    const rowDiscounted =
                      promoActive && rowRawOriginal > row.price_per_person;
                    return (
                      <button
                        key={`${row.persons_from}-${row.persons_to ?? "plus"}`}
                        type="button"
                        onClick={() => {
                          const target = Math.min(
                            row.persons_from,
                            maxTravellers,
                          );
                          setAdults(target);
                          setChildren(0);
                        }}
                        className={`grid min-h-9 w-full grid-cols-[minmax(90px,1fr)_auto] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] transition cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/30 font-bold"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="truncate text-left font-bold text-slate-900">
                          {groupTierLabel(row.persons_from, row.persons_to)}
                        </span>
                        <span className="flex min-w-0 items-center justify-end gap-1 whitespace-nowrap text-right leading-none">
                          {rowDiscounted && (
                            <span className="text-[9px] font-semibold text-red-500 line-through decoration-red-500">
                              {format(
                                rowRawOriginal,
                                row.currency || tourCurrency,
                              )}
                            </span>
                          )}
                          <span className="whitespace-nowrap font-semibold text-blue-600">
                            {format(
                              row.price_per_person,
                              row.currency || tourCurrency,
                            )}
                            <span className="text-[9px] font-normal text-slate-400">
                              {" "}
                              / pax
                            </span>
                          </span>
                          {saveAmount > 0 && (
                            <span className="whitespace-nowrap text-[9px] font-bold text-emerald-600">
                              (save{" "}
                              {format(saveAmount, row.currency || tourCurrency)}{" "}
                              pp)
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Traveller Steppers */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Who&apos;s Travelling?
                </h4>
                {(selectedDeparture?.slotsRemaining != null || tour.max_group_size) && (
                  <span className="text-[10px] font-medium text-slate-400">
                    Max {maxTravellers} guests
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                {/* Adults */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">Adults</p>
                    <p className="text-[10px] text-slate-500 font-normal">
                      Ages 18+ ({format(unitPrice, tourCurrency)}/pax)
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-5 text-center font-black text-slate-950">
                      {adults}
                    </span>
                    <button
                      type="button"
                      disabled={adults + children >= maxTravellers}
                      onClick={() =>
                        setAdults((a) =>
                          Math.min(maxTravellers - children, a + 1),
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">Children</p>
                    <p className="text-[10px] text-slate-500 font-normal">
                      Ages 3–17 ({format(childUnitPrice, tourCurrency)}/pax)
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-5 text-center font-black text-slate-950">
                      {children}
                    </span>
                    <button
                      type="button"
                      disabled={adults + children >= maxTravellers}
                      onClick={() =>
                        setChildren((c) =>
                          Math.min(maxTravellers - adults, c + 1),
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Pricing Summary */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                Booking Summary
              </h4>

              {groupSaving > 0 && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1.5 text-[11px] font-semibold text-blue-800">
                  <span>
                    🎉 Group rate applied ({travellerCount} travellers) vs.
                    standard rate
                  </span>
                  <span className="font-bold">
                    -{format(groupSaving, tourCurrency)} total
                  </span>
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                {promoActive ? (
                  <>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>
                        Tour Price ({travellerCount} Guest
                        {travellerCount > 1 ? "s" : ""})
                      </span>
                      <span className="font-bold text-slate-500 line-through">
                        {format(rawTourPrice, tourCurrency)}
                      </span>
                    </div>
                    {supplierDiscountPercent > 0 && supplierDiscountAmount > 0 && (
                      <div className="flex justify-between text-amber-700 font-medium">
                        <span>{tour.supplier_discount_name || "Supplier discount"} ({supplierDiscountPercent}%)</span>
                        <span className="font-bold">-{format(supplierDiscountAmount, tourCurrency)}</span>
                      </div>
                    )}
                    {tourvaaDiscountPercent > 0 && tourvaaDiscountAmount > 0 && (
                      <div className="flex justify-between text-blue-700 font-medium">
                        <span>{tour.tourvaa_discount_name || "TourVaa discount"} ({tourvaaDiscountPercent}%)</span>
                        <span className="font-bold">-{format(tourvaaDiscountAmount, tourCurrency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Customer price after discounts</span>
                      <span className="font-bold text-slate-900">
                        {format(tourPrice, tourCurrency)}
                      </span>
                    </div>
                    {totalDiscountSaving > 0 && (
                      <div className="flex items-center justify-between rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 font-bold">
                        <span>You Save</span>
                        <span>
                          {format(totalDiscountSaving, tourCurrency)}
                          <span className="ml-1 text-[10px] font-semibold">
                            (
                            {format(
                              Math.round(
                                totalDiscountSaving / Math.max(1, travellerCount),
                              ),
                              tourCurrency,
                            )}{" "}
                            / person)
                          </span>
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>
                        {adults} Adult{adults > 1 ? "s" : ""}
                      </span>
                      <span className="font-bold text-slate-900">
                        {format(adults * unitPrice, tourCurrency)}
                      </span>
                    </div>
                    {children > 0 && (
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>
                          {children} Child{children > 1 ? "ren" : ""}
                        </span>
                        <span className="font-bold text-slate-900">
                          {format(children * childUnitPrice, tourCurrency)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Taxes &amp; Fees</span>
                  <span className="font-bold text-emerald-600">Included</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Booking Fee</span>
                  <span className="font-bold text-emerald-600">Free</span>
                </div>

                <div className="my-2 border-b border-dashed border-slate-200" />

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Total Price
                    </p>
                    <p className="text-[10px] text-slate-400 font-normal">
                      {format(perPersonPrice, tourCurrency)} per traveller
                    </p>
                  </div>
                  <strong className="text-xl font-black text-slate-950">
                    {format(totalAmount, tourCurrency)}
                  </strong>
                </div>

                {/* Deposit Option in Summary */}
                {depositDue != null && (
                  <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200/60 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <Wallet size={13} className="text-blue-600" />
                        Or pay a deposit today
                        {depositPercent != null ? ` (${depositPercent}%)` : ""}:
                      </span>
                      <span className="font-black text-blue-700">
                        {format(depositDue, tourCurrency)}
                      </span>
                    </div>
                    {depositOffer?.dueDate && (
                      <p className="mt-1 text-[10px] font-medium text-blue-800/80">
                        Balance of {format(Math.max(0, totalAmount - depositDue), tourCurrency)} due by{" "}
                        {new Date(`${depositOffer.dueDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 space-y-2">
              {agentBooking ? (
                <>
                  <div className={`rounded-xl border p-2.5 ${agentReserveEligible ? "border-orange-200 bg-orange-50/60" : "border-slate-200 bg-slate-50"}`}>
                      <button
                        type="button"
                        onClick={() => handleBookNow("reserve")}
                        disabled={!agentReserveEligible || !selectedDeparture || !unitPrice}
                        className="w-full rounded-lg bg-pub-accent py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#cf4b24] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                      >
                        Pay Deposit &amp; Reserve
                      </button>
                      <p className="mt-2 text-center text-[10px] font-medium leading-4 text-blue-900/75">
                        {agentReserveEligible ? (
                          <>Pay {depositPercent ?? 0}% ({format(depositDue ?? 0, tourCurrency)}) today
                          {depositOffer?.dueDate
                            ? `; balance due ${new Date(`${depositOffer.dueDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`
                            : "."}</>
                        ) : "Unavailable for this departure because it is inside the Reserve Now cutoff."}
                      </p>
                    </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <button
                      type="button"
                      onClick={() => handleBookNow("full")}
                      disabled={!selectedDeparture || !unitPrice}
                      className="w-full rounded-lg bg-pub-accent py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#cf4b24] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Pay in Full Today
                    </button>
                    <p className="mt-2 text-center text-[10px] font-medium text-slate-500">
                      Pay the full amount and confirm your booking.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleBookNow()}
                    disabled={!selectedDeparture || !unitPrice}
                    className="w-full rounded-xl bg-pub-accent hover:bg-[#cf4b24] py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {!unitPrice ? "Price Unavailable" : selectedDeparture ? (
                      <><span>Book This Tour</span><ArrowRight size={16} /></>
                    ) : "Select Date"}
                  </button>
                  {depositDue != null && (
                    <button
                      type="button"
                      onClick={() => handleBookNow("reserve")}
                      disabled={!selectedDeparture || !unitPrice}
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 py-2.5 text-xs font-bold text-blue-800 transition cursor-pointer disabled:opacity-40"
                    >
                      Secure with a Deposit ({format(depositDue, tourCurrency)} today)
                    </button>
                  )}
                </>
              )}
            </div>

            <Link
              href="/contact"
              className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
            >
              <MessageCircle size={13} />
              <span>Ask a travel expert</span>
            </Link>

            {/* Trust Assurances */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>256-Bit SSL Encrypted Safe Checkout</span>
              </div>
            </div>
          </aside>
        </div>

        {/* ── 7. SIMILAR TOURS (Rendered only if backend provides them) ── */}
        {tour.similar_tours && tour.similar_tours.length > 0 && (
          <section className="mt-16 border-t border-slate-200 pt-10">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Compass size={20} className="text-blue-600" />
              <span>Similar Tours You May Like</span>
            </h3>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tour.similar_tours.map((sim, sIdx) => (
                <div
                  key={`${sim.id}-${sIdx}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      {sim.banner_image && (
                        <MarketingImage
                          src={mediaUrl(sim.banner_image)}
                          alt={sim.title}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                      {sim.number_of_days != null && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                          {sim.number_of_days} Days
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {sim.country_name || destination}
                      </p>
                      <Link
                        href={
                          sim.slug ? `/tours/${sim.slug}` : `/tours/${sim.id}`
                        }
                        className="mt-1 block text-xs font-bold text-slate-900 line-clamp-1 hover:text-blue-600 transition"
                      >
                        {sim.title}
                      </Link>

                      {sim.rating_average != null && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <Star
                            size={12}
                            className="fill-amber-400 text-amber-400"
                          />
                          <span className="font-bold text-slate-800">
                            {sim.rating_average}
                          </span>
                          {sim.rating_count ? (
                            <span className="text-[10px] text-slate-400">
                              ({sim.rating_count})
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div>
                        {sim.price_start_per_person != null && (
                          <>
                            <span className="text-[10px] text-slate-400 uppercase">
                              From
                            </span>
                            <p className="text-xs font-bold text-slate-950">
                              {format(
                                sim.price_start_per_person,
                                sim.currency || tourCurrency,
                              )}
                            </p>
                          </>
                        )}
                      </div>
                      <Link
                        href={
                          sim.slug ? `/tours/${sim.slug}` : `/tours/${sim.id}`
                        }
                        className="rounded-lg bg-pub-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-pub-primary-dark"
                      >
                        View Tour
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── 8. FLOATING BOTTOM BOOKING BAR (ON SCROLL) ── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-2xl transition-all duration-300 ${
          showStickyBottom
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {galleryItems[0]?.url && (
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100 hidden sm:block">
                <MarketingImage
                  src={galleryItems[0].url}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {title}
              </h4>
              <p className="text-[11px] text-slate-500 flex items-center gap-2">
                {durationLabel && <span>{durationLabel}</span>}
                {destination && <span>• {destination}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-base sm:text-xl font-black text-slate-950">
                  {format(totalAmount, tourCurrency)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  total
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {adults} Adult{adults > 1 ? "s" : ""}
                {children > 0 ? `, ${children} Child` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToBooking}
              className="rounded-xl bg-pub-accent hover:bg-[#cf4b24] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition active:scale-[0.99] cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
