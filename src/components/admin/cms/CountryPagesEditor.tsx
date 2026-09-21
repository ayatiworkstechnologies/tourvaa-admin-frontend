"use client";

import { useEffect, useState } from "react";
import { fetchPublicCountries, type PublicCountry } from "@/lib/api/publicClient";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";
import PageEditor, { type PageEditorSection } from "./PageEditor";

const SECTIONS: PageEditorSection[] = [
  { key: "listing", label: "Country Tour Page (hero, showcase, SEO)", tabs: ["country-pages"], preview: "tours" },
  { key: "guide", label: "Destination Guide", tabs: ["country-destination-guide"], preview: "destinations" },
  { key: "index", label: "Destinations Page Extras", tabs: ["destination-styles", "destination-seasons"], preview: "index" },
];

// Country landing pages: the /tours/{country} overrides and the
// /destinations/{country} guide, previewed live for the chosen country.
export default function CountryPagesEditor() {
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [country, setCountry] = useState("");

  useEffect(() => {
    fetchPublicCountries()
      .then((items) => {
        setCountries(items);
        if (items[0]) setCountry(slugifyTourSegment(items[0].country_name));
      })
      .catch(() => {});
  }, []);

  return (
    <PageEditor
      sections={SECTIONS}
      previewTitle="Live country page"
      previewSrc={(sec) => (sec.preview === "index" ? "/destinations" : country ? `/${sec.preview}/${country}` : null)}
      toolbarExtra={
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Preview country"
          className="rounded-lg border border-dash-border bg-white px-2 py-1 text-xs font-bold text-dash-text"
        >
          {countries.map((c) => (
            <option key={c.id} value={slugifyTourSegment(c.country_name)}>{c.country_name}</option>
          ))}
        </select>
      }
    />
  );
}
