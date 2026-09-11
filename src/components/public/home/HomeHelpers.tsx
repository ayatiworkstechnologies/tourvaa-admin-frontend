"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

export type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale-up"
  | "fade";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function Reveal({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
  duration,
  threshold = 0.08,
  rootMargin = "0px 0px -40px 0px",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    // Check if element is already within viewport on initial render
    const rect = node.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < windowHeight * 0.92 && rect.bottom > 0) {
      const initialTimer = setTimeout(
        () => {
          node.classList.add("is-visible");
        },
        delay > 0 ? delay : 40,
      );
      return () => clearTimeout(initialTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            if (once) {
              observer.unobserve(node);
            }
          } else if (!once) {
            node.classList.remove("is-visible");
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [delay, threshold, rootMargin, once]);

  const variantClass = `reveal-${variant}`;
  const customStyles: React.CSSProperties & Record<string, string> = {};
  if (delay) customStyles["--reveal-delay"] = `${delay}ms`;
  if (duration) customStyles["--reveal-duration"] = `${duration}ms`;

  return (
    <div
      ref={ref}
      style={customStyles}
      className={`reveal-block ${variantClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function RevealStagger({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
  duration,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
}) {
  return (
    <Reveal
      className={`reveal-stagger ${className}`}
      variant={variant}
      delay={delay}
      duration={duration}
    >
      {children}
    </Reveal>
  );
}

export function TourCardSkeleton() {
  return (
    <div className="w-[285px] sm:w-[305px] lg:w-[315px] shrink-0 animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5">
      <div className="h-44 sm:h-48 rounded-xl bg-slate-100" />
      <div className="pt-3">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="mt-4 h-8 w-2/3 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

export function EmptyCollection({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <p className="text-sm font-semibold text-slate-600">{message}</p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#E4572E] transition hover:text-pub-secondary"
      >
        <span>{linkLabel}</span>
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}
