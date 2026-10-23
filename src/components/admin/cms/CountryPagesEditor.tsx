"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LuBookOpen as BookOpen, LuExternalLink as ExternalLink, LuMap as Map } from "react-icons/lu";
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
  const [activeSection, setActiveSection] = useState("listing");
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
    // These sources publish independently. In particular, a country might not
    // yet have a tour-page override or a destination guide, while the global
    // Destinations-page cards are still fully editable. Do not let one failed
    // request make every publication badge look unavailable.
    void Promise.allSettled([
      api.get("/cms/country-pages", { params: { page: 1, limit: 1000 } }),
      api.get(`/cms/content-blocks/country_info_${country}`),
      api.get("/cms/content-blocks/destination_styles"),
      api.get("/cms/content-blocks/destination_seasons"),
      api.get("/cms/content-blocks/destinations_page"),
    ]).then(([pagesResult, guideResult, stylesResult, seasonsResult, destinationsPageResult]) => {
      if (requestId !== statusRequestRef.current) return;
      const pages = pagesResult.status === "fulfilled" ? pagesResult.value : null;
      const guide = guideResult.status === "fulfilled" ? guideResult.value : null;
      const styles = stylesResult.status === "fulfilled" ? stylesResult.value : null;
      const seasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : null;
      const destinationsPage = destinationsPageResult.status === "fulfilled" ? destinationsPageResult.value : null;
      const rows = pages?.data?.items || pages?.data?.data?.items || pages?.data?.data || [];
      const tourPage = Array.isArray(rows) ? rows.find((row) => Number(row.country_id) === selectedCountryId) : null;
      const guideData = guide?.data?.data?.data || guide?.data?.data || {};
      const stylesData = styles?.data?.data?.data || styles?.data?.data || {};
      const seasonsData = seasons?.data?.data?.data || seasons?.data?.data || {};
      const destinationsPageData = destinationsPage?.data?.data?.data || destinationsPage?.data?.data || {};
      setPublishState({
        tour: !pages ? "Unavailable" : !tourPage ? "Not created" : tourPage.is_active ? "Published" : "Hidden (saved)",
        guide: !guide ? "Unavailable" : guideData && Object.keys(guideData).length ? "Authored / public" : "Not authored",
        index: !styles && !seasons && !destinationsPage ? "Unavailable" : Object.keys(stylesData).length || Object.keys(seasonsData).length || Object.keys(destinationsPageData).length ? "Saved global content" : "No global content",
      });
    });
  }, [country, selectedCountryId, previewVersion]);

  const changeCountry = (next: string) => {
    if (next === country) return;
    if (countryPageDirty && !window.confirm("You have unsaved Country Tour Page changes. Switch country and discard them?")) return;
    setCountry(next);
  };

  const openSection = (section: "listing" | "guide") => {
    setActiveSection(section);
  };
  const hasAuthoredGuide = publishState.guide === "Authored / public";

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
    { key: "index", label: "Destinations Page", tabs: ["destinations-page", "destination-styles", "destination-seasons"], preview: "index" },
  ];

  return (
    <PageEditor
      sections={sections}
      previewTitle="Live country page"
      previewSrc={(sec) => (sec.preview === "index" ? "/destinations" : country ? `/${sec.preview}/${country}` : null)}
      previewVersion={previewVersion}
      selectedCountryId={selectedCountryId}
      onCountryPageDirtyChange={setCountryPageDirty}
      active={activeSection}
      onActiveChange={setActiveSection}
      headerAction={country ? (
        <div className="flex flex-wrap items-center justify-end gap-1.5" aria-label={`${selectedCountry} page actions`}>
          <button
            type="button"
            onClick={() => openSection("listing")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
              activeSection === "listing"
                ? "border-sky-700 bg-sky-700 text-white"
                : "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-300 hover:bg-sky-100"
            }`}
          >
            <BookOpen size={13} /> Edit tours page
          </button>
          <button
            type="button"
            onClick={() => openSection("guide")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
              activeSection === "guide"
                ? "border-violet-700 bg-violet-700 text-white"
                : "border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-300 hover:bg-violet-100"
            }`}
          >
            <Map size={13} /> Edit destination guide
          </button>
          <Link
            href={`/tours/${country}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Tours <ExternalLink size={12} />
          </Link>
          {hasAuthoredGuide ? (
            <Link
              href={`/destinations/${country}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Guide <ExternalLink size={12} />
            </Link>
          ) : (
            <span
              title="Save a destination guide before opening its public URL."
              className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-400"
            >
              Guide unavailable
            </span>
          )}
        </div>
      ) : undefined}
      toolbarExtra={
        <div className="flex flex-wrap items-center gap-2">
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
