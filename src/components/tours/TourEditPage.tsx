"use client";

import TourWizard from "@/components/tours/TourWizard";

export default function TourEditPage({ tourId }: { tourId: string }) {
  return <TourWizard tourId={tourId} role="admin" />;
}
