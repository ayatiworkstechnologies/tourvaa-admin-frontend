import AnnouncementBar from "@/components/public/AnnouncementBar";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";
import DynamicFavicon from "@/components/public/DynamicFavicon";
import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";
import ChatWidget from "@/components/public/ChatWidget";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import NetworkStatusBanner from "@/components/public/NetworkStatusBanner";

// Headings retain the brand font (Onest), while body paragraphs and long-form
// reading text use Inter for maximum clarity and effortless legibility across all ages.
const fontVars = {
  "--font-heading": "var(--font-onest)",
  "--font-body": "var(--font-inter, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
} as React.CSSProperties;

export default function PublicLayout({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <div
          style={fontVars}
          className="public-site min-h-screen font-[family-name:var(--font-body)] text-black antialiased overflow-x-clip min-w-0 max-w-full"
        >
          <DynamicFavicon />
          <div className="print:hidden"><AnnouncementBar /></div>
          <PublicHeader />
          <div id="main-content" tabIndex={-1} className="public-page-enter">{children}</div>
          {showFooter && <div className="print:hidden"><PublicFooter /></div>}
          <div className="print:hidden"><ChatWidget /></div>
          <div className="print:hidden"><CookieConsentBanner /></div>
          <div className="print:hidden"><NetworkStatusBanner /></div>
        </div>
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}
