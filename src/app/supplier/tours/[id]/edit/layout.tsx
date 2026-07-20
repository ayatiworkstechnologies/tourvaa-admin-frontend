import type { Metadata } from "next";
import { metadataFor } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  return metadataFor("/supplier/tours/[id]/edit", `/supplier/tours/${params.id}/edit`);
}

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

