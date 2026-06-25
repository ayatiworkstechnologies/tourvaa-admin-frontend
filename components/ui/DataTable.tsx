"use client";

import { Fragment } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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
  return (
    <div className="space-y-4">
      {onSearchChange && (
        <label className="relative block max-w-md">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            className="w-full rounded-2xl border border-[#E7EAF0]/80 bg-white py-3 pl-10 pr-4 text-sm font-medium shadow-[0_2px_8px_rgb(0,0,0,0.02)] outline-none focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10 transition-all"
          />
        </label>
      )}

      {error && <ErrorState message={error} />}

      <div className="overflow-x-auto rounded-3xl border border-[#E7EAF0]/60 bg-white shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm" aria-label={ariaLabel}>
          <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-[#667085]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-5 py-4 ${column.className || ""}`}>
                  {column.header}
                </th>
              ))}
              {actions && <th className="px-5 py-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6] bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-10 text-center">
                  <LoadingState label="Loading records..." table />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-10">
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <Fragment key={row.id ?? index}>
                  <tr className="transition-colors hover:bg-[#F3F8FC]">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-5 py-4 ${column.className || ""}`}>
                        {column.render ? column.render(row, index) : String((row as Record<string, unknown>)[column.key] ?? "-")}
                      </td>
                    ))}
                    {actions && <td className="px-5 py-4 text-right">{actions(row)}</td>}
                  </tr>
                  {renderExpandedRow && renderExpandedRow(row)}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {page !== undefined && pageSize !== undefined && total !== undefined && totalPages !== undefined && onPageChange && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E7EAF0]/60 bg-white px-5 py-4 text-sm font-medium text-[#667085] shadow-[0_2px_12px_rgb(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing <strong className="text-[#121826]">{rows.length ? (page - 1) * pageSize + 1 : 0}</strong>-
            <strong className="text-[#121826]">{Math.min(page * pageSize, total)}</strong> of <strong className="text-[#121826]">{total}</strong>
          </span>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7EAF0]/80 bg-white px-4 py-2 font-bold text-[#344054] shadow-sm hover:bg-[#F7F9FC] hover:text-[#121826] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="px-2 font-bold text-[#121826]">
              {page} / {Math.max(1, totalPages)}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(Math.max(1, totalPages), page + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7EAF0]/80 bg-white px-4 py-2 font-bold text-[#344054] shadow-sm hover:bg-[#F7F9FC] hover:text-[#121826] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
