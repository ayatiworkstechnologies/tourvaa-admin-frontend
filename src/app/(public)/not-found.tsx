"use client";

import { NotFoundContent } from "@/components/public/NotFoundContent";

/**
 * 404 for routes under the (public) group.
 * The parent (public)/layout.tsx already provides PublicLayout (header + footer),
 * so we render only the page content here — no extra PublicLayout wrapper.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
