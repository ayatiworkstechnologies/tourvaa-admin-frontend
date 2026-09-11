"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.01, rootMargin: "250px" },
    );
    observer.observe(node);

    const timer = setTimeout(() => {
      node.classList.add("is-visible");
    }, 800);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);
  return (
    <div ref={ref} className={`reveal-block ${className}`}>
      {children}
    </div>
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
