/** Returns the post-login dashboard URL for a given role slug. */
export function getDashboardPath(roleSlug: string): string {
  const slug = roleSlug.toLowerCase();
  if (slug === "customer") return "/customer/dashboard";
  if (slug === "agent-reseller") return "/agent/dashboard";
  if (slug === "supplier") return "/supplier/dashboard";
  if (slug === "affiliate") return "/affiliate/dashboard";
  return "/admin/dashboard";
}
