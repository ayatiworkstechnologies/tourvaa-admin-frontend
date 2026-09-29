"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuCalendarDays as CalendarDays, LuCircleCheckBig as CheckCircle2, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuDownload as Download, LuSquarePen as Edit, LuExternalLink as ExternalLink, LuFilePen as FileEdit, LuImageOff as ImageOff, LuMapPin as MapPin, LuPlus as Plus, LuPowerOff as PowerOff, LuSearch as Search, LuTag as Tag, LuTrash2 as Trash2 } from "react-icons/lu";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import StatusBadge from "@/components/operations/StatusBadge";
import TourExcelImportButton from "@/components/tours/TourExcelImportButton";
import { CmsRecord, deleteCms, listCms, updateCmsStatus } from "@/lib/api/services/cmsService";
import api from "@/lib/api/client";
import { exportTourExcel } from "@/lib/api/services/tourImportExportService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { useCurrency } from "@/hooks/useCurrency";

const PAGE_SIZE = 12;

export default function ToursPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { hasPermission } = useAuthContext();
  const { format } = useCurrency();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get("supplier_id") || "";
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "published" | "draft" | "disabled">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, disabled: 0 });
  const [togglingId, setTogglingId] = useState<number | string | null>(null);
  const [exportingId, setExportingId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  /**
   * Per-tour: TourVaa's real cost from the supplier.
   * basePrice = cheapest supplier adult_price (what supplier charges TourVaa)
   * discPct   = active supplier-funded discount % (0 if none)
   * Displayed as: discountedPrice ~~basePrice~~ -X%
   */
  const [priceMap, setPriceMap] = useState<Record<string | number, { basePrice: number; discPct: number }>>({}); 

  const debouncedSearch = useDebounce(search, 350);
  const canCreate = hasPermission("tours.create");
  const canEdit = hasPermission("tours.edit");
  const canToggle = hasPermission("tours.disable");
  // Admin-only (this page itself is admin-only - suppliers manage their own
  // tours at /supplier/tours, which has no delete action at all). Requires
  // the actual delete permission -- the backend's remove_tour only accepts
  // tours.delete/update-tours, so showing this to tours.edit-only users just
  // set them up for a 403.
  const canDelete = hasPermission("tours.delete");

  const downloadTour = async (row: CmsRecord) => {
    setExportingId(row.id);
    try {
      await exportTourExcel(Number(row.id), String(row.tour_code || row.title || `tour-${row.id}`));
    } catch {
      toast.error("Could not download this tour's details.");
    } finally {
      setExportingId(null);
    }
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE, search: debouncedSearch };
      if (supplierId) params.supplier_id = supplierId;
      if (statusFilter) params.status = statusFilter;
      const response = await listCms("/tours", params);
      const fetchedRows: CmsRecord[] = response.items || response.data || [];
      setRows(fetchedRows);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);

      // Fetch real supplier pricing for each tour in parallel.
      // This gives TourVaa's actual cost from the supplier (adult_price)
      // after any supplier-funded discount — never the storefront price.
      if (fetchedRows.length > 0) {
        const entries = await Promise.all(
          fetchedRows.map(async (r) => {
            try {
              const [slabsRes, discountsRes] = await Promise.all([
                api.get(`/tours/${r.id}/pricing`),
                api.get(`/tours/${r.id}/discounts`),
              ]);
              const slabs: Array<{ adult_price?: number; passenger_from?: number }> =
                slabsRes.data?.data ?? slabsRes.data ?? [];
              const discounts: Array<{
                funded_by?: string;
                added_by?: string;
                discount_type?: string;
                discount_value?: number;
                status?: string;
              }> = discountsRes.data?.data ?? discountsRes.data ?? [];

              const sorted = [...slabs].sort((a, b) => (a.passenger_from ?? 0) - (b.passenger_from ?? 0));
              const basePrice = Number(sorted[0]?.adult_price ?? r.price_start_per_person ?? 0);

              const activeSupplierDiscount = discounts.find(
                (d) => d.status === "active" &&
                  (d.funded_by === "SUPPLIER" || (!d.funded_by && d.added_by === "supplier")),
              );
              const discPct = activeSupplierDiscount?.discount_type === "percentage"
                ? Number(activeSupplierDiscount.discount_value ?? 0)
                : 0;

              return [r.id, { basePrice, discPct }] as const;
            } catch {
              return [r.id, { basePrice: Number(r.price_start_per_person ?? 0), discPct: 0 }] as const;
            }
          }),
        );
        setPriceMap(Object.fromEntries(entries));
      }
    } catch {
      toast.error("Could not load tours.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, supplierId, statusFilter, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const base: Record<string, string | number> = { page: 1, limit: 1 };
      if (supplierId) base.supplier_id = supplierId;
      const [allRes, publishedRes, draftRes, disabledRes] = await Promise.all([
        listCms("/tours", base),
        listCms("/tours", { ...base, status: "published" }),
        listCms("/tours", { ...base, status: "draft" }),
        listCms("/tours", { ...base, status: "disabled" }),
      ]);
      setStats({
        total: allRes.total || 0,
        published: publishedRes.total || 0,
        draft: draftRes.total || 0,
        disabled: disabledRes.total || 0,
      });
    } catch {
      // Non-critical - stat cards just stay at zero.
    }
  }, [supplierId]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const deleteTour = async (row: CmsRecord) => {
    if (!(await confirm({ title: "Delete tour", message: `Delete "${row.title || "this tour"}" permanently? This cannot be undone.`, confirmLabel: "Delete", danger: true }))) return;
    setDeletingId(row.id);
    try {
      await deleteCms("/tours", row.id);
      toast.success("Tour deleted.");
      await Promise.all([fetchRows(), fetchStats()]);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not delete this tour.");
    } finally {
      setDeletingId(null);
    }
  };

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
      { label: "Total Tours", value: stats.total, icon: MapPin, accent: "text-dash-brand-hover bg-[#EDF5FF]", filter: "" as const },
      { label: "Published", value: stats.published, icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-50", filter: "published" as const },
      { label: "Draft", value: stats.draft, icon: FileEdit, accent: "text-amber-700 bg-amber-50", filter: "draft" as const },
      { label: "Disabled", value: stats.disabled, icon: PowerOff, accent: "text-red-600 bg-red-50", filter: "disabled" as const },
    ],
    [stats]
  );

  return (
    <ModuleWrapper title="Tours" requiredPermission="tours.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[28px] font-black tracking-tight text-dash-text">Tours</h2>
            <p className="mt-1 text-sm font-medium text-dash-muted">
              Create draft tours, assign locations/categories/suppliers, and manage publishing status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canCreate && <TourExcelImportButton theme="admin" onImported={() => { void fetchRows(); void fetchStats(); }} />}
            {canCreate && (
              <Link
                href="/admin/tours/create"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dash-brand px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition-all hover:-translate-y-0.5 hover:bg-dash-brand-hover sm:w-auto"
              >
                <Plus size={18} strokeWidth={2.5} />
                Add Tour
              </Link>
            )}
          </div>
        </div>

        {supplierId && (
          <div className="flex items-center gap-2 rounded-xl border border-dash-border bg-[#EDF5FF] px-4 py-2.5 text-sm font-bold text-dash-brand-hover">
            Filtered by supplier #{supplierId}
            <Link href="/admin/tours" className="ml-auto text-xs font-bold underline">Clear</Link>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, accent, filter }) => {
            const active = statusFilter === filter;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStatusFilter(filter)}
                aria-pressed={active}
                className={`rounded-2xl border bg-white p-5 text-left shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] transition-all hover:-translate-y-0.5 ${active ? "border-dash-brand ring-2 ring-dash-brand/20" : "border-dash-border-soft"}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
                  <Icon size={18} />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">{label}</p>
                <p className="mt-1 text-xl font-black text-dash-text">{value}</p>
              </button>
            );
          })}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block max-w-sm flex-1">
            <span className="sr-only">Search tours</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B9C6]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tours by title, code…"
              className="w-full rounded-xl border border-dash-border-soft bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
            />
          </label>
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border-soft bg-white px-3 py-2.5 text-xs font-bold text-dash-muted hover:bg-dash-bg"
            >
              Status: {statusFilter} ✕
            </button>
          )}
        </div>

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
                  className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover"
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
                  className="flex flex-col overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)]"
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
                      <p className="text-xs font-bold uppercase tracking-wide text-dash-subtle">
                        {row.tour_code || "-"}
                      </p>
                      <h3 className="mt-0.5 line-clamp-1 text-base font-black text-dash-text">{String(row.title || "Untitled tour")}</h3>
                      {row.subtitle ? (
                        <p className="mt-0.5 line-clamp-1 text-sm text-dash-muted">{String(row.subtitle)}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-dash-muted">
                      {location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} className="text-dash-subtle" />
                          {location}
                        </span>
                      )}
                      {Boolean(row.number_of_days) && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-dash-subtle" />
                          {row.number_of_days} {Number(row.number_of_days) === 1 ? "day" : "days"}
                        </span>
                      )}
                      {row.category_name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={13} className="text-dash-subtle" />
                          {String(row.category_name)}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs font-semibold text-dash-subtle">
                      Supplier: <span className="text-dash-body">{String(row.supplier_name || "-")}</span>
                    </p>

                    <div className="mt-auto flex flex-col gap-2.5 border-t border-[#F0F3F8] pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-dash-subtle">TourVaa gets</p>
                          {(() => {
                            const priceData = priceMap[row.id];
                            if (!priceData) {
                              return <span className="mt-0.5 block h-5 w-24 animate-pulse rounded bg-dash-bg" />;
                            }
                            const { basePrice, discPct } = priceData;
                            const hasDiscount = discPct > 0;
                            const discountedPrice = hasDiscount ? basePrice * (1 - discPct / 100) : null;
                            return hasDiscount && discountedPrice !== null ? (
                              <span className="flex items-baseline gap-1.5">
                                <span className="truncate text-lg font-black text-dash-text">
                                  {format(discountedPrice, row.currency as string)}
                                </span>
                                <span className="text-xs font-semibold text-dash-subtle line-through">
                                  {format(basePrice, row.currency as string)}
                                </span>
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                                  -{discPct}%
                                </span>
                              </span>
                            ) : (
                              <p className="truncate text-lg font-black text-dash-text">
                                {format(basePrice, row.currency as string)}
                              </p>
                            );
                          })()}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {(row.status === "published" || row.status === "active") && row.slug && (
                            <a
                              href={`/tours/${row.id}/${row.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`View ${row.title || "tour"} live`}
                              title="View live"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-dash-bg"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={exportingId === row.id}
                            onClick={() => void downloadTour(row)}
                            aria-label={`Download ${row.title || "tour"} details`}
                            title="Download tour details"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-dash-bg disabled:opacity-60"
                          >
                            <Download size={14} />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              disabled={deletingId === row.id}
                              onClick={() => void deleteTour(row)}
                              aria-label={`Delete ${row.title || "tour"}`}
                              title="Delete tour"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#FFCDD2] text-red-500 transition-colors hover:bg-[#FFF0F0] disabled:opacity-60"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {(canEdit || canToggle) && (
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <Link
                              href={`/admin/tours/${row.id}/edit`}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover transition-colors hover:bg-[#E7F5FF]"
                            >
                              <Edit size={14} /> Edit
                            </Link>
                          )}
                          {canToggle && (
                            <button
                              type="button"
                              disabled={togglingId === row.id}
                              onClick={() => void toggleStatus(row)}
                              className="inline-flex flex-1 items-center justify-center rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-muted transition-colors hover:bg-dash-bg disabled:opacity-60"
                            >
                              {togglingId === row.id
                                ? "Saving…"
                                : row.status === "published"
                                ? "Disable"
                                : "Publish"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-dash-border-soft bg-white px-5 py-3 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[#8B93A1]">
              Showing <strong className="text-dash-body">{(page - 1) * PAGE_SIZE + 1}</strong>–
              <strong className="text-dash-body">{Math.min(page * PAGE_SIZE, total)}</strong> of{" "}
              <strong className="text-dash-body">{total}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-dash-border-soft px-3 text-xs font-bold text-dash-body transition-colors hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="min-w-14 rounded-lg bg-[#EDF5FF] px-3 py-1.5 text-center text-xs font-bold text-dash-brand-hover">
                {page} / {Math.max(1, totalPages)}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-dash-border-soft px-3 text-xs font-bold text-dash-body transition-colors hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      {dialog}
    </ModuleWrapper>
  );
}
