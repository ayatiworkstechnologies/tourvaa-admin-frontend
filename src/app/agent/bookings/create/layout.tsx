import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/agent/bookings/create");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

