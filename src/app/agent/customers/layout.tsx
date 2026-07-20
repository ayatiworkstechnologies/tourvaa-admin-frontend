import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/agent/customers");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

