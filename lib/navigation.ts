import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarCheck,
  CreditCard,
  FileText,
  Grid2X2,
  KeyRound,
  Mail,
  MapPinned,
  ReceiptText,
  Settings,
  Shield,
  Tags,
  UserRound,
  Users,
  UsersRound,
  Warehouse,
} from "lucide-react";
import { MenuItem } from "@/types/auth";

export type NavItem = {
  label: string;
  module: string;
  href: string;
  icon: LucideIcon;
  permissions: string[];
};

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", module: "dashboard", href: "/admin/dashboard", icon: Grid2X2, permissions: ["dashboard.view", "view-dashboard"] },
  { label: "Users", module: "users", href: "/admin/users", icon: Users, permissions: ["users.view", "view-users"] },
  { label: "Roles", module: "roles", href: "/admin/roles", icon: Shield, permissions: ["roles.view", "view-roles"] },
  { label: "Permissions", module: "permissions", href: "/admin/permissions", icon: KeyRound, permissions: ["permissions.view", "view-permissions"] },
  { label: "Customers", module: "customers", href: "/admin/customers", icon: UsersRound, permissions: ["customers.view", "view-customers"] },
  { label: "Suppliers", module: "suppliers", href: "/admin/suppliers", icon: Warehouse, permissions: ["suppliers.view", "view-suppliers"] },
  { label: "Agents", module: "agents", href: "/admin/agents", icon: UsersRound, permissions: ["agents.view", "view-agents"] },
  { label: "Affiliates", module: "affiliates", href: "/admin/affiliates", icon: UsersRound, permissions: ["affiliates.view", "view-affiliates"] },
  { label: "Countries", module: "countries", href: "/admin/settings/countries", icon: FileText, permissions: ["countries.view", "view-countries"] },
  { label: "Cities", module: "cities", href: "/admin/settings/cities", icon: FileText, permissions: ["cities.view", "view-cities"] },
  { label: "Tours", module: "tours", href: "/admin/tours", icon: MapPinned, permissions: ["tours.view", "view-tours"] },
  { label: "Tour Categories", module: "categories", href: "/admin/tours/categories", icon: Tags, permissions: ["categories.view", "view-categories"] },
  { label: "Tour Subcategories", module: "subcategories", href: "/admin/tours/subcategories", icon: Tags, permissions: ["subcategories.view", "view-subcategories"] },
  { label: "Bookings", module: "bookings", href: "/admin/bookings", icon: CalendarCheck, permissions: ["bookings.view", "view-bookings"] },
  { label: "Payments", module: "payments", href: "/admin/payments", icon: CreditCard, permissions: ["payments.view", "view-payments"] },
  { label: "Invoices", module: "invoices", href: "/admin/invoices", icon: ReceiptText, permissions: ["invoices.view", "view-invoices"] },
  { label: "Reports", module: "reports", href: "/admin/reports", icon: FileText, permissions: ["reports.view", "view-reports"] },
  { label: "Email Templates", module: "email", href: "/admin/email-templates", icon: Mail, permissions: ["email_templates.view", "email.view", "view-email"] },
  { label: "Settings", module: "settings", href: "/admin/settings", icon: Settings, permissions: ["settings.view", "view-settings"] },
  { label: "Activity Logs", module: "activity_logs", href: "/admin/activity-logs", icon: FileText, permissions: ["activity_logs.view", "activity-logs.view", "view-activity_logs", "view-activity-logs"] },
  { label: "Sessions", module: "sessions", href: "/admin/sessions", icon: Users, permissions: ["sessions.view", "view-sessions"] },
  { label: "Notifications", module: "notifications", href: "/admin/notifications", icon: Bell, permissions: ["notifications.view", "view-notifications"] },
  { label: "Profile", module: "profile", href: "/admin/profile", icon: UserRound, permissions: ["profile.view", "view-profile"] },
];

const navByModule = new Map(adminNavItems.map((item) => [item.module, item]));
const navByPermission = new Map(adminNavItems.flatMap((item) => item.permissions.map((permission) => [permission, item] as const)));

export function getNavItemForMenu(menu: MenuItem) {
  return navByModule.get(menu.module) || navByPermission.get(menu.permission);
}

export function getMenuHref(menu: MenuItem) {
  return getNavItemForMenu(menu)?.href || "/admin/dashboard";
}

export function menuMatchesNavItem(menu: MenuItem, item: NavItem) {
  return menu.module === item.module || item.permissions.includes(menu.permission);
}

