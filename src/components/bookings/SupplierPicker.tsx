"use client";

import { useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuSearch as Search, LuWarehouse as Warehouse, LuX as X } from "react-icons/lu";

import api from "@/lib/api/client";
import { useDebounce } from "@/hooks/useDebounce";

type SupplierOption = { id: number; supplier_name: string; supplier_code?: string };

type Props = {
  value: number | null;
  onChange: (supplierId: number | null, name: string) => void;
  placeholder?: string;
};

export default function SupplierPicker({ value, onChange, placeholder = "Search suppliers by name or code…" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    api
      .get("/suppliers/", { params: { limit: 20, search: debouncedQuery } })
      .then((response) => {
        if (!active) return;
        const items = (response.data?.items ?? response.data?.data ?? []) as SupplierOption[];
        setOptions(items);
      })
      .catch(() => setOptions([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debouncedQuery, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (supplier: SupplierOption) => {
    onChange(supplier.id, supplier.supplier_name);
    setSelectedName(supplier.supplier_name);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange(null, "");
    setSelectedName("");
    setQuery("");
  };

  if (value && selectedName) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-dash-text">
          <Warehouse size={14} className="text-dash-subtle" />
          {selectedName}
        </span>
        <button type="button" onClick={clear} className="rounded-lg p-1 text-dash-subtle hover:bg-[#F0F3F8] hover:text-dash-muted">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B9C6]" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-dash-border-soft bg-white shadow-[0_8px_24px_rgb(0,0,0,0.1)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-dash-subtle">
              <Loader2 size={16} className="animate-spin" /> Searching…
            </div>
          ) : options.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-dash-subtle">No matching suppliers.</p>
          ) : (
            options.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                onClick={() => select(supplier)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm hover:bg-dash-bg"
              >
                <span className="font-semibold text-dash-text">{supplier.supplier_name}</span>
                {supplier.supplier_code && <span className="text-xs text-dash-subtle">{supplier.supplier_code}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
