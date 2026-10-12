/** Returns the post-login dashboard URL for a given role slug. */
export function getDashboardPath(roleSlug: string): string {
  const slug = roleSlug.trim().toLowerCase();
  if (slug === "customer") return "/customer/dashboard";
  if (slug === "agent-reseller") return "/agent/dashboard";
  if (slug === "supplier") return "/supplier/dashboard";
  if (slug === "affiliate") return "/affiliate/dashboard";
  if (slug === "super-admin" || slug === "admin" || slug === "sub-admin") return "/admin/dashboard";
  // Custom roles are non-admin by default. The backend only accepts safe role
  // slugs, and this guard keeps an absent/malformed role on the public login
  // instead of routing it to privileged Admin UI.
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? `/${slug}/dashboard` : "/login";
}
