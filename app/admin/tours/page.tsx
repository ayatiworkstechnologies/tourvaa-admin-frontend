"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuCalendarDays as CalendarDays, LuCircleCheckBig as CheckCircle2, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuSquarePen as Edit, LuFilePen as FileEdit, LuImageOff as ImageOff, LuMapPin as MapPin, LuPlus as Plus, LuPowerOff as PowerOff, LuSearch as Search, LuTag as Tag } from "react-icons/lu";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import StatusBadge from "@/components/operations/StatusBadge";
import { CmsRecord, listCms, updateCmsStatus } from "@/lib/services/cmsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";

const PAGE_SIZE = 12;

function money(value: unknown, currency: unknown) {
  const amount = Number(value || 0).toLocaleString();
  return `${currency || ""} ${amount}`.trim();
}

export default function ToursPage() {
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, disabled: 0 });
  const [togglingId, setTogglingId] = useState<number | string | null>(null);

  const debouncedSearch = useDebounce(search, 350);
  const canCreate = hasPermission("tours.create");
  const canEdit = hasPermission("tours.edit");
  const canToggle = hasPermission("tours.disable");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listCms("/tours", { page, limit: PAGE_SIZE, search: debouncedSearch });
      setRows(response.items || response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch {
      toast.error("Could not load tours.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const [allRes, publishedRes, draftRes, disabledRes] = await Promise.all([
        listCms("/tours", { page: 1, limit: 1 }),
        listCms("/tours", { page: 1, limit: 1, status: "published" }),
        listCms("/tours", { page: 1, limit: 1, status: "draft" }),
        listCms("/tours", { page: 1, limit: 1, status: "disabled" }),
      ]);
      setStats({
        total: allRes.total || 0,
        published: publishedRes.total || 0,
        draft: draftRes.total || 0,
        disabled: disabledRes.total || 0,
      });
    } catch {
      // Non-critical — stat cards just stay at zero.
    }
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const toggleStatus = async (row: CmsRecord) => {
    setTogglingId(row.id);
    try {
      const nextStatus = row.status === "published" ? "disabled" : "published";
      await updateCmsStatus("/tours", row.id, nextStatus);
      toast.success(nextStatus === "published" ? "Tour published." : "Tour disabled.");
      await Promise.all([fetchRows(), fetchStats()]);
    } catch {
      toast.error("Could not update tour status.");
    } finally {
      setTogglingId(null);
    }
  };

  const statCards = useMemo(
    () => [
      { label: "Total Tours", value: stats.total, icon: MapPin, accent: "text-[#2F9FE9] bg-[#EDF5FF]" },
      { label: "Published", value: stats.published, icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-50" },
      { label: "Draft", value: stats.draft, icon: FileEdit, accent: "text-amber-700 bg-amber-50" },
      { label: "Disabled", value: stats.disabled, icon: PowerOff, accent: "text-red-600 bg-red-50" },
    ],
    [stats]
  );

  return (
    <ModuleWrapper title="Tours" requiredPermission="tours.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[28px] font-black tracking-tight text-[#121826]">Tours</h2>
            <p className="mt-1 text-sm font-medium text-[#667085]">
              Create draft tours, assign locations/categories/suppliers, and manage publishing status.
            </p>
          </div>
          {canCreate && (
            <Link
              href="/admin/tours/create"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#2F9FE9] sm:w-auto"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Tour
            </Link>
          )}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <div
              key={label}
              className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#98A2B3]">{label}</p>
              <p className="mt-1 text-xl font-black text-[#121826]">{value}</p>
            </div>
          ))}
        </section>

        <label className="relative block max-w-sm">
          <span className="sr-only">Search tours</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B9C6]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tours by title, code…"
            className="w-full rounded-xl border border-[#E9EDF3] bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10"
          />
        </label>

        {loading ? (
          <LoadingState label="Loading tours…" />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No tours found."
            description="Try a different search, or create your first tour."
            action={
              canCreate && (
                <Link
                  href="/admin/tours/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9]"
                >
                  <Plus size={16} /> Add Tour
                </Link>
              )
            }
          />
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const bannerImage = String(row.banner_image || "");
              const location = [row.city_name, row.country_name].filter(Boolean).join(", ");

              return (
                <article
                  key={row.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#E9EDF3] bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)]"
                >
                  <div className="relative aspect-[16/9] w-full bg-[#F0F3F8]">
                    {bannerImage ? (
                      <Image
                        src={bannerImage}
                        alt={String(row.image_alt_text || row.title || "Tour banner")}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#B0B9C6]">
                        <ImageOff size={28} />
                      </div>
                    )}
                    <div className="absolute right-3 top-3">
                      <StatusBadge value={String(row.status || "")} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#98A2B3]">
                        {row.tour_code || "—"}
                      </p>
                      <h3 className="mt-0.5 line-clamp-1 text-base font-black text-[#121826]">{String(row.title || "Untitled tour")}</h3>
                      {row.subtitle ? (
                        <p className="mt-0.5 line-clamp-1 text-sm text-[#667085]">{String(row.subtitle)}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-[#667085]">
                      {location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#98A2B3]" />
                          {location}
                        </span>
                      )}
                      {Boolean(row.number_of_days) && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-[#98A2B3]" />
                          {row.number_of_days} {Number(row.number_of_days) === 1 ? "day" : "days"}
                        </span>
                      )}
                      {row.category_name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={13} className="text-[#98A2B3]" />
                          {String(row.category_name)}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs font-semibold text-[#98A2B3]">
                      Supplier: <span className="text-[#344054]">{String(row.supplier_name || "—")}</span>
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-[#F0F3F8] pt-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#98A2B3]">From</p>
                        <p className="text-lg font-black text-[#121826]">
                          {money(row.price_start_per_person, row.currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Link
                            href={`/admin/tours/${row.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7EAF0] px-3 py-2 text-xs font-bold text-[#2F9FE9] hover:bg-[#E7F5FF]"
                          >
                            <Edit size={14} /> Edit
                          </Link>
                        )}
                        {canToggle && (
                          <button
                            type="button"
                            disabled={togglingId === row.id}
                            onClick={() => void toggleStatus(row)}
                            className="rounded-lg border border-[#E7EAF0] px-3 py-2 text-xs font-bold text-[#667085] hover:bg-[#F7F9FC] disabled:opacity-60"
                          >
                            {togglingId === row.id
                              ? "Saving…"
                              : row.status === "published"
                              ? "Disable"
                              : "Publish"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#E9EDF3] bg-white px-5 py-3 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[#8B93A1]">
              Showing <strong className="text-[#344054]">{(page - 1) * PAGE_SIZE + 1}</strong>–
              <strong className="text-[#344054]">{Math.min(page * PAGE_SIZE, total)}</strong> of{" "}
              <strong className="text-[#344054]">{total}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E9EDF3] px-3 text-xs font-bold text-[#344054] transition-colors hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="min-w-14 rounded-lg bg-[#EDF5FF] px-3 py-1.5 text-center text-xs font-bold text-[#2F9FE9]">
                {page} / {Math.max(1, totalPages)}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E9EDF3] px-3 text-xs font-bold text-[#344054] transition-colors hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </ModuleWrapper>
  );
}
