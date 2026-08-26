import AnnouncementBar from "@/components/public/AnnouncementBar";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";
import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";
import ChatWidget from "@/components/public/ChatWidget";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import NetworkStatusBanner from "@/components/public/NetworkStatusBanner";

// The public site used to load its own Outfit/Work_Sans fonts, scoped here
// via --font-heading/--font-body. The whole app now shares one variable
// font (Onest, loaded once in app/layout.tsx as --font-onest) - these two
// vars just alias to it so the existing `font-heading` class and
// font-[family-name:var(--font-body)] usages across public pages keep
// working unchanged.
const fontVars = {
  "--font-heading": "var(--font-onest)",
  "--font-body": "var(--font-onest)",
} as React.CSSProperties;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <div
          style={fontVars}
          className="public-site min-h-screen bg-white font-[family-name:var(--font-body)] text-slate-950"
        >
          <div className="print:hidden"><AnnouncementBar /></div>
          <div className="print:hidden"><PublicHeader /></div>
          <div className="public-page-enter">{children}</div>
          <div className="print:hidden"><PublicFooter /></div>
          <div className="print:hidden"><ChatWidget /></div>
          <div className="print:hidden"><CookieConsentBanner /></div>
          <div className="print:hidden"><NetworkStatusBanner /></div>
        </div>
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}
