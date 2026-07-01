"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { listCms } from "@/lib/services/cmsService";
import { useDebounce } from "@/hooks/useDebounce";

type TourOption = { id: number; title: string; tour_code?: string };

type Props = {
  value: number | null;
  onChange: (tourId: number | null, title: string) => void;
  excludeIds?: number[];
  placeholder?: string;
};

export default function TourPicker({ value, onChange, excludeIds = [], placeholder = "Search tours by title or code…" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TourOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    listCms("/tours", { limit: 20, search: debouncedQuery })
      .then((response) => {
        if (!active) return;
        const items = (response.items ?? response.data ?? []) as Array<{ id: number; title: string; tour_code?: string }>;
        setOptions(
          items
            .map((t) => ({ id: t.id, title: String(t.title), tour_code: t.tour_code }))
            .filter((t) => !excludeIds.includes(t.id))
        );
      })
      .catch(() => setOptions([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const select = (tour: TourOption) => {
    onChange(tour.id, tour.title);
    setSelectedTitle(tour.title);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange(null, "");
    setSelectedTitle("");
    setQuery("");
  };

  if (value && selectedTitle) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E7EAF0] bg-[#F7F9FC] px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#121826]">
          <MapPin size={14} className="text-[#98A2B3]" />
          {selectedTitle}
        </span>
        <button type="button" onClick={clear} className="rounded-lg p-1 text-[#98A2B3] hover:bg-[#F0F3F8] hover:text-[#667085]">
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
          className="w-full rounded-xl border border-[#E7EAF0] py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-[#E9EDF3] bg-white shadow-[0_8px_24px_rgb(0,0,0,0.1)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-[#98A2B3]">
              <Loader2 size={16} className="animate-spin" /> Searching…
            </div>
          ) : options.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#98A2B3]">No matching tours.</p>
          ) : (
            options.map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => select(tour)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm hover:bg-[#F7F9FC]"
              >
                <span className="font-semibold text-[#121826]">{tour.title}</span>
                {tour.tour_code && <span className="text-xs text-[#98A2B3]">{tour.tour_code}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
