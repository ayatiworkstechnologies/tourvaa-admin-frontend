import { LuMessageSquare as MessageSquare } from "react-icons/lu";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";
import PortalMessageThread from "@/components/messaging/PortalMessageThread";

export default function SupplierMessagesPage() {
  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Messages" description="Contact Tourvaa for booking matters or operational support. Tourvaa manages all customer and agent communication." icon={MessageSquare} />

      <div className="mt-4">
        <PortalMessageThread portal="supplier" />
      </div>
    </SupplierPageShell>
  );
}
