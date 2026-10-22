"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPublicCountries } from "@/lib/api/publicClient";
import { destinationUrl } from "@/lib/utils/tourUrl";

const MAX_DIRECTORY_COUNTRIES = 24;

function cleanCountryNames(countryNames: string[]) {
  return Array.from(
    new Set(countryNames.map((name) => name.trim()).filter(Boolean)),
  ).slice(0, MAX_DIRECTORY_COUNTRIES);
}

export default function ExploreDirectorySection({
  countries: initialCountries,
}: {
  countries?: string[];
}) {
  const initialNames = cleanCountryNames(initialCountries ?? []);
  const [countries, setCountries] = useState<string[]>(initialNames);
  const [loading, setLoading] = useState(initialNames.length === 0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    fetchPublicCountries()
      .then((items) => {
        if (!active) return;
        setCountries(cleanCountryNames(items.map((item) => item.country_name)));
        setLoadFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="w-full" aria-labelledby="country-directory-heading">
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-6 shadow-xs sm:rounded-3xl sm:px-8 sm:py-8 lg:px-10">
        <h2
          id="country-directory-heading"
          className="border-b border-slate-200/80 pb-4 text-base font-bold text-slate-950 sm:text-lg"
        >
          Top countries to visit
        </h2>

        {loading && countries.length === 0 ? (
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-5 pt-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            aria-label="Loading countries"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                className="h-5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : countries.length > 0 ? (
          <ol className="grid grid-cols-2 gap-x-4 gap-y-4 pt-6 text-sm text-slate-700 sm:grid-cols-3 sm:pt-8 md:grid-cols-4 lg:grid-cols-6">
            {countries.map((country, index) => (
              <li key={country}>
                <Link
                  href={destinationUrl(country)}
                  className="group flex min-h-8 items-center gap-2 rounded-md outline-none transition-colors hover:text-pub-secondary focus-visible:ring-2 focus-visible:ring-pub-secondary focus-visible:ring-offset-2"
                >
                  <span
                    className="w-6 shrink-0 text-right font-semibold tabular-nums text-slate-900 transition-colors group-hover:text-pub-secondary"
                    aria-hidden="true"
                  >
                    {index + 1}.
                  </span>
                  <span className="min-w-0 truncate group-hover:underline group-hover:underline-offset-4">
                    {country}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="pt-6 text-sm text-slate-600" role={loadFailed ? "alert" : undefined}>
            Countries are being updated. Please check again shortly.
          </p>
        )}
      </div>
    </section>
  );
}
