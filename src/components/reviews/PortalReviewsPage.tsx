"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LuCircleCheck as CheckCircle, LuMessageSquareText as MessageSquare, LuStar as Star } from "react-icons/lu";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type Review = { id: number; booking_id: number; booking_code?: string; tour_title?: string; rating: number; review_text?: string | null; status: string; created_at?: string };
type EligibleBooking = { id: number; booking_code?: string; tour_name?: string; tour_date?: string };
type PortalData = { role: "customer" | "agent" | "supplier"; reviews: Review[]; eligible_bookings: EligibleBooking[] };

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (value: number) => void }) {
  return <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((value) => interactive ? <button key={value} type="button" onClick={() => onChange?.(value)} className="rounded p-1" aria-label={`Rate ${value} stars`}><Star size={23} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} /></button> : <Star key={value} size={16} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />)}</div>;
}

export default function PortalReviewsPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EligibleBooking | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); try { const response = await api.get("/portal/reviews"); setData(response.data?.data); } catch { setError("Could not load reviews right now."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const average = useMemo(() => data?.reviews.length ? (data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length).toFixed(1) : null, [data]);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!selected) return; setSubmitting(true); setError(""); try { await api.post("/customer/reviews", { booking_id: selected.id, rating, review_text: text.trim() || undefined }); setSelected(null); setText(""); await load(); } catch (err: unknown) { setError(axios.isAxiosError(err) ? err.response?.data?.detail || "Could not submit your review." : "Could not submit your review."); } finally { setSubmitting(false); } }
  if (loading) return <Loader label="Loading reviews..." fullScreen />;
  const customer = data?.role === "customer";
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#102A52] via-[#1E4B88] to-[#216C9E] p-6 text-white shadow-xl sm:p-8">
      <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-100">Tour feedback</p>
      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-black">Reviews that move travel forward.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">{customer ? "Share feedback after a completed trip. Your review is checked before appearing publicly." : "Read verified traveller feedback from your completed booking portfolio."}</p></div>{average && <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur"><div className="flex items-center gap-2 text-2xl font-black"><Star className="fill-amber-300 text-amber-300" />{average}<span className="text-sm font-semibold text-blue-100">/ 5</span></div><p className="mt-1 text-xs text-blue-100">{data?.reviews.length} approved review{data?.reviews.length === 1 ? "" : "s"}</p></div>}</div>
    </section>
    {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
    {customer && data?.eligible_bookings.length ? <section className="mt-6 rounded-2xl border border-[#CFE2FA] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><MessageSquare size={19} /></div><div><h2 className="font-black text-slate-900">Your completed trips</h2><p className="text-sm text-slate-500">Choose a trip to post a verified review.</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-2">{data.eligible_bookings.map((booking) => <button key={booking.id} type="button" onClick={() => setSelected(booking)} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"><div><p className="font-bold text-slate-900">{booking.tour_name || "Tour"}</p><p className="mt-1 text-xs text-slate-500">{booking.booking_code} {booking.tour_date ? `· ${booking.tour_date}` : ""}</p></div><span className="text-sm font-bold text-blue-600">Write review</span></button>)}</div></section> : null}
    <section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">{customer ? "Your reviews" : "Verified traveller reviews"}</h2><span className="text-sm font-semibold text-slate-500">{data?.reviews.length ?? 0} total</span></div>{!data?.reviews.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No reviews to show yet.</div> : <div className="grid gap-4 md:grid-cols-2">{data.reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{review.tour_title || "Tour review"}</p><p className="mt-1 text-xs text-slate-500">{review.booking_code || `Booking #${review.booking_id}`}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${review.status === "approved" ? "bg-emerald-50 text-emerald-700" : review.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{review.status}</span></div><div className="mt-4"><Stars rating={review.rating} /></div>{review.review_text ? <p className="mt-3 text-sm leading-6 text-slate-600">{review.review_text}</p> : <p className="mt-3 text-sm italic text-slate-400">No written feedback provided.</p>}<p className="mt-4 text-xs text-slate-400">{review.created_at?.slice(0, 10)}</p></article>)}</div>}</section>
    {selected && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-3 sm:items-center sm:justify-center"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle size={19} /><span className="text-xs font-black uppercase tracking-wide">Verified completed trip</span></div><h2 className="mt-2 text-xl font-black text-slate-900">How was {selected.tour_name || "your trip"}?</h2><p className="mt-1 text-sm text-slate-500">Your feedback will be moderated before publication.</p><div className="mt-5"><Stars rating={rating} interactive onChange={setRating} /></div><textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={5} placeholder="What should other travellers know?" className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">Cancel</button><button disabled={submitting} className="rounded-xl bg-[#1769D1] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{submitting ? "Posting..." : "Post review"}</button></div></form></div>}
  </div>;
}
