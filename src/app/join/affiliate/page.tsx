import { redirect } from "next/navigation";

export default function AffiliateJoinRedirect() {
  redirect("/affiliate-portal/login?tab=register&redirect=%2Faffiliate%2Fprofile");
}
