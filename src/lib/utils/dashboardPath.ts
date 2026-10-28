/** Returns the post-login dashboard URL for a given role slug. */
export function getDashboardPath(roleSlug: string): string {
  const slug = roleSlug.trim().toLowerCase();
  if (slug === "customer") return "/customer/dashboard";
  if (slug === "agent-reseller") return "/agent/dashboard";
  if (slug === "supplier") return "/supplier/dashboard";
  if (slug === "affiliate") return "/affiliate/dashboard";
  // Custom roles are created only in the back-office role manager. Their
  // assigned permissions filter the Admin UI and API access.
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? "/admin/dashboard" : "/login";
}
