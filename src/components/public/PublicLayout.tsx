import { Outfit, Work_Sans } from "next/font/google";
import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";
// import ChatWidget from "@/components/public/ChatWidget"; // Hidden for now — uncomment to re-enable

// Scoped to the public marketing site only — the dashboard portals keep
// their existing font. --font-heading/--font-body are consumed via
// arbitrary-value Tailwind utilities (font-[family-name:var(--font-*)]).
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800", "900"],
});
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${outfit.variable} ${workSans.variable} min-h-screen bg-dash-bg font-[family-name:var(--font-body)]`}>
      <PublicHeader />
      {children}
      <PublicFooter />
      {/* <ChatWidget /> */}
    </div>
  );
}