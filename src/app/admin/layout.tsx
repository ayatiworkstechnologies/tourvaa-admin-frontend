import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tourvaa Admin Console",
  description: "Role based Tourvaa operations console.",
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <div data-route-scope="admin">{children}</div>;
}
