"use client";

import PublicLayout from "@/components/public/PublicLayout";
import { NotFoundContent } from "@/components/public/NotFoundContent";

/**
 * Root-level 404 page — rendered outside any layout tree, so it supplies
 * its own PublicLayout (header + footer + providers).
 *
 * Also re-used by src/app/[...catchAll]/page.tsx for unknown routes.
 */
export default function NotFound() {
  return (
    <PublicLayout>
      <NotFoundContent />
    </PublicLayout>
  );
}
