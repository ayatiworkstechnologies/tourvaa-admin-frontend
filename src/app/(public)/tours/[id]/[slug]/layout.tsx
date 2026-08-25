import { tourMetadataFor } from "@/lib/seo/tourMetadata";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const resolved = await params;
  const canonicalPath = `/tours/${resolved.id}/${resolved.slug}`;
  const fetchPath = `/tours/${encodeURIComponent(resolved.id)}/${encodeURIComponent(resolved.slug)}`;
  return tourMetadataFor("/tours/[id]/[slug]", canonicalPath, fetchPath);
}
