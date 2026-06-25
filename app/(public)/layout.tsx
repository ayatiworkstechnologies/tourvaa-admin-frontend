import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Tourvaa | Travel Experiences",
  description: "Discover curated tours and access the Tourvaa travel console.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
