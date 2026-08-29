import type { IconType as LucideIcon } from "react-icons";
import {
  LuActivity as Activity,
  LuBadgeCheck as BadgeCheck,
  LuBanknote as Banknote,
  LuBell as Bell,
  LuBot as Bot,
  LuBriefcase as Briefcase,
  LuBuilding2 as Building2,
  LuCalendarCheck as CalendarCheck,
  LuChartColumn as ChartColumn,
  LuCircleDollarSign as CircleDollarSign,
  LuCoins as Coins,
  LuCreditCard as CreditCard,
  LuGlobe as Globe,
  LuGrid2X2 as Grid2X2,
  LuHandCoins as HandCoins,
  LuKeyRound as KeyRound,
  LuLayers as Layers,
  LuLink2 as Link2,
  LuMail as Mail,
  LuMapPinned as MapPinned,
  LuMessageSquare as MessageSquare,
  LuMonitorSmartphone as MonitorSmartphone,
  LuPercent as Percent,
  LuReceiptText as ReceiptText,
  LuRotateCcw as RotateCcw,
  LuSettings as Settings,
  LuShare2 as Share2,
  LuShield as Shield,
  LuSlidersHorizontal as SlidersHorizontal,
  LuStar as Star,
  LuUserCheck as UserCheck,
  LuUserRound as UserRound,
  LuUsers as Users,
  LuWallet as Wallet,
} from "react-icons/lu";
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
  { label: "Customers", module: "customers", href: "/admin/customers", icon: UserCheck, permissions: ["customers.view", "view-customers"], section: "Business" },
  { label: "Suppliers", module: "suppliers", href: "/admin/suppliers", icon: Building2, permissions: ["suppliers.view", "view-suppliers"], section: "Business" },
  { label: "Agents", module: "agents", href: "/admin/agents", icon: Briefcase, permissions: ["agents.view", "view-agents"], section: "Business" },
  { label: "Affiliates", module: "affiliates", href: "/admin/affiliates", icon: Share2, permissions: ["affiliates.view", "view-affiliates"], section: "Business" },
  { label: "Affiliate Links", module: "affiliate_links", href: "/admin/affiliates/links", icon: Link2, permissions: ["affiliate_links.view"], section: "Business" },
  { label: "Commission Rules", module: "affiliate_commission_rules", href: "/admin/affiliates/commission-rules", icon: SlidersHorizontal, permissions: ["affiliate_commission_rules.view"], section: "Business" },
  { label: "Default Commissions", module: "default_commissions", href: "/admin/settings/default-commissions", icon: Coins, permissions: ["settings.view", "view-settings"], section: "Business" },
  { label: "Affiliate Payouts", module: "affiliate_payouts", href: "/admin/affiliates/payouts", icon: Wallet, permissions: ["affiliate_payouts.approve", "affiliate_payouts.view"], section: "Business" },
  { label: "Countries", module: "countries", href: "/admin/settings/countries", icon: Globe, permissions: ["countries.view", "view-countries", "cities.view", "view-cities"], section: "Tour Management" },
  { label: "Tours", module: "tours", href: "/admin/tours", icon: MapPinned, permissions: ["tours.view", "view-tours"], section: "Tour Management" },
  { label: "Tour Approval", module: "tour_approval", href: "/admin/tour-approval", icon: BadgeCheck, permissions: ["tours.publish", "update-tours"], section: "Tour Management" },
  { label: "Tour Categories", module: "categories", href: "/admin/tours/categories", icon: Layers, permissions: ["categories.view", "view-categories", "subcategories.view", "view-subcategories"], section: "Tour Management", matchHrefs: ["/admin/tours/subcategories"] },
  { label: "Discounts", module: "discounts", href: "/admin/discounts", icon: Percent, permissions: ["tours.view", "view-tours"], section: "Tour Management" },
  { label: "Reviews", module: "reviews", href: "/admin/reviews", icon: Star, permissions: ["tours.view", "view-tours"], section: "Tour Management" },
  { label: "Bookings", module: "bookings", href: "/admin/bookings", icon: CalendarCheck, permissions: ["bookings.view", "view-bookings"], section: "Finance" },
  { label: "Cancellations & Refunds", module: "cancellations", href: "/admin/refunds", icon: RotateCcw, permissions: ["bookings.view", "view-bookings", "bookings.cancel"], section: "Finance" },
  { label: "Payments", module: "payments", href: "/admin/payments", icon: CreditCard, permissions: ["payments.view", "view-payments"], section: "Finance" },
  { label: "Invoices", module: "invoices", href: "/admin/invoices", icon: ReceiptText, permissions: ["invoices.view", "view-invoices"], section: "Finance" },
  { label: "Supplier Payouts", module: "supplier_ledger", href: "/admin/supplier-payouts", icon: HandCoins, permissions: ["supplier_ledger.view", "view-supplier_ledger"], section: "Finance" },
  { label: "Agent Payouts", module: "agent_ledger", href: "/admin/agent-payouts", icon: CircleDollarSign, permissions: ["agent_ledger.view", "view-agent_ledger"], section: "Finance" },
  { label: "Reports", module: "reports", href: "/admin/reports", icon: ChartColumn, permissions: ["reports.view", "view-reports"], section: "Finance" },
  { label: "Website CMS", module: "website_cms", href: "/admin/cms", icon: Globe, permissions: ["website_cms.view", "view-website_cms", "settings.view", "view-settings"], section: "System" },
  { label: "Chatbot", module: "chatbot", href: "/admin/chatbot", icon: Bot, permissions: ["chatbot.view", "view-chatbot"], section: "System" },
  { label: "Email Templates", module: "email", href: "/admin/email-templates", icon: Mail, permissions: ["email_templates.view", "email.view", "view-email"], section: "System" },
  { label: "Settings", module: "settings", href: "/admin/settings", icon: Settings, permissions: ["settings.view", "view-settings"], placement: "bottom" },
  { label: "Activity Logs", module: "activity_logs", href: "/admin/activity-logs", icon: Activity, permissions: ["activity_logs.view", "activity-logs.view", "view-activity_logs", "view-activity-logs"], section: "System" },
  { label: "Sessions", module: "sessions", href: "/admin/sessions", icon: MonitorSmartphone, permissions: ["sessions.view", "view-sessions"], section: "System" },
  { label: "Notifications", module: "notifications", href: "/admin/notifications", icon: Bell, permissions: ["notifications.view", "view-notifications"], section: "System" },
  { label: "Messages", module: "messages", href: "/admin/messages", icon: MessageSquare, permissions: ["messages.view"], section: "System" },
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



