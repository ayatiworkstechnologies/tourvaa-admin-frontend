"use client";

import { useCallback, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export function usePagination(initialLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search);

  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const updateLimit = useCallback((value: number) => {
    setLimit(value);
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    limit,
    setLimit: updateLimit,
    search,
    setSearch: updateSearch,
    debouncedSearch,
    total,
    setTotal,
    totalPages,
    setTotalPages,
    next: () => setPage((current) => Math.min(totalPages, current + 1)),
    previous: () => setPage((current) => Math.max(1, current - 1)),
  };
}
