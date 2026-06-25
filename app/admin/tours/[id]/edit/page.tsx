"use client";

import { useParams } from "next/navigation";
import TourEditPage from "@/components/tours/TourEditPage";

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  return <TourEditPage tourId={params.id} />;
}
