"use client";

import CmsCrudPage from "@/components/cms/CmsCrudPage";

export default function CitiesPage() {
  return (
    <CmsCrudPage
      title="Cities"
      endpoint="/cities"
      requiredPermission="cities.view"
      createPermission="cities.create"
      editPermission="cities.edit"
      fields={[
        { name: "country_id", label: "Country ID", type: "number" },
        { name: "city_name", label: "City name" },
      ]}
      columns={[
        { key: "city_name", header: "City" },
        { key: "country_name", header: "Country" },
      ]}
    />
  );
}
