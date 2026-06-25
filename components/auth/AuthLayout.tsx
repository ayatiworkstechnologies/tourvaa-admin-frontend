import { BadgeCheck, MapPinned, ShieldCheck, UsersRound } from "lucide-react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  badge = "Role based access",
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF4F8] px-4 py-8">
      <div className="grid min-h-[680px] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#071521] px-10 py-10 text-white lg:flex">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85')",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,18,34,0.92)_0%,rgba(2,80,112,0.62)_52%,rgba(14,165,233,0.18)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(3,7,18,0.92),rgba(3,7,18,0))]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-lg backdrop-blur">
              <MapPinned size={14} />
              Tourvaa Console
            </div>
            <h1 className="mt-8 max-w-lg text-5xl font-bold leading-tight">
              Manage travel access with clarity and control.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/78">
              Role-based dashboards, approvals, and admin tools stay organized
              from the first login.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="max-w-sm rounded-2xl border border-white/20 bg-white/15 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
                    Today
                  </p>
                  <p className="mt-1 text-2xl font-bold">Role access active</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#43A9F6]">
                  <ShieldCheck size={24} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  ["Users", UsersRound],
                  ["Roles", BadgeCheck],
                  ["Secure", ShieldCheck],
                ].map(([item, Icon]) => (
                  <div key={item as string} className="rounded-xl bg-white/12 py-3">
                    <Icon size={16} className="mx-auto mb-1" />
                    <span className="font-bold">{item as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center bg-[radial-gradient(circle_at_top_right,#E7F5FF_0%,transparent_34%),#FFFFFF] px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-[#43A9F6] ring-1 ring-sky-100">
                <ShieldCheck size={13} />
                {badge}
              </p>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
