"use client";

import CmsCrudPage from "@/components/cms/CmsCrudPage";
import TourCategoryTabs from "@/components/cms/TourCategoryTabs";

export default function CategoriesPage() {
  return (
    <CmsCrudPage
      title="Tour Categories"
      endpoint="/tour-categories"
      topContent={<TourCategoryTabs />}
      requiredPermission="categories.view"
      createPermission="categories.create"
      editPermission="categories.edit"
      fields={[
        { name: "category_name", label: "Category name" },
        { name: "slug", label: "Slug" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image", label: "Image path" },
      ]}
      columns={[
        { key: "category_name", header: "Category" },
        { key: "slug", header: "Slug" },
      ]}
    />
  );
}
