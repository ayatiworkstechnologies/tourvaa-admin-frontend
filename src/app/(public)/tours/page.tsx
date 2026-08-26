import { Suspense } from "react";
import CountryTourListing from "@/components/public/CountryTourListing";
import { PublicTourGridSkeleton } from "@/components/public/PublicSkeletonLoader";

export default function ToursPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PublicTourGridSkeleton count={8} />
          </div>
        </main>
      }
    >
      <CountryTourListing />
    </Suspense>
  );
}
