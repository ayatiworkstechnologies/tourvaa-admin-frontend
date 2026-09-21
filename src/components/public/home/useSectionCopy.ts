import { useEffect, useState } from "react";
import { fetchContentBlock } from "@/lib/api/publicClient";

export type SectionCopy = Record<string, unknown>;

// Admin-editable copy for a homepage section (CMS > Home Page). Returns the
// block's saved fields; callers fall back to their built-in text for any
// field that is blank, so an empty CMS block renders exactly as before.
export function useSectionCopy(blockKey: string): SectionCopy {
  const [copy, setCopy] = useState<SectionCopy>({});
  useEffect(() => {
    let active = true;
    fetchContentBlock<SectionCopy>(blockKey)
      .then((res) => {
        if (active && res?.data) setCopy(res.data as SectionCopy);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [blockKey]);
  return copy;
}

export const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

export const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim()) : [];
