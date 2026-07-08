import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Join Tourvaa",
  description: "Join Tourvaa as a supplier, agent, or affiliate.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
