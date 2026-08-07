import Link from "next/link";

export default function PortalPublicFooter() {
  return (
    <footer className="border-t border-slate-100 bg-slate-950 text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} Tourvaa Private Limited. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-semibold">
          <Link href="/terms" className="hover:text-white">Terms &amp; Conditions</Link>
          <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/" className="hover:text-white">Back to Tourvaa</Link>
        </div>
      </div>
    </footer>
  );
}
