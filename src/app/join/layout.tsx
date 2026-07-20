import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Partner with Tourvaa",
  description: "Join Tourvaa as a tour supplier, travel agent, or affiliate partner.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
