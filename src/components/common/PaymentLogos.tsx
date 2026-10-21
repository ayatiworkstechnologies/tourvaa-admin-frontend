import Image from "next/image";

type BrandImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Payment marks are stored in /public/brands/payments so checkout does not
 * render lookalike JSX artwork or depend on a third-party CDN at runtime. */
function BrandImage({ src, alt, className = "" }: BrandImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={28}
      className={className}
    />
  );
}

export function StripeWordmark({ className = "h-5 w-auto" }: { className?: string }) {
  return <BrandImage src="/brands/stripe-wordmark-blurple.svg" alt="Stripe" className={className} />;
}

export function StripeBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md bg-white px-2 py-1 shadow-xs ${className}`}>
      <StripeWordmark className="h-3.5 w-auto" />
    </span>
  );
}

export function PayPalLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return <BrandImage src="/brands/payments/paypal-wordmark.svg" alt="PayPal" className={className} />;
}

function CardBadge({ src, alt, className = "h-4 w-auto" }: BrandImageProps) {
  return (
    <span className="inline-flex h-6 min-w-9 items-center justify-center rounded border border-slate-200 bg-white px-1">
      <BrandImage src={src} alt={alt} className={className} />
    </span>
  );
}

export function VisaBadge({ className = "h-4 w-auto" }: { className?: string }) {
  return <CardBadge src="/brands/payments/visa.svg" alt="Visa" className={className} />;
}

export function MastercardBadge({ className = "h-4 w-auto" }: { className?: string }) {
  return <CardBadge src="/brands/payments/mastercard.svg" alt="Mastercard" className={className} />;
}

export function AmexBadge({ className = "h-4 w-auto" }: { className?: string }) {
  return <CardBadge src="/brands/payments/american-express.svg" alt="American Express" className={className} />;
}

/** Use the same locally stored card-network marks in every Stripe checkout. */
export function CardNetworkBadges({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label="Cards accepted through Stripe">
      <VisaBadge className="h-3.5 w-auto" />
      <MastercardBadge className="h-3.5 w-auto" />
      <AmexBadge className="h-3.5 w-auto" />
    </span>
  );
}
