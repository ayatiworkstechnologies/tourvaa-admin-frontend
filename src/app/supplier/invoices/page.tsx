import { LuShieldCheck as ShieldCheck } from "react-icons/lu";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";

export default function SupplierInvoicesPage() {
  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Financial documents" description="Customer and agent invoices are private financial records." icon={ShieldCheck} eyebrow="Supplier Finance" />
      <div className="mt-6 rounded-2xl border border-dash-border bg-white p-8 text-center shadow-sm">
        <ShieldCheck size={38} className="mx-auto text-emerald-600" />
        <h2 className="mt-4 text-lg font-bold text-dash-text">Invoices are not available in the supplier portal</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-dash-muted">Supplier payout and booking information remain available in their respective sections. Customer and agent billing documents are intentionally private.</p>
      </div>
    </SupplierPageShell>
  );
}
