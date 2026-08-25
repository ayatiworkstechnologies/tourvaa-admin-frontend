import { fetchTourForSeo, tourJsonLdFor, tourMetadataFrom } from "@/lib/seo/tourMetadata";

export default async function Layout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ id: string; slug: string }> }>) {
  const resolved = await params;
  const canonicalPath = `/tours/${resolved.id}/${resolved.slug}`;
  const fetchPath = `/tours/${encodeURIComponent(resolved.id)}/${encodeURIComponent(resolved.slug)}`;
  const tour = await fetchTourForSeo(fetchPath);
  const jsonLd = tourJsonLdFor(canonicalPath, tour);

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const resolved = await params;
  const canonicalPath = `/tours/${resolved.id}/${resolved.slug}`;
  const fetchPath = `/tours/${encodeURIComponent(resolved.id)}/${encodeURIComponent(resolved.slug)}`;
  const tour = await fetchTourForSeo(fetchPath);
  return tourMetadataFrom("/tours/[id]/[slug]", canonicalPath, tour);
}
