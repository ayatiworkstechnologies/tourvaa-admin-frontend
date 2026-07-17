import type { Metadata } from "next";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";

export const metadata: Metadata = {
  title: "Tourvaa Admin Console",
  description: "Role based Tourvaa operations console.",
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteGuard><div data-route-scope="admin">{children}</div></AdminRouteGuard>;
}
