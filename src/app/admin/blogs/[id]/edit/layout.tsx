import type { Metadata } from "next";
import { metadataFor } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  return metadataFor("/admin/blogs/[id]/edit", `/admin/blogs/${params.id}/edit`);
}

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}