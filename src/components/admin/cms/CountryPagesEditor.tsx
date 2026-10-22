"use client";

import { useEffect, useState } from "react";
import { fetchPublicCountries, type PublicCountry } from "@/lib/api/publicClient";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";
import PageEditor, { type PageEditorSection } from "./PageEditor";
import CountryDestinationInfoPanel from "./CountryDestinationInfoPanel";

// Country landing pages: the /tours/{country} overrides and the
// /destinations/{country} guide, previewed live for the chosen country.
export default function CountryPagesEditor() {
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [country, setCountry] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState("");

  useEffect(() => {
    let active = true;
    setCountriesLoading(true);
    setCountriesError("");
    fetchPublicCountries()
      .then((items) => {
        if (!active) return;
        setCountries(items);
        setCountry((selected) => selected || (items[0] ? slugifyTourSegment(items[0].country_name) : ""));
      })
      .catch(() => {
        if (!active) return;
        setCountries([]);
        setCountriesError("Could not load countries for the live preview. Refresh the page and try again.");
      })
      .finally(() => {
        if (active) setCountriesLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectedCountryName = countries.find(
    (item) => slugifyTourSegment(item.country_name) === country,
  )?.country_name;

  const sections: PageEditorSection[] = [
    { key: "listing", label: "Country Tour Page (hero, showcase, SEO)", tabs: ["country-pages"], preview: "tours" },
    {
      key: "guide",
      label: "Destination Guide",
      preview: "destinations",
      render: () => (
        <CountryDestinationInfoPanel
          selectedCountryName={selectedCountryName}
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
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Preview country"
            disabled={countriesLoading || Boolean(countriesError) || countries.length === 0}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {countriesLoading && <option>Loading countries…</option>}
            {!countriesLoading && countries.length === 0 && <option>No countries available</option>}
            {countries.map((c) => (
              <option key={c.id} value={slugifyTourSegment(c.country_name)}>{c.country_name}</option>
            ))}
          </select>
          {countriesError && <span role="alert" className="max-w-56 text-xs font-semibold text-red-600">{countriesError}</span>}
        </div>
      }
    />
  );
}
