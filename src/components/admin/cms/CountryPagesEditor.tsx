"use client";

import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  fetchCmsCountryOptions,
  formatCmsCountryOption,
  type CmsCountryOption,
} from "@/lib/api/cmsCountries";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";
import PageEditor, { type PageEditorSection } from "./PageEditor";
import CountryDestinationInfoPanel from "./CountryDestinationInfoPanel";

// Country landing pages: the /tours/{country} overrides and the
// /destinations/{country} guide, previewed live for the chosen country.
export default function CountryPagesEditor() {
  const [countries, setCountries] = useState<CmsCountryOption[]>([]);
  const [country, setCountry] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState("");

  useEffect(() => {
    let active = true;
    setCountriesLoading(true);
    setCountriesError("");
    fetchCmsCountryOptions()
      .then((items) => {
        if (!active) return;
        setCountries(items);
        setCountry((selected) => selected || slugifyTourSegment(
          items.find((item) => item.name.toLowerCase() === "india")?.name || items[0]?.name || "",
        ));
      })
      .catch(() => {
        if (!active) return;
        setCountries([]);
        setCountriesError("Could not load the complete country list. Refresh the page and try again.");
      })
      .finally(() => {
        if (active) setCountriesLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectedCountryName = countries.find(
    (item) => slugifyTourSegment(item.name) === country,
  )?.name || "";
  const countryPickerOptions = useMemo(() => countries.map((item) => ({
    value: slugifyTourSegment(item.name),
    label: formatCmsCountryOption(item),
  })), [countries]);

  const sections: PageEditorSection[] = [
    { key: "listing", label: "Country Tour Page (hero, showcase, SEO)", tabs: ["country-pages"], preview: "tours" },
    {
      key: "guide",
      label: "Destination Guide",
      preview: "destinations",
      render: () => (
        <CountryDestinationInfoPanel
          selectedCountryName={selectedCountryName}
          countryOptions={countries}
          countriesLoading={countriesLoading}
          countriesError={countriesError}
          onCountryChange={(name) => setCountry(slugifyTourSegment(name))}
          onSaved={() => setPreviewVersion((version) => version + 1)}
        />
      ),
    },
    { key: "index", label: "Destinations Page Extras", tabs: ["destination-styles", "destination-seasons"], preview: "index" },
  ];

  return (
    <PageEditor
      sections={sections}
      previewTitle="Live country page"
      previewSrc={(sec) => (sec.preview === "index" ? "/destinations" : country ? `/${sec.preview}/${country}` : null)}
      previewVersion={previewVersion}
      toolbarExtra={
        <div className="flex items-center gap-2">
          <SearchableSelect
            id="country-page-preview-picker"
            value={country}
            onChange={setCountry}
            options={countryPickerOptions}
            placeholder={countriesLoading ? "Loading countries…" : "Select country"}
            searchPlaceholder="Search any country or code"
            ariaLabel="Preview country"
            size="sm"
            disabled={countriesLoading || Boolean(countriesError) || countries.length === 0}
            className="w-56 max-w-[min(14rem,calc(100vw-2rem))]"
          />
          {countriesError && <span role="alert" className="max-w-56 text-xs font-semibold text-red-600">{countriesError}</span>}
        </div>
      }
    />
  );
}
