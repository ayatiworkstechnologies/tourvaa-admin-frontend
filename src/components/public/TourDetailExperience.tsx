"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuBedDouble as Bed, LuBriefcase as Suitcase, LuBus as Bus, LuCalendarDays as Calendar, LuChevronDown as ChevronDown, LuCheck as Check, LuCircleCheckBig as CheckCircle, LuHeart as Heart, LuHouse as House, LuMapPin as MapPin, LuMinus as Minus, LuPlus as Plus, LuSparkles as Sparkles, LuStar as Star, LuTag as Tag, LuUserRound as User, LuUsers as Users, LuUtensils as Utensils, LuX as X } from "react-icons/lu";
import { PublicTour, PublicTourDetail } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";

const FALLBACK = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=85";

type Props = {
  tour: PublicTourDetail;
  images: string[];
  initialTravelDate: string;
  initialAdults: number;
  initialChildren: number;
  onBook: (selection: { travelDate: string; adults: number; children: number }) => void;
  onWishlist: () => void;
  wishlisted: boolean;
  modal?: React.ReactNode;
};

export default function TourDetailExperience({ tour, images, initialTravelDate, initialAdults, initialChildren, onBook, onWishlist, wishlisted, modal }: Props) {
  const { format } = useCurrency();
  const gallery = images.length ? images : [FALLBACK];
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const departures = useMemo(() => tour.calendar.filter((entry) => entry.status !== "cancelled").slice(0, 5), [tour.calendar]);
  const [selectedDate, setSelectedDate] = useState(initialTravelDate || departures[0]?.date || "");
  const unitPrice = Number(tour.price_start_per_person || 0);
  const total = unitPrice * Math.max(1, adults + children);
  const dayCount = tour.number_of_days || 9;
  const destination = tour.country_name || "Your destination";
  const baseCurrency = tour.currency || "USD";
  const stays = useMemo(() => {
    const seen = new Set<string>();
    return tour.itineraries
      .filter((item) => item.accommodation && item.accommodation.trim())
      .map((item) => ({ accommodation: item.accommodation.trim(), location: item.location || "" }))
      .filter((stay) => (seen.has(stay.accommodation) ? false : (seen.add(stay.accommodation), true)));
  }, [tour.itineraries]);
  const accommodationItems = tour.accommodations.map((item) => ({ id: item.id, name: item.name, description: item.description, priceLabel: item.price != null ? format(item.price, baseCurrency) : "Included" }));
  const activityItems = tour.optional_activities.map((item) => ({ id: item.id, name: item.name, description: item.description, priceLabel: item.price != null ? format(item.price, item.currency || baseCurrency) : "Included" }));
  const extensionItems = tour.extensions.map((item) => ({ id: item.id, name: item.title, description: item.description, priceLabel: item.price != null ? format(item.price, baseCurrency) : "Included" }));

  return (
    <main className="min-h-screen bg-white pb-24 pt-20 text-slate-950">
      {modal}
      <section className="relative h-[300px] overflow-hidden md:h-[380px]">
        <img src={gallery[0]} alt={destination} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
        <h1 className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white drop-shadow md:text-5xl">{destination}</h1>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <header className="animate-fade-up">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">{tour.title}</h2>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-semibold">
            <span className="rounded-full bg-blue-600 px-5 py-2 text-white">Best Seller</span>
            {tour.rating_average != null ? (
              <a href="#reviews" className="flex items-center gap-2"><Star size={16} className="fill-amber-400 text-amber-400" /><b>{tour.rating_average.toFixed(1)}</b> ({tour.rating_count} Review{tour.rating_count === 1 ? "" : "s"})</a>
            ) : (
              <span className="flex items-center gap-2 text-slate-400"><Star size={16} /> No reviews yet</span>
            )}
            <span>Operated by: <b>Tourvaa Experiences</b></span>
          </div>
          <nav className="mt-7 flex flex-wrap gap-x-12 gap-y-3 text-sm font-semibold text-slate-700"><a href="#overview">Explore</a><a href="#essentials" className="flex items-center gap-2">Tour Categories <ChevronDown size={15} /></a><a href="#itinerary" className="flex items-center gap-2">Travel Guides <ChevronDown size={15} /></a><a href="#itinerary" className="flex items-center gap-2">Travel Guide <ChevronDown size={15} /></a></nav>
        </header>

        <div className="animate-fade-up delay-100 mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
          <div className="min-w-0">
            <section className="grid h-[360px] grid-cols-2 gap-4 overflow-hidden md:h-[480px]">
              <img src={gallery[0]} alt={tour.title} className="h-full w-full rounded-xl object-cover" />
              <div className="grid min-h-0 grid-rows-2 gap-4"><img src={gallery[1] || gallery[0]} alt="Tour view" className="h-full min-h-0 w-full rounded-xl object-cover" /><div className="grid min-h-0 grid-cols-2 gap-4"><img src={gallery[2] || gallery[0]} alt="Tour view" className="h-full min-h-0 w-full rounded-xl object-cover" /><img src={gallery[3] || gallery[1] || gallery[0]} alt="Tour view" className="h-full min-h-0 w-full rounded-xl object-cover" /></div></div>
            </section>
            <p className="border-b border-slate-200 py-7 text-sm font-semibold leading-6">{tour.short_description || `Don't miss ${destination}'s breathtaking landscapes, iconic landmarks, and unforgettable adventures-all in one perfectly planned journey.`}</p>

            <section id="overview" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-2xl font-black">{tour.title} <span className="text-xl">{flagFor(tour.country_name)}</span></h3>
              <span className="mt-3 inline-block rounded border border-blue-300 px-2 py-1 text-xs font-bold">{dayCount} Days | {Math.max(1, dayCount - 1)} Nights</span>
              <p className="mt-6 text-sm leading-6 text-slate-700">{tour.long_description || tour.short_description || `Embark on an unforgettable journey through ${destination}, with thoughtfully curated stays, local experiences and seamless transfers.`}</p>
              {(tour.overview?.why_choose_this_tour || tour.overview?.ideal_for || tour.overview?.best_season || tour.overview?.tour_pace) && (
                <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
                  {tour.overview?.why_choose_this_tour && (
                    <div className="sm:col-span-2"><b className="block text-xs font-black uppercase text-blue-600">Why choose this tour</b><p className="mt-1.5 text-sm leading-6 text-slate-700">{tour.overview.why_choose_this_tour}</p></div>
                  )}
                  {tour.overview?.ideal_for && (
                    <div><b className="block text-xs font-black uppercase text-blue-600">Ideal for</b><p className="mt-1.5 text-sm leading-6 text-slate-700">{tour.overview.ideal_for}</p></div>
                  )}
                  {tour.overview?.best_season && (
                    <div><b className="block text-xs font-black uppercase text-blue-600">Best season</b><p className="mt-1.5 text-sm leading-6 text-slate-700">{tour.overview.best_season}</p></div>
                  )}
                  {tour.overview?.tour_pace && (
                    <div><b className="block text-xs font-black uppercase text-blue-600">Tour pace</b><p className="mt-1.5 text-sm leading-6 text-slate-700">{tour.overview.tour_pace}</p></div>
                  )}
                </div>
              )}
            </section>

            <section id="essentials" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="flex items-center gap-3 text-2xl font-black"><Suitcase className="text-blue-600" />Travel Essentials</h3>
              <div className="mt-7 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                <div className="space-y-7">
                  <Essential icon={<Calendar />} title="Duration" value={`${dayCount} Days / ${Math.max(1, dayCount - 1)} Nights`} />
                  <Essential icon={<MapPin />} title="Starts From" value={tour.start_location || tour.city_name || destination} />
                  <Essential icon={<MapPin />} title="Ends At" value={tour.finish_location || destination} />
                  <Essential icon={<User />} title="Minimum Age" value="18 Years" />
                  <Essential icon={<Users />} title="Maximum Age" value="65 Years" />
                </div>
                <div className="space-y-7">
                  <Essential icon={<Users />} title="Tour Guide" value="Professional English Guide" />
                  <Essential icon={<House />} title="Accommodation" value={tour.overview?.accommodation_summary || "4-Star Hotels (or similar)"} />
                  <Essential icon={<Utensils />} title="Meals" value={tour.overview?.meal_summary || `${Math.max(1, dayCount - 1)} Breakfasts, 2 Dinners`} />
                  <Essential icon={<Bus />} title="Transportation" value={tour.overview?.transportation_summary || "Private Coach & Transfers"} />
                  <Essential icon={<MapPin />} title="Destination" value={destination} />
                </div>
              </div>
            </section>

            {(tour.highlights.length > 0 || tour.inclusions.length > 0 || tour.exclusions.length > 0) && (
              <section id="inclusions" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="flex items-center gap-3 text-2xl font-black"><CheckCircle className="text-blue-600" />What&apos;s Included</h3>
                <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">Here&apos;s everything included in this tour package, plus what to expect along the way.</p>
                {tour.highlights.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-black uppercase text-slate-500">Tour Highlights</h4>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {tour.highlights.map((item, index) => <li key={index} className="flex items-start gap-3 text-sm leading-6 text-slate-700"><Star size={14} className="mt-1 shrink-0 fill-amber-400 text-amber-400" />{item.text}</li>)}
                    </ul>
                  </div>
                )}
                {(tour.inclusions.length > 0 || tour.exclusions.length > 0) && (
                  <div className="mt-8 grid gap-8 border-t border-slate-100 pt-6 sm:grid-cols-2">
                    {tour.inclusions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-black uppercase text-emerald-700">Included</h4>
                        <ul className="mt-3 space-y-2">{tour.inclusions.map((item, index) => <li key={index} className="flex items-start gap-2 text-sm text-slate-700"><Check size={14} className="mt-1 shrink-0 text-emerald-600" />{item.text}</li>)}</ul>
                      </div>
                    )}
                    {tour.exclusions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-black uppercase text-red-600">Not Included</h4>
                        <ul className="mt-3 space-y-2">{tour.exclusions.map((item, index) => <li key={index} className="flex items-start gap-2 text-sm text-slate-700"><X size={14} className="mt-1 shrink-0 text-red-500" />{item.text}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">Optional activities are not included in the tour price and can be arranged directly with your guide during the trip.</p>
              </section>
            )}

            {tour.pricing.length > 0 && (
              <section id="pricing" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="flex items-center gap-3 text-2xl font-black"><Tag className="text-blue-600" />Group Pricing</h3>
                <div className="mt-6 divide-y divide-slate-100">
                  {tour.pricing.map((slab, index) => (
                    <div key={index} className="flex items-center justify-between py-3 text-sm">
                      <span className="font-semibold text-slate-700">{slab.persons_from}{slab.persons_to ? `–${slab.persons_to}` : "+"} travellers</span>
                      <b className="text-blue-700">{format(slab.price_per_person, slab.currency || baseCurrency)} <span className="font-normal text-slate-400">/ person</span></b>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tour.cancellation_policy.length > 0 && (
              <section id="cancellation" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="flex items-center gap-3 text-2xl font-black"><CheckCircle className="text-blue-600" />Cancellation Policy</h3>
                <div className="mt-6 divide-y divide-slate-100">
                  {tour.cancellation_policy.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="font-semibold text-slate-700">
                        {rule.days_before_min}{rule.days_before_max != null ? `–${rule.days_before_max}` : "+"} days before departure
                        {rule.description && <span className="ml-2 font-normal text-slate-400">{rule.description}</span>}
                      </span>
                      <b className="shrink-0 text-blue-700">{rule.refund_percentage}% refund</b>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tour.reviews.length > 0 && (
              <section id="reviews" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="flex items-center gap-3 text-2xl font-black">
                  <Star className="fill-amber-400 text-amber-400" />Customer Reviews
                  {tour.rating_average != null && <span className="text-base font-semibold text-slate-500">{tour.rating_average.toFixed(1)} · {tour.rating_count} review{tour.rating_count === 1 ? "" : "s"}</span>}
                </h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {tour.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} size={13} className={index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                        ))}
                      </div>
                      {review.review_text && <p className="mt-2 text-sm leading-6 text-slate-700">{review.review_text}</p>}
                      <p className="mt-2 text-xs font-semibold text-slate-400">{review.customer_name || "Verified traveller"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-5 flex gap-8 overflow-x-auto rounded-xl border border-slate-200 px-5 py-5 text-xs font-bold"><a href="#inclusions">What&apos;s Included</a><a href="#itinerary">Journey Plan</a><a href="#addons">Extras</a><a href="#stays">Where You&apos;ll Stay</a><a href="#availability">Availability & Pricing</a><a href="#discover">Discover More</a></div>

            <section id="itinerary" className="mt-5 space-y-5">
              {(tour.itineraries.length
                ? tour.itineraries
                : [{ day: 1, title: `Welcome to ${tour.city_name || destination}`, description: `Arrive and meet your Tourvaa representative. Transfer to your hotel, check in, and enjoy the rest of the day at leisure.`, location: tour.city_name || destination, meals: "Breakfast", transport: "", start_time: "", end_time: "", travel_distance: "", travel_duration: "", important_notes: "" }]
              ).map((item, index) => (
                <article key={`${item.day}-${item.title}`} className="grid gap-8 rounded-2xl border border-slate-200 p-7 shadow-sm md:grid-cols-[1fr_.9fr]">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-blue-600"><span>Tourvaa / {destination}</span><span className="rounded bg-blue-50 px-3 py-1">Day {item.day}</span></div>
                    <h3 className="mt-7 text-3xl font-medium">{item.title}</h3>
                    <p className="mt-7 text-sm leading-7 text-slate-600">{item.description}</p>
                    {item.important_notes && <div className="mt-7 rounded-xl bg-slate-50 p-5 text-xs leading-6"><b>Please note</b><p>{item.important_notes}</p></div>}
                    <div className="mt-7 grid grid-cols-2 gap-4 border-t pt-5 text-xs">
                      <span><Bed size={15} className="mb-2" />Location<br /><b>{item.location || destination}</b></span>
                      <span><Utensils size={15} className="mb-2" />Meals<br /><b>{item.meals || "Not specified"}</b></span>
                      {item.transport && <span><Bus size={15} className="mb-2" />Transport<br /><b>{item.transport}</b></span>}
                      {(item.start_time || item.end_time) && <span><Calendar size={15} className="mb-2" />Timing<br /><b>{item.start_time}{item.start_time && item.end_time ? " – " : ""}{item.end_time}</b></span>}
                    </div>
                  </div>
                  <div className="relative min-h-80 overflow-hidden rounded-2xl"><img src={gallery[(index + 1) % gallery.length]} alt={item.title} className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20 text-white"><small>DESTINATIONS</small><p className="text-2xl">{item.location || destination}</p></div></div>
                </article>
              ))}
            </section>

            {stays.length > 0 && (
              <section id="stays" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="flex items-center gap-3 text-2xl font-black"><House className="text-blue-600" />Where You&apos;ll Stay</h3>
                <ul className="mt-6 space-y-3">
                  {stays.map((stay, index) => (
                    <li key={index} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600"><Bed size={18} /></span>
                      <span className="min-w-0"><b className="block text-sm">{stay.accommodation}</b>{stay.location && <span className="mt-0.5 block text-xs text-slate-500">{stay.location}</span>}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="availability" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="flex items-center gap-3 text-2xl font-black"><Calendar className="text-blue-600" />Availability & Pricing</h3>
              <div className="mt-6 divide-y divide-slate-100">
                {(departures.length ? departures : [{ date: "2026-09-12", slots: 8, status: "available" }, { date: "2026-09-20", slots: 12, status: "available" }, { date: "2026-09-26", slots: 5, status: "available" }]).map((entry) => {
                  const isSelected = selectedDate === entry.date;
                  return (
                    <div key={entry.date} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                      <span><b className="block">{dateLabel(entry.date)}</b><small className={entry.slots <= 5 ? "font-bold text-amber-500" : "text-slate-500"}>{entry.slots} Seats Left</small></span>
                      <span className="text-right"><b className="block text-blue-600">{format(unitPrice, tour.currency || "USD")}</b><small className="text-[10px] text-slate-400">per traveller</small></span>
                      <button
                        type="button"
                        onClick={() => { setSelectedDate(entry.date); document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                        className={`shrink-0 rounded-lg px-5 py-2.5 text-xs font-black ${isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-200 text-slate-700 hover:border-blue-300"}`}
                      >
                        {isSelected ? "Book Now" : "View Details"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {(accommodationItems.length > 0 || activityItems.length > 0 || extensionItems.length > 0) && (
              <section id="addons" className="mt-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="flex items-center gap-3 text-2xl font-black"><Sparkles className="text-blue-600" />Available Add-ons</h3>
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  <AddOnGroup title="Accommodation" icon={<House size={14} />} items={accommodationItems} />
                  <AddOnGroup title="Activities" icon={<Star size={14} />} items={activityItems} />
                  <AddOnGroup title="Extensions" icon={<Calendar size={14} />} items={extensionItems} />
                </div>
              </section>
            )}

            {tour.discounts.length > 0 && (
              <section id="offers" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="flex items-center gap-3 text-xl font-black text-amber-900"><Tag className="text-amber-600" />Special Offers</h3>
                <ul className="mt-4 space-y-2">
                  {tour.discounts.map((discount, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm font-semibold text-amber-900">
                      <span className="shrink-0 rounded-full bg-amber-600 px-3 py-1 text-xs font-black text-white">
                        {discount.discount_type === "percentage" ? `${discount.value}% OFF` : `${format(discount.value, baseCurrency)} OFF`}
                      </span>
                      {discount.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside id="booking" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,.12)] lg:sticky lg:top-24">
            <h3 className="text-lg font-black">Book Your {destination} Adventure</h3><p className="mt-1 text-xs text-slate-500">Secure your preferred departure in just a few steps.</p>
            <div className="mt-5 space-y-2">{(departures.length ? departures : [{ date: "2026-09-12", slots: 8, status: "available" }, { date: "2026-09-20", slots: 12, status: "available" }, { date: "2026-09-26", slots: 5, status: "available" }]).map((entry, index) => <button type="button" key={entry.date} onClick={() => setSelectedDate(entry.date)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${selectedDate === entry.date || (!selectedDate && index === 0) ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}><span><b className="block text-xs">{dateLabel(entry.date)}</b><small className={entry.slots <= 5 ? "font-bold text-amber-500" : "text-slate-500"}>{entry.slots} Seats Left</small></span><span className="text-right"><b className="block text-xs text-blue-600">{format(unitPrice, tour.currency || "USD")}</b><small className="text-[9px] text-slate-400">per traveller</small></span></button>)}</div>
            <div className="mt-6 border-t pt-5"><h4 className="text-xs font-black uppercase">Who&apos;s travelling?</h4><Counter label="Adults" note="Ages 18 years and above" value={adults} setValue={setAdults} min={1} /><Counter label="Children" note="Ages 5–17" value={children} setValue={setChildren} min={0} /></div>
            <div className="mt-5 border-t pt-5 text-xs"><h4 className="font-black uppercase">Booking summary</h4><Summary label={`Tour Price (${adults + children} Guests)`} value={format(total, tour.currency || "USD")} /><Summary label="Taxes & Service Fees" value="Included" accent /><Summary label="Booking Fee" value="Free" accent /><div className="mt-4 flex items-end justify-between border-t pt-4"><span><b className="block">Total Amount</b><small className="text-slate-400">per booking</small></span><b className="text-xl">{format(total, tour.currency || "USD")}</b></div></div>
            <button type="button" onClick={() => onBook({ travelDate: selectedDate, adults, children })} className="mt-5 w-full rounded-lg bg-blue-600 py-3.5 text-sm font-black text-white transition hover:bg-blue-700">Book Now</button>
            <button type="button" onClick={onWishlist} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold ${wishlisted ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200"}`}><Heart size={14} className={wishlisted ? "fill-current" : ""} />{wishlisted ? "Saved" : "Add to Wishlist"}</button>
          </aside>
        </div>
      </div>

      {tour.similar_tours.length > 0 && <DiscoverMore tours={tour.similar_tours} format={format} />}

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-5 py-3 shadow-[0_-8px_24px_rgba(15,23,42,.1)] lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <span><b className="block text-sm">{format(unitPrice, tour.currency || "USD")} <span className="text-xs font-normal text-slate-400">/ person</span></b><small className="text-[10px] text-slate-400">Total for {adults + children} {adults + children === 1 ? "guest" : "guests"}: {format(total, tour.currency || "USD")}</small></span>
        <a href="#booking" className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 text-xs font-black text-white transition hover:bg-blue-700">Check Availability</a>
      </div>
    </main>
  );
}

function Essential({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600">{icon}</span><span><b className="block text-sm">{title}</b><small className="text-slate-500">{value}</small></span></div>; }
function Counter({ label, note, value, setValue, min }: { label: string; note: string; value: number; setValue: (value: number) => void; min: number }) { return <div className="mt-4 flex items-center justify-between"><span><b className="block text-xs">{label}</b><small className="text-[9px] text-slate-400">{note}</small></span><span className="flex items-center gap-3"><button type="button" onClick={() => setValue(Math.max(min, value - 1))} className="rounded border p-1"><Minus size={12} /></button><b className="w-5 text-center text-xs">{String(value).padStart(2, "0")}</b><button type="button" onClick={() => setValue(value + 1)} className="rounded border p-1"><Plus size={12} /></button></span></div>; }
function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="mt-3 flex justify-between"><span>{label}</span><b className={accent ? "text-emerald-500" : ""}>{value}</b></div>; }
function dateLabel(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "long" }).format(date); }
function flagFor(country: string) { const key = country.trim().toLowerCase(); return key === "new zealand" ? "🇳🇿" : key === "india" ? "🇮🇳" : key === "switzerland" ? "🇨🇭" : "🌍"; }

function AddOnGroup({ title, icon, items }: { title: string; icon: React.ReactNode; items: { id: number; name: string; description: string; priceLabel: string }[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">{icon}{title}</h4>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-3 text-sm">
            <span className="min-w-0"><b className="block text-slate-900">{item.name}</b>{item.description && <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>}</span>
            <b className="shrink-0 text-blue-700">{item.priceLabel}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiscoverMore({ tours, format }: { tours: PublicTour[]; format: (amount: number | string | null | undefined, currency?: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  return (
    <section id="discover" className="mx-auto mt-14 max-w-7xl px-5 md:px-8">
      <div className="mb-5 flex items-center justify-between"><h3 className="text-2xl font-black">Discover More</h3><div className="flex gap-2"><button type="button" aria-label="Previous tours" onClick={() => move(-1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 transition hover:border-blue-500 hover:text-blue-600"><ArrowLeft size={15} /></button><button type="button" aria-label="Next tours" onClick={() => move(1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 transition hover:border-blue-500 hover:text-blue-600"><ArrowRight size={15} /></button></div></div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-5 overflow-x-auto pb-2">
        {tours.map((related) => <div className="w-[280px] shrink-0 snap-start" key={related.id}><SimilarTourCard tour={related} format={format} /></div>)}
      </div>
    </section>
  );
}

function SimilarTourCard({ tour, format }: { tour: PublicTour; format: (amount: number | string | null | undefined, currency?: string) => string }) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const image = tour.banner_image ? mediaUrl(tour.banner_image) : FALLBACK;
  const wishlisted = isWishlisted(tour.id);
  const travelItem = { id: tour.id, title: tour.title, place: tour.city_name || tour.country_name, image, price: tour.price_start_per_person ?? null, currency: tour.currency || "USD", duration: tour.number_of_days ? `${tour.number_of_days}D` : "Flexible", href: publicTourUrl(tour) };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button type="button" onClick={() => toggleWishlist(travelItem)} aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`} className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition hover:scale-110 ${wishlisted ? "bg-red-500 text-white" : "bg-black/20 text-white hover:bg-white hover:text-red-500"}`}><Heart size={15} className={wishlisted ? "fill-current" : ""} /></button>
      <a href={publicTourUrl(tour)} className="block">
        <div className="h-48 overflow-hidden"><img src={image} alt={tour.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></div>
        <div className="p-5">
          <p className="text-[10px] font-bold text-blue-600">{tour.city_name || tour.country_name}</p>
          <h4 className="mt-2 line-clamp-2 text-base font-black">{tour.title}</h4>
          {tour.rating_average != null && <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-slate-500"><Star size={12} className="fill-amber-400 text-amber-400" />{tour.rating_average.toFixed(1)} {tour.rating_count ? `(${tour.rating_count})` : ""}</p>}
          {tour.price_start_per_person != null && <p className="mt-3 text-sm font-black text-slate-900">{format(tour.price_start_per_person, tour.currency || "USD")} <span className="text-xs font-normal text-slate-400">pp</span></p>}
        </div>
      </a>
    </div>
  );
}
