"use client";

import { Fragment } from "react";
import { LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuSearch as Search } from "react-icons/lu";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  error?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  actions?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  renderExpandedRow?: (row: T) => React.ReactNode;
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
}: Props<T>) {
  const hasPagination =
    page !== undefined &&
    pageSize !== undefined &&
    total !== undefined &&
    totalPages !== undefined &&
    onPageChange !== undefined;

  const safeTotalPages = Math.max(1, totalPages ?? 1);
  const start = hasPagination && rows.length ? (page! - 1) * pageSize! + 1 : 0;
  const end   = hasPagination ? Math.min(page! * pageSize!, total!) : 0;

  return (
    <div className="space-y-3">
      {/* search bar (standalone, above card) */}
      {onSearchChange && (
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search</span>
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B9C6]"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-xl border border-dash-border-soft bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
          />
        </label>
      )}

      {error && <ErrorState message={error} />}

      {/* table card */}
      <div className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table
            className="w-full min-w-170 border-collapse text-left text-sm"
            aria-label={ariaLabel}
          >
            {/* head */}
            <thead>
              <tr className="border-b border-[#F0F3F8] bg-dash-bg">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-[#8B93A1] ${col.className ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
                {actions && (
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-[#8B93A1]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* body */}
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-5 py-14 text-center"
                  >
                    <LoadingState label="Loading…" table />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-5 py-14"
                  >
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
                    <tr className="border-b border-dash-bg-muted transition-colors last:border-0 hover:bg-[#F7FAFF]">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-5 py-4 text-sm text-dash-body ${col.className ?? ""}`}
                        >
                          {col.render
                            ? col.render(row, index)
                            : String((row as Record<string, unknown>)[col.key] ?? "-")}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-5 py-4 text-right">
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

        {/* pagination (inside card) */}
        {hasPagination && (
          <div className="flex flex-col gap-3 border-t border-[#F0F3F8] bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[#8B93A1]">
              {total === 0
                ? "No records"
                : <>Showing <strong className="text-dash-body">{start}</strong>–<strong className="text-dash-body">{end}</strong> of <strong className="text-dash-body">{total}</strong></>}
            </span>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => onPageChange!(Math.max(1, page! - 1))}
                disabled={page! <= 1}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-dash-border-soft px-3 text-xs font-bold text-dash-body transition-colors hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="min-w-14 rounded-lg bg-[#EDF5FF] px-3 py-1.5 text-center text-xs font-bold text-dash-brand-hover">
                {page} / {safeTotalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange!(Math.min(safeTotalPages, page! + 1))}
                disabled={page! >= safeTotalPages}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-dash-border-soft px-3 text-xs font-bold text-dash-body transition-colors hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
