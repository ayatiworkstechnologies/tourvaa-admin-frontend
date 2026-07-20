import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/join/affiliate");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

