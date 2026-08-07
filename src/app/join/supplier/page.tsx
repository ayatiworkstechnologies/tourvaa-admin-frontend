import { redirect } from "next/navigation";

export default function SupplierJoinRedirect() {
  redirect("/supplier-portal/login?tab=register&redirect=%2Fsupplier%2Fprofile");
}
