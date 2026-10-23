import Link from "next/link";

export default function PartnerPolicyFooter({ portal }: { portal: "agent" | "supplier" }) {
  const base = portal === "agent" ? "/partner" : "/supplier";
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-dash-border bg-white px-5 py-4 text-xs text-dash-muted">
      <Link className="hover:text-dash-brand hover:underline" href={`${base}-terms`} target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</Link>
      <Link className="hover:text-dash-brand hover:underline" href={`${base}-privacy`} target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
    </footer>
  );
}
