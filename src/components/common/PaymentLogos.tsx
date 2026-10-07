import React from "react";
import Image from "next/image";

export function StripeWordmark({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brands/stripe-wordmark-blurple.svg"
      alt="Stripe"
      width={72}
      height={30}
      className={className}
    />
  );
}

export function StripeBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md bg-[#635BFF] px-2 py-1 text-white shadow-xs ${className}`}>
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409c0-.831.683-1.305 1.901-1.305c2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0C9.667 0 7.589.654 6.104 1.872C4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219c2.585.92 3.445 1.574 3.445 2.583c0 .98-.84 1.545-2.354 1.545c-1.875 0-4.965-.921-6.99-2.109l-.88 5.494c2.316 1.176 5.393 1.872 7.72 1.872c2.723 0 4.555-.654 5.867-1.801c1.373-1.185 2.115-3.03 2.115-5.268c0-4.04-2.466-5.759-6.477-7.219" />
      </svg>
      <span className="text-xs font-black tracking-tight leading-none">stripe</span>
    </div>
  );
}

export function PayPalLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Dual-P Monogram */}
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"
          fill="#003087"
        />
        <path
          d="M21.222 6.917a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825l-1.073 6.815h3.267c.524 0 .968-.382 1.05-.9l.983-6.228c.082-.518.526-.9 1.05-.9h1.876c4.298 0 7.664-1.747 8.647-6.797.237-1.218.17-2.227-.403-2.985z"
          fill="#0079C1"
        />
      </svg>
      {/* PayPal stylized text */}
      <span className="text-[17px] font-black italic tracking-tighter leading-none select-none">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#0079C1]">Pal</span>
      </span>
    </div>
  );
}

export function VisaBadge({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <path
        d="M14.5 16.5L16.4 7.5H18.8L16.9 16.5H14.5ZM13.3 7.5L11 13.8L10.7 12.4C10.2 10.7 8.7 8.9 7 8L8.8 16.5H11.3L15.6 7.5H13.3ZM24.8 16.5H27L25.3 7.5H23.5C23.1 7.5 22.7 7.8 22.5 8.2L19.2 16.5H21.7L22.2 15.1H25.3L25.6 16.5H24.8ZM22.7 13.2L24 9.4L24.8 13.2H22.7ZM22.4 10.4C22.4 9.2 21.4 8.7 20.3 8.2C19.6 7.8 19.2 7.5 19.2 7.1C19.2 6.7 19.6 6.3 20.5 6.3C21.3 6.3 22 6.5 22.6 6.8L23.1 5C22.4 4.7 21.5 4.5 20.4 4.5C18 4.5 16.6 5.8 16.6 7.7C16.6 9.1 17.6 9.9 18.6 10.4C19.3 10.8 19.7 11.2 19.7 11.6C19.7 12.2 19 12.7 18 12.7C17.1 12.7 16.3 12.4 15.6 12L15 13.9C15.8 14.3 16.9 14.5 18 14.5C20.7 14.5 22.4 13.2 22.4 10.4Z"
        fill="#1434CB"
      />
    </svg>
  );
}

export function MastercardBadge({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <circle cx="14" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="22" cy="12" r="6.5" fill="#F79E1B" fillOpacity="0.9" />
      <path
        d="M18 7.4A6.5 6.5 0 0 0 15.5 12 6.5 6.5 0 0 0 18 16.6 6.5 6.5 0 0 0 20.5 12 6.5 6.5 0 0 0 18 7.4Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function AmexBadge({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#006FCF" />
      <text
        x="50%"
        y="58%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="8"
        fontWeight="900"
        letterSpacing="0.5"
      >
        AMEX
      </text>
    </svg>
  );
}
