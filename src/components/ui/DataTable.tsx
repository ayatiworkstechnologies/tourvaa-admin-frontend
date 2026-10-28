"use client";

import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuSearch as Search,
  LuX as X,
} from "react-icons/lu";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
};

type Props<T> = {
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows?: T[];
  loading?: boolean;
  error?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  actions?: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  renderExpandedRow?: (row: T) => ReactNode;
  minWidthClass?: string;
};

export default function DataTable<T extends { id?: number | string }>({
  ariaLabel,
  columns,
  rows = [],
  loading,
  error,
  page,
  pageSize,
  total,
  totalPages,
  search = "",
  onSearchChange,
  onPageChange,
  actions,
  emptyTitle = "No records found",
  emptyDescription,
  emptyAction,
  renderExpandedRow,
  minWidthClass,
}: Props<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [horizontalOverflow, setHorizontalOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const updateHorizontalScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const hasOverflow = container.scrollWidth > container.clientWidth + 1;
    setHorizontalOverflow(hasOverflow);
    setTableScrollWidth(container.scrollWidth);
    setCanScrollLeft(container.scrollLeft > 1);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(updateHorizontalScrollState);
    resizeObserver.observe(container);
    // Rows can become wider after the outer card has mounted, for example
    // when asynchronously rendered statuses or action controls appear. Watch
    // the table too, otherwise the native bottom scrollbar appears without
    // the visible top navigation controls.
    if (tableRef.current) resizeObserver.observe(tableRef.current);
    container.addEventListener("scroll", updateHorizontalScrollState, { passive: true });
    const syncTopScrollbar = () => {
      if (topScrollRef.current && topScrollRef.current.scrollLeft !== container.scrollLeft) {
        topScrollRef.current.scrollLeft = container.scrollLeft;
      }
    };
    container.addEventListener("scroll", syncTopScrollbar, { passive: true });
    const animationFrame = window.requestAnimationFrame(updateHorizontalScrollState);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      container.removeEventListener("scroll", updateHorizontalScrollState);
      container.removeEventListener("scroll", syncTopScrollbar);
    };
  }, [columns.length, rows.length, updateHorizontalScrollState]);

  const scrollHorizontally = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({
      left: (direction === "left" ? -1 : 1) * Math.max(260, Math.round(container.clientWidth * 0.75)),
      behavior: "smooth",
    });
  };

  const syncTableFromTopScrollbar = () => {
    const tableScroller = scrollRef.current;
    const topScroller = topScrollRef.current;
    if (tableScroller && topScroller && tableScroller.scrollLeft !== topScroller.scrollLeft) {
      tableScroller.scrollLeft = topScroller.scrollLeft;
    }
  };

  const hasPagination =
    page !== undefined &&
    pageSize !== undefined &&
    total !== undefined &&
    totalPages !== undefined &&
    onPageChange !== undefined;

  const safeTotalPages = Math.max(1, totalPages ?? 1);
  const start = hasPagination && rows.length ? (page! - 1) * pageSize! + 1 : 0;
  const end = hasPagination ? Math.min(page! * pageSize!, total!) : 0;

  const computedMinWidth =
    minWidthClass ??
    (columns.length <= 4
      ? "min-w-full"
      : columns.length <= 7
      ? "min-w-[760px]"
      : "min-w-[1020px]");

  const totalCols = columns.length + (actions ? 1 : 0);

  return (
    <div className="space-y-3.5">
      {/* Search input (if standalone search handler is supplied) */}
      {onSearchChange && (
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search records…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9.5 pr-8 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {error && <ErrorState message={error} />}

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        {horizontalOverflow && (
          <div className="border-b border-slate-200/90 bg-slate-50/90 px-4 py-2">
            <div className="flex items-center justify-end gap-2">
              <span className="mr-auto text-xs font-medium text-slate-500">More columns available</span>
              <button
                type="button"
                onClick={() => scrollHorizontally("left")}
                disabled={!canScrollLeft}
                aria-label="Show previous table columns"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => scrollHorizontally("right")}
                disabled={!canScrollRight}
                aria-label="Show more table columns"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div
              ref={topScrollRef}
              onScroll={syncTableFromTopScrollbar}
              aria-label="Horizontal table scrollbar"
              className="mt-1.5 h-3 overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]"
            >
              <div aria-hidden="true" style={{ width: tableScrollWidth, height: 1 }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table
            ref={tableRef}
            className={`w-full ${computedMinWidth} border-collapse text-left text-sm`}
            aria-label={ariaLabel}
          >
            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/90 select-none">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-4.5 sm:py-3.5 ${
                      col.className?.includes("text-right") ? "text-right" : ""
                    } ${col.className?.includes("text-center") ? "text-center" : ""}`}
                  >
                    {col.header}
                  </th>
                ))}
                {actions && (
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-4.5 sm:py-3.5"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                // Shimmer skeleton rows for smooth loading UX
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                    {Array.from({ length: totalCols }).map((_, cIdx) => (
                      <td key={`cell-${rIdx}-${cIdx}`} className="px-3 py-3 sm:px-4.5 sm:py-4">
                        <div
                          className="h-4 rounded-md bg-slate-100"
                          style={{
                            width:
                              cIdx === 0
                                ? "24px"
                                : cIdx === totalCols - 1
                                ? "64px"
                                : `${40 + ((rIdx * 17 + cIdx * 23) % 45)}%`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="px-3 py-12 sm:px-4.5 sm:py-16">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      action={emptyAction}
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <Fragment key={row.id ?? index}>
                    <tr className="group transition-colors duration-150 hover:bg-slate-50/80">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-3 py-3 text-xs text-slate-700 align-middle sm:px-4.5 sm:py-3.5 sm:text-sm ${
                            col.className ?? ""
                          }`}
                        >
                          {col.render
                            ? col.render(row, index)
                            : String(
                                (row as Record<string, unknown>)[col.key] ?? "-"
                              )}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-3 py-3 text-right align-middle sm:px-4.5 sm:py-3.5">
                          {actions(row)}
                        </td>
                      )}
                    </tr>
                    {renderExpandedRow && renderExpandedRow(row)}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination Footer */}
        {hasPagination && (
          <div className="flex flex-col gap-3 border-t border-slate-200/90 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4.5 sm:py-3.5">
            <span className="text-xs font-medium text-slate-500">
              {total === 0 ? (
                "No records found"
              ) : (
                <>
                  Showing{" "}
                  <strong className="font-semibold text-slate-900">{start}</strong>
                  {" "}to{" "}
                  <strong className="font-semibold text-slate-900">{end}</strong>
                  {" "}of{" "}
                  <strong className="font-semibold text-slate-900">{total}</strong>
                  {" "}results
                </>
              )}
            </span>

            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => onPageChange!(Math.max(1, page! - 1))}
                disabled={page! <= 1}
                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span className="inline-flex h-8.5 min-w-16 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 px-3 text-xs font-bold text-slate-800">
                Page {page} of {safeTotalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange!(Math.min(safeTotalPages, page! + 1))}
                disabled={page! >= safeTotalPages}
                className="inline-flex h-8.5 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
