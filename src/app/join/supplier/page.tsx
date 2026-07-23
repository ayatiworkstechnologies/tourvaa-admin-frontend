import { redirect } from "next/navigation";

export default function SupplierJoinRedirect() {
  redirect("/register?type=supplier&redirect=%2Fsupplier%2Fprofile");
}
