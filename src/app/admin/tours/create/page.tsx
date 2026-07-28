"use client";

import TourWizard from "@/components/tours/TourWizard";
import ModuleWrapper from "@/components/common/ModuleWrapper";

export default function CreateTourPage() {
  return (
    <ModuleWrapper title="Create Tour" requiredPermission="tours.create">
      <TourWizard role="admin" />
    </ModuleWrapper>
  );
}
