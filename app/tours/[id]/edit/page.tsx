"use client";

import { useParams } from "next/navigation";
import TourFormPage from "@/components/cms/TourFormPage";

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  return <TourFormPage tourId={params.id} />;
}
