"use client";

import {
  LuArrowLeft as ArrowLeft,
  LuFileText as FileText,
  LuGlobe as Globe,
  LuHouse as House,
  LuLayoutPanelTop as LayoutPanelTop,
  LuMapPinned as MapPinned,
} from "react-icons/lu";
import Sidebar, { SidebarNavItem } from "@/components/layout/Sidebar";
import { ALL_TABS, CMS_DASHBOARD_GROUPS } from "@/app/admin/cms/cmsShared";

type CmsSidebarProps = {
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

// One icon per dashboard group (see CMS_DASHBOARD_GROUPS) - every tab inside
// a group shares its group's icon, since individual sections don't have
// their own icon assigned in cmsShared.
const GROUP_ICONS: Record<string, React.ElementType> = {
  home: House,
  destinations: MapPinned,
  content: FileText,
  site: LayoutPanelTop,
};

// A separate, dedicated sidebar shown only while inside /admin/cms/* (see
// AdminLayout, which swaps AdminSidebar for this based on pathname) - lets
// CMS editing feel like its own area with the ~20 sections grouped by real
// site page, instead of leaving the main admin's business-module sidebar
// in place while editing website content.
export default function CmsSidebar(props: CmsSidebarProps) {
  const navItems: SidebarNavItem[] = [
    { label: "Back to Admin", href: "/admin/dashboard", icon: ArrowLeft, module: "cms-back" },
    ...CMS_DASHBOARD_GROUPS.flatMap((group) => {
      const icon = GROUP_ICONS[group.key] ?? Globe;
      return [
        ...group.tabs.map((key) => ({
          label: ALL_TABS.find((t) => t.key === key)?.label ?? key,
          href: `/admin/cms/${key}`,
          icon,
          section: group.label,
          module: `cms-${key}`,
        })),
        ...(group.external ?? []).map((link) => ({
          label: link.label,
          href: link.href,
          icon,
          section: group.label,
          module: `cms-external-${link.href}`,
        })),
      ];
    }),
  ];

  return (
    <Sidebar
      navItems={navItems}
      title="Website CMS"
      subtitle="Content Editor"
      logoIcon={Globe}
      theme="admin"
      {...props}
    />
  );
}
