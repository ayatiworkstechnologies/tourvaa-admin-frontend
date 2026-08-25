import type { Metadata } from "next";
import { blogJsonLdFor, blogMetadataFrom, fetchBlogForServer } from "@/lib/seo/blogMetadata";

export default async function Layout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const resolved = await params;
  const canonicalPath = `/blogs/${resolved.slug}`;
  const blog = await fetchBlogForServer(resolved.slug);
  const jsonLd = blogJsonLdFor(canonicalPath, blog);

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
  const canonicalPath = `/blogs/${params.slug}`;
  const blog = await fetchBlogForServer(params.slug);
  return blogMetadataFrom(canonicalPath, blog);
}
