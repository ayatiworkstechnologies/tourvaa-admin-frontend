import { NextResponse } from "next/server";

type Country = {
  id: number;
  country_name?: string;
  name?: string;
  country_code?: string;
  code?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() || "";
  const apiProxyTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${apiProxyTarget}/api/countries?limit=500`, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not fetch countries", items: [] },
        { status: response.status }
      );
    }

    const payload = (await response.json()) as { data?: Country[]; items?: Country[] };
    const items = (payload.items ?? payload.data ?? [])
      .map((country) => ({
        id: country.id,
        country_name: country.country_name ?? country.name ?? "",
        country_code: country.country_code ?? country.code ?? "",
      }))
      .filter((country) => !query || country.country_name.toLowerCase().includes(query))
      .slice(0, 100);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch countries", items: [] },
      { status: 500 }
    );
  }
}
