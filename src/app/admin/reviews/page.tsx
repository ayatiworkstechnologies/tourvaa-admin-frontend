"use client";

import { useCallback, useEffect, useState } from "react";
import { LuStar as Star, LuCircleCheckBig as CheckCircle2, LuCircleX as XCircle } from "react-icons/lu";
import api from "@/lib/api/client";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";

type Review = {
  id: number;
  booking_id: number;
  customer_name?: string;
  tour_id: number;
  tour_title?: string;
  rating: number;
  review_text?: string;
  status: string;
  created_at?: string;
};

const TABS = ["pending", "approved", "rejected"] as const;
type Tab = (typeof TABS)[number];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={13} className={index < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actingId, setActingId] = useState<number | null>(null);
  const limit = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reviews", { params: { status: activeTab, page, limit } });
      setReviews(res.data?.items ?? res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      toast.error("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, toast]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  function handleTab(tab: Tab) {
    setActiveTab(tab);
    setPage(1);
  }

  async function moderate(id: number, action: "approve" | "reject") {
    setActingId(id);
    try {
      await api.patch(`/admin/reviews/${id}/${action}`);
      toast.success(action === "approve" ? "Review approved." : "Review rejected.");
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Could not update this review.");
    } finally {
      setActingId(null);
    }
  }

  const columns: DataTableColumn<Review>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * limit + index + 1,
    },
    { key: "tour", header: "Tour", render: (r) => r.tour_title ?? `Tour #${r.tour_id}`, className: "font-bold text-dash-text" },
    { key: "customer", header: "Customer", render: (r) => r.customer_name ?? "-", className: "text-dash-muted" },
    { key: "rating", header: "Rating", render: (r) => <Stars rating={r.rating} /> },
    { key: "text", header: "Review", render: (r) => <span className="line-clamp-2 max-w-md">{r.review_text || "-"}</span>, className: "text-dash-muted" },
    { key: "date", header: "Submitted", render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : "-", className: "hidden text-dash-muted sm:table-cell" },
  ];

  return (
    <ModuleWrapper title="Reviews" requiredPermission="tours.view">
      <div className="mb-4">
        <h1 className="text-xl font-black text-dash-text">Customer Reviews</h1>
        <p className="mt-1 text-sm text-dash-subtle">Moderate reviews before they appear on public tour pages.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-dash-border bg-white p-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTab(tab)}
            className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition-all ${
              activeTab === tab ? "bg-dash-brand text-white shadow-md" : "border border-dash-border bg-white text-dash-muted hover:border-blue-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <DataTable
        ariaLabel="Reviews"
        columns={columns}
        rows={reviews}
        loading={loading}
        page={page}
        pageSize={limit}
        total={total}
        totalPages={Math.max(1, Math.ceil(total / limit))}
        onPageChange={setPage}
        emptyTitle="No reviews here"
        emptyDescription={`There are no ${activeTab} reviews right now.`}
        actions={activeTab === "pending" ? (r) => (
          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={actingId === r.id} onClick={() => moderate(r.id, "approve")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
              <CheckCircle2 size={14} /> Approve
            </button>
            <button type="button" disabled={actingId === r.id} onClick={() => moderate(r.id, "reject")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50">
              <XCircle size={14} /> Reject
            </button>
          </div>
        ) : undefined}
      />
    </ModuleWrapper>
  );
}
