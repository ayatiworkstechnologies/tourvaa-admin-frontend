import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/affiliate/conversions");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

