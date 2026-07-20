import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/agent/dashboard");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

