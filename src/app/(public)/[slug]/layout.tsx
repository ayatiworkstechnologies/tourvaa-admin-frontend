import type { Metadata } from "next";
import { cmsPageJsonLdFor, cmsPageMetadataFrom, fetchCmsPageForServer } from "@/lib/seo/cmsPageMetadata";

export default async function Layout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const resolved = await params;
  const canonicalPath = `/${resolved.slug}`;
  const page = await fetchCmsPageForServer(resolved.slug);
  const jsonLd = cmsPageJsonLdFor(canonicalPath, page);

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  );
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const canonicalPath = `/${params.slug}`;
  const page = await fetchCmsPageForServer(params.slug);
  return cmsPageMetadataFrom(canonicalPath, page);
}
