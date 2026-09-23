import { redirect } from "next/navigation";

// The supplier default commission (supplier_commission_percentage) has one
// home: Settings -> Pricing & Commission. This old page used to edit the same
// value a second time; it now only forwards old links and bookmarks there.
export default function DefaultCommissionsPage() {
  redirect("/admin/settings#pricing");
}
