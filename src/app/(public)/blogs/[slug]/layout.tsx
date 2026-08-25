import type { Metadata } from "next";
import { blogMetadataFor } from "@/lib/seo/blogMetadata";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  return blogMetadataFor(`/blogs/${params.slug}`, params.slug);
}

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

