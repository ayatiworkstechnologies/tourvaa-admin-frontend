import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/admin/reports/create");

export default function CreateReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
