"use client";

import Link from "next/link";
import { LuArrowRight as ArrowRight, LuExternalLink as ExternalLink, LuGlobe as Globe } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import { ALL_TABS, CMS_DASHBOARD_GROUPS, TAB_DESCRIPTIONS } from "./cmsShared";

// The CMS landing page: a dashboard of the site grouped by real page/area
// (Home Page, Country Pages, Content & Pages, Header/Footer/Contact) rather
// than a flat A-Z list - each tile links straight into that section's own
// editor at /admin/cms/{key} (see [section]/page.tsx).
export default function CmsIndexPage() {
  const labelFor = (key: string) => ALL_TABS.find((t) => t.key === key)?.label ?? key;

  return (
    <ModuleWrapper title="CMS Management" requiredPermission={["website_cms.view", "settings.view"]}>
      <div className="space-y-5">
        <section className="rounded-xl border border-dash-border bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF5FF] text-[#0284C7]">
              <Globe size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-dash-text">Website CMS</h2>
              <p className="mt-1 text-sm text-dash-muted">Pick a page or area to update. Everything shown on the public site lives in one of these groups.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {CMS_DASHBOARD_GROUPS.map((group) => (
            <section key={group.key} className="flex flex-col rounded-xl border border-dash-border bg-white p-5">
              <h3 className="text-base font-bold text-dash-text">{group.label}</h3>
              <p className="mt-1 text-sm text-dash-muted">{group.description}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {group.tabs.map((key) => (
                  <Link
                    key={key}
                    href={`/admin/cms/${key}`}
                    className="group flex items-start justify-between gap-2 rounded-xl border border-dash-border px-3 py-2.5 text-left transition hover:border-[#9CCFF0] hover:bg-[#F7FBFF]"
                  >
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-dash-text">{labelFor(key)}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-dash-muted">{TAB_DESCRIPTIONS[key]}</span>
                    </div>
                    <ArrowRight size={14} className="mt-0.5 shrink-0 text-dash-subtle transition group-hover:translate-x-0.5 group-hover:text-[#0284C7]" />
                  </Link>
                ))}

                {group.external?.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-start justify-between gap-2 rounded-xl border border-dashed border-dash-border px-3 py-2.5 text-left transition hover:border-[#9CCFF0] hover:bg-[#F7FBFF]"
                  >
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-dash-text">{link.label}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-dash-muted">{link.description}</span>
                    </div>
                    <ExternalLink size={14} className="mt-0.5 shrink-0 text-dash-subtle transition group-hover:text-[#0284C7]" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </ModuleWrapper>
  );
}
