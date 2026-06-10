"use client";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import DynamicModulePage from "@/components/common/DynamicModulePage";

export default function PermissionsPage() {
  return (
    <ModuleWrapper title="Permissions">
      <DynamicModulePage
        title="Permissions"
        description="Create and manage module permissions."
        endpoint="/permissions/"
        fields={[
          { name: "name", label: "Permission Name" },
          { name: "slug", label: "Slug" },
          { name: "module", label: "Module" },
          {
            name: "action",
            label: "Action",
            type: "select",
            options: [
              { label: "GET / View", value: "get" },
              { label: "POST / Create", value: "post" },
              { label: "PUT / Update", value: "put" },
              { label: "DELETE / Remove", value: "delete" },
            ],
          },
          {
            name: "is_active",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ],
          },
        ]}
      />
    </ModuleWrapper>
  );
}
