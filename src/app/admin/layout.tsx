import type { Metadata } from "next";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import PortalDataRefresh from "@/components/common/PortalDataRefresh";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/admin");

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteGuard><PortalDataRefresh /><div data-route-scope="admin">{children}</div></AdminRouteGuard>;
}
