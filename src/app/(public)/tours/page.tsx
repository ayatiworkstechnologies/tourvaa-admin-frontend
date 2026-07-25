"use client";

import { Suspense } from "react";
import CountryTourListing from "@/components/public/CountryTourListing";

export default function ToursPage() {
  return (
    <Suspense fallback={null}>
      <CountryTourListing />
    </Suspense>
  );
}
