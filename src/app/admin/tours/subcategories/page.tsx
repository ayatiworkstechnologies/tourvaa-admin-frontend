"use client";

import { useEffect, useMemo, useState } from "react";

import CmsCrudPage from "@/components/cms/CmsCrudPage";
import TourCategoryTabs from "@/components/cms/TourCategoryTabs";
import { listCms } from "@/lib/api/services/cmsService";

type CategoryOption = { id: number; category_name?: string; name?: string };

export default function SubcategoriesPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    listCms("/tour-categories", { page: 1, limit: 500 })
      .then((response) => setCategories((response.items || response.data || []) as CategoryOption[]))
      .catch(() => setCategories([]));
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({
      label: category.category_name || category.name || `Category ${category.id}`,
      value: String(category.id),
    })),
    [categories]
  );

  return (
    <CmsCrudPage
      title="Tour Sub Categories"
      endpoint="/tour-subcategories"
      requiredPermission="subcategories.view"
      createPermission="subcategories.create"
      editPermission="subcategories.edit"
      topContent={<TourCategoryTabs />}
      fields={[
        { name: "category_id", label: "Category", type: "select", options: categoryOptions },
        { name: "subcategory_name", label: "Sub Category name" },
        { name: "slug", label: "Slug" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image", label: "Image path" },
      ]}
      columns={[
        { key: "subcategory_name", header: "Sub Category" },
        { key: "category_name", header: "Category" },
        { key: "slug", header: "Slug" },
      ]}
    />
  );
}
