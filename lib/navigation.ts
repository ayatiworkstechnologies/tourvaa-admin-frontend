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
  Percent,
  Banknote,
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
  section?: string;
  placement?: "main" | "bottom";
  matchHrefs?: string[];
};

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", module: "dashboard", href: "/admin/dashboard", icon: Grid2X2, permissions: ["dashboard.view", "view-dashboard"] },
  { label: "Users", module: "users", href: "/admin/users", icon: Users, permissions: ["users.view", "view-users"], section: "User Management" },
  { label: "Roles", module: "roles", href: "/admin/roles", icon: Shield, permissions: ["roles.view", "view-roles"], section: "User Management" },
  { label: "Permissions", module: "permissions", href: "/admin/permissions", icon: KeyRound, permissions: ["permissions.view", "view-permissions"], section: "User Management" },
  { label: "Customers", module: "customers", href: "/admin/customers", icon: UsersRound, permissions: ["customers.view", "view-customers"], section: "Business" },
  { label: "Suppliers", module: "suppliers", href: "/admin/suppliers", icon: Warehouse, permissions: ["suppliers.view", "view-suppliers"], section: "Business" },
  { label: "Agents", module: "agents", href: "/admin/agents", icon: UsersRound, permissions: ["agents.view", "view-agents"], section: "Business" },
  { label: "Affiliates", module: "affiliates", href: "/admin/affiliates", icon: UsersRound, permissions: ["affiliates.view", "view-affiliates"], section: "Business" },
  { label: "Countries", module: "countries", href: "/admin/settings/countries", icon: FileText, permissions: ["countries.view", "view-countries", "cities.view", "view-cities"], section: "Tour Management" },
  { label: "Tours", module: "tours", href: "/admin/tours", icon: MapPinned, permissions: ["tours.view", "view-tours"], section: "Tour Management" },
  { label: "Tour Categories", module: "categories", href: "/admin/tours/categories", icon: Tags, permissions: ["categories.view", "view-categories", "subcategories.view", "view-subcategories"], section: "Tour Management", matchHrefs: ["/admin/tours/subcategories"] },
  { label: "Discounts", module: "discounts", href: "/admin/discounts", icon: Percent, permissions: ["tours.view", "view-tours"], section: "Tour Management" },
  { label: "Bookings", module: "bookings", href: "/admin/bookings", icon: CalendarCheck, permissions: ["bookings.view", "view-bookings"], section: "Finance" },
  { label: "Payments", module: "payments", href: "/admin/payments", icon: CreditCard, permissions: ["payments.view", "view-payments"], section: "Finance" },
  { label: "Invoices", module: "invoices", href: "/admin/invoices", icon: ReceiptText, permissions: ["invoices.view", "view-invoices"], section: "Finance" },
  { label: "Supplier Payouts", module: "supplier_ledger", href: "/admin/supplier-payouts", icon: Banknote, permissions: ["supplier_ledger.view", "view-supplier_ledger"], section: "Finance" },
  { label: "Reports", module: "reports", href: "/admin/reports", icon: FileText, permissions: ["reports.view", "view-reports"], section: "Finance" },
  { label: "Email Templates", module: "email", href: "/admin/email-templates", icon: Mail, permissions: ["email_templates.view", "email.view", "view-email"], section: "System" },
  { label: "Settings", module: "settings", href: "/admin/settings", icon: Settings, permissions: ["settings.view", "view-settings"], placement: "bottom" },
  { label: "Activity Logs", module: "activity_logs", href: "/admin/activity-logs", icon: FileText, permissions: ["activity_logs.view", "activity-logs.view", "view-activity_logs", "view-activity-logs"], section: "System" },
  { label: "Sessions", module: "sessions", href: "/admin/sessions", icon: Users, permissions: ["sessions.view", "view-sessions"], section: "System" },
  { label: "Notifications", module: "notifications", href: "/admin/notifications", icon: Bell, permissions: ["notifications.view", "view-notifications"], section: "System" },
  { label: "Profile", module: "profile", href: "/admin/profile", icon: UserRound, permissions: ["profile.view", "view-profile"], placement: "bottom" },
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



