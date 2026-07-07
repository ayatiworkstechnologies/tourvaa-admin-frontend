import { LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight } from "react-icons/lu";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-[#EEF2F6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#667085]">
        Showing <span className="font-bold text-[#121826]">{start}</span> to{" "}
        <span className="font-bold text-[#121826]">{end}</span> of{" "}
        <span className="font-bold text-[#121826]">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E7EAF0] px-3 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <span className="rounded-lg bg-[#E7F5FF] px-3 py-2 text-sm font-bold text-[#2F9FE9]">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E7EAF0] px-3 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
