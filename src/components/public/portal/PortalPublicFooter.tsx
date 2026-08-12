import PublicFooter from "@/components/public/PublicFooter";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";

/**
 * Public partner routes use the same footer as the main marketing site.
 * The providers live here because agent/supplier landing layouts do not use
 * PublicLayout, while PublicFooter's currency and settings controls need them.
 */
export default function PortalPublicFooter() {
  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <PublicFooter />
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}
