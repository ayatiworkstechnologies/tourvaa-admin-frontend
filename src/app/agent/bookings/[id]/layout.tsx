import type { Metadata } from "next";
import { metadataFor } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  return metadataFor("/agent/bookings/[id]", `/agent/bookings/${params.id}`);
}

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

