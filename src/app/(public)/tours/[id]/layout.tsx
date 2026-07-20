import type { Metadata } from "next";
import { metadataFor } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  return metadataFor("/tours/[id]", `/tours/${params.id}`);
}

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

