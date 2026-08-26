"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuMapPin as MapPin, LuSearch as Search, LuX as X } from "react-icons/lu";

import { listCms } from "@/lib/api/services/cmsService";
import { useDebounce } from "@/hooks/useDebounce";

type TourOption = { id: number; title: string; tour_code?: string; image?: string };

function TourThumb({ src, size = "sm" }: { src?: string; size?: "sm" | "md" }) {
  const dims = size === "md" ? "h-10 w-14" : "h-8 w-11";
  if (!src) {
    return (
      <span className={`flex ${dims} shrink-0 items-center justify-center rounded-md border border-dash-border bg-dash-bg text-dash-subtle`}>
        <MapPin size={12} />
      </span>
    );
  }
  return (
    <span className={`relative ${dims} shrink-0 overflow-hidden rounded-md border border-dash-border bg-dash-bg`}>
      <Image src={src} alt="" fill unoptimized className="object-cover" sizes="56px" />
    </span>
  );
}

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
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    listCms("/tours", { limit: 20, search: debouncedQuery })
      .then((response) => {
        if (!active) return;
        const items = (response.items ?? response.data ?? []) as Array<{ id: number; title: string; tour_code?: string; banner_image?: string | null }>;
        setOptions(
          items
            .map((t) => ({ id: t.id, title: String(t.title), tour_code: t.tour_code, image: t.banner_image ?? undefined }))
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
    setSelectedImage(tour.image);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange(null, "");
    setSelectedTitle("");
    setSelectedImage(undefined);
    setQuery("");
  };

  if (value && selectedTitle) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5">
        <span className="inline-flex items-center gap-3 text-sm font-semibold text-dash-text">
          <TourThumb src={selectedImage} />
          {selectedTitle}
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
            <p className="px-4 py-6 text-center text-sm text-dash-subtle">No matching tours.</p>
          ) : (
            options.map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => select(tour)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-dash-bg"
              >
                <TourThumb src={tour.image} size="md" />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold text-dash-text">{tour.title}</span>
                  {tour.tour_code && <span className="text-xs text-dash-subtle">{tour.tour_code}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
