import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-5 md:px-8">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A0F1E] text-xs font-black text-sky-400 transition-all group-hover:bg-sky-500 group-hover:text-white">
              T
            </span>
            <span className="text-sm font-black tracking-tight text-[#0F172A]">Tourvaa</span>
          </Link>

          {/* Copyright */}
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Tourvaa NZ LLC. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            {[
              { href: "/terms", label: "Terms" },
              { href: "/cancellation-policy", label: "Cancellation Policy" },
              { href: "/cookie-policy", label: "Cookie Policy" },
              { href: "/login", label: "Login" },
              { href: "/admin/login", label: "Admin" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-slate-400 transition-colors hover:text-sky-600">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
