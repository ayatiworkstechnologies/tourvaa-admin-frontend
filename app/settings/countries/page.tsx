"use client";

import CmsCrudPage from "@/components/cms/CmsCrudPage";

export default function CountriesPage() {
  return (
    <CmsCrudPage
      title="Countries"
      endpoint="/countries"
      requiredPermission="countries.view"
      createPermission="countries.create"
      editPermission="countries.edit"
      fields={[
        { name: "country_name", label: "Country name" },
        { name: "country_code", label: "Country code" },
        { name: "phone_code", label: "Phone code" },
        { name: "currency_code", label: "Currency code" },
      ]}
      columns={[
        { key: "country_name", header: "Country" },
        { key: "country_code", header: "Code" },
        { key: "phone_code", header: "Phone" },
        { key: "currency_code", header: "Currency" },
      ]}
    />
  );
}
