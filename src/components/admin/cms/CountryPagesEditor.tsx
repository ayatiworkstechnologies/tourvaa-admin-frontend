"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  fetchCmsCountryOptions,
  formatCmsCountryOption,
  type CmsCountryOption,
} from "@/lib/api/cmsCountries";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";
import PageEditor, { type PageEditorSection } from "./PageEditor";
import CountryDestinationInfoPanel from "./CountryDestinationInfoPanel";
import api from "@/lib/api/client";

type PublishState = { tour: string; guide: string; index: string };

// Country landing pages: the /tours/{country} overrides and the
// /destinations/{country} guide, previewed live for the chosen country.
export default function CountryPagesEditor() {
  const [countries, setCountries] = useState<CmsCountryOption[]>([]);
  const [country, setCountry] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState("");
  const [publishState, setPublishState] = useState<PublishState>({ tour: "Loading…", guide: "Loading…", index: "Loading…" });
  const [countryPageDirty, setCountryPageDirty] = useState(false);
  const statusRequestRef = useRef(0);

  useEffect(() => {
    let active = true;
    setCountriesLoading(true);
    setCountriesError("");
    fetchCmsCountryOptions()
      .then((items) => {
        if (!active) return;
        setCountries(items);
        setCountry((selected) => selected || (
          items.find((item) => item.name.toLowerCase() === "india")?.slug || items[0]?.slug || slugifyTourSegment(items[0]?.name || "")
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

  const selectedCountry = countries.find(
    (item) => (item.slug || slugifyTourSegment(item.name)) === country,
  )?.name || "";
  const selectedCountryId = countries.find((item) => (item.slug || slugifyTourSegment(item.name)) === country)?.id;
  const countryPickerOptions = useMemo(() => countries.map((item) => ({
    value: item.slug || slugifyTourSegment(item.name),
    label: formatCmsCountryOption(item),
  })), [countries]);

  useEffect(() => {
    if (!selectedCountryId || !country) return;
    const requestId = ++statusRequestRef.current;
    void Promise.all([
      api.get("/cms/country-pages", { params: { page: 1, limit: 1000 } }),
      api.get(`/cms/content-blocks/country_info_${country}`),
      api.get("/cms/content-blocks/destination-styles"),
      api.get("/cms/content-blocks/destination-seasons"),
    ]).then(([pages, guide, styles, seasons]) => {
      if (requestId !== statusRequestRef.current) return;
      const rows = pages.data?.items || pages.data?.data?.items || pages.data?.data || [];
      const tourPage = Array.isArray(rows) ? rows.find((row) => Number(row.country_id) === selectedCountryId) : null;
      const guideData = guide.data?.data?.data || guide.data?.data || {};
      const stylesData = styles.data?.data?.data || styles.data?.data || {};
      const seasonsData = seasons.data?.data?.data || seasons.data?.data || {};
      setPublishState({
        tour: !tourPage ? "Not created" : tourPage.is_active ? "Published" : "Hidden (saved)",
        guide: guideData && Object.keys(guideData).length ? "Authored / public" : "Not authored",
        index: Object.keys(stylesData).length || Object.keys(seasonsData).length ? "Saved global extras" : "No global extras",
      });
    }).catch(() => {
      if (requestId === statusRequestRef.current) setPublishState({ tour: "Unavailable", guide: "Unavailable", index: "Unavailable" });
    });
  }, [country, selectedCountryId, previewVersion]);

  const changeCountry = (next: string) => {
    if (next === country) return;
    if (countryPageDirty && !window.confirm("You have unsaved Country Tour Page changes. Switch country and discard them?")) return;
    setCountry(next);
  };

  const sections: PageEditorSection[] = [
    { key: "listing", label: "Country Tour Page (hero, showcase, SEO)", tabs: ["country-pages"], preview: "tours" },
    {
      key: "guide",
      label: "Destination Guide",
      preview: "destinations",
      render: () => (
        <CountryDestinationInfoPanel
          selectedCountryName={selectedCountry}
          selectedCountrySlug={country}
          countryOptions={countries}
          countriesLoading={countriesLoading}
          countriesError={countriesError}
          onCountryChange={(name) => changeCountry(countries.find((item) => item.name === name)?.slug || slugifyTourSegment(name))}
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
      selectedCountryId={selectedCountryId}
      onCountryPageDirtyChange={setCountryPageDirty}
      toolbarExtra={
        <div className="flex items-center gap-2">
          <SearchableSelect
            id="country-page-preview-picker"
            value={country}
            onChange={changeCountry}
            options={countryPickerOptions}
            placeholder={countriesLoading ? "Loading countries…" : "Select country"}
            searchPlaceholder="Search any country or code"
            ariaLabel="Preview country"
            size="sm"
            disabled={countriesLoading || Boolean(countriesError) || countries.length === 0}
            className="w-56 max-w-[min(14rem,calc(100vw-2rem))]"
          />
          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold" aria-label="Independent publication states">
            <span className="rounded bg-sky-50 px-2 py-1 text-sky-800">Tour Page: {publishState.tour}</span>
            <span className="rounded bg-violet-50 px-2 py-1 text-violet-800">Destination Guide: {publishState.guide}</span>
            <span className="rounded bg-amber-50 px-2 py-1 text-amber-800">Destinations Index Extras: {publishState.index}</span>
          </div>
          {countriesError && <span role="alert" className="max-w-56 text-xs font-semibold text-red-600">{countriesError}</span>}
        </div>
      }
    />
  );
}
