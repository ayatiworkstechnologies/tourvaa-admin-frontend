import { NextResponse } from "next/server";

const REST_COUNTRIES_URL = "https://api.restcountries.com/countries/v5";

type RestCountry = {
  name?: {
    common?: string;
    official?: string;
  };
};

export async function GET(request: Request) {
  const token = process.env.RESTCOUNTRIES_API_TOKEN;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!token) {
    return NextResponse.json(
      { error: "RESTCOUNTRIES_API_TOKEN is not configured", items: [] },
      { status: 500 }
    );
  }

  if (query.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const upstream = await fetch(`${REST_COUNTRIES_URL}?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Could not fetch countries", items: [] },
      { status: upstream.status }
    );
  }

  const data = (await upstream.json()) as RestCountry[];
  const items = Array.from(
    new Set(
      data
        .map((country) => country.name?.common || country.name?.official || "")
        .filter(Boolean)
    )
  ).slice(0, 20);

  return NextResponse.json({ items });
}
