"use client";

import CmsCrudPage from "@/components/cms/CmsCrudPage";

export default function SubcategoriesPage() {
  return (
    <CmsCrudPage
      title="Tour Sub-Categories"
      endpoint="/tour-subcategories"
      requiredPermission="subcategories.view"
      createPermission="subcategories.create"
      editPermission="subcategories.edit"
      fields={[
        { name: "category_id", label: "Category ID", type: "number" },
        { name: "subcategory_name", label: "Sub-category name" },
        { name: "slug", label: "Slug" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image", label: "Image path" },
      ]}
      columns={[
        { key: "subcategory_name", header: "Sub-category" },
        { key: "category_name", header: "Category" },
        { key: "slug", header: "Slug" },
      ]}
    />
  );
}
