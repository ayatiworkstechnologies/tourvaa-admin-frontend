import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/travel-advice");

export default function TravelAdviceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
