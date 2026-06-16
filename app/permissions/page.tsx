"use client";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import DynamicModulePage from "@/components/common/DynamicModulePage";
import Loader from "@/components/ui/Loader";
import { useAdminModules } from "@/hooks/useAdminModules";

export default function PermissionsPage() {
  const { modules, loading } = useAdminModules();

  if (loading) {
    return <Loader label="Loading permission modules..." fullScreen />;
  }

  return (
    <ModuleWrapper title="Permissions" requiredPermission="permissions.view">
      <DynamicModulePage
        title="Permissions"
        description="Create and manage module permissions."
        endpoint="/permissions/"
        fields={[
          { name: "name", label: "Permission Name" },
          { name: "slug", label: "Slug" },
          {
            name: "module",
            label: "Module",
            type: "select",
            options: modules.map((module) => ({
              label: module.name,
              value: module.slug,
            })),
          },
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
              { label: "Active", value: true },
              { label: "Inactive", value: false },
            ],
            valueType: "boolean",
          },
        ]}
      />
    </ModuleWrapper>
  );
}
