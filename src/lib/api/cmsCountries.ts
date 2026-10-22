import api from "@/lib/api/client";

export type CmsCountryOption = {
  id: number;
  name: string;
  code: string;
};

type CountryRecord = {
  id?: number;
  country_name?: string;
  country_code?: string;
};

export function formatCmsCountryOption(country: CmsCountryOption): string {
  const code = country.code ? ` (${country.code})` : "";
  return `${country.name}${code}`;
}

/**
 * Country Pages is an administrative authoring surface, so it needs the full
 * catalogue. Public country endpoints intentionally omit inactive records.
 */
export async function fetchCmsCountryOptions(): Promise<CmsCountryOption[]> {
  const response = await api.get("/countries", {
    params: { page: 1, limit: 1000 },
  });
  const items = (response.data?.items || []) as CountryRecord[];

  return items
    .map((country) => ({
      id: Number(country.id),
      name: String(country.country_name || "").trim(),
      code: String(country.country_code || "").trim().toUpperCase(),
    }))
    .filter((country) => country.id > 0 && country.name)
    .sort((left, right) => left.name.localeCompare(right.name));
}
