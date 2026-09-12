import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCountryDestinationInfo, fetchPublicTours, PublicTour } from "@/lib/api/publicClient";
import CountryDestinationPageContent from "@/components/public/country/CountryDestinationPageContent";

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const info = await fetchCountryDestinationInfo(slug);

  if (!info) {
    return {
      title: "Destination Guide | Tourvaa",
      description: "Explore curated destination guides and tours with Tourvaa.",
    };
  }

  const title = `${info.country_name} Travel Guide & Tours | Tourvaa`;
  const description =
    info.tagline ||
    info.overview_narrative?.slice(0, 155) ||
    `Plan your trip to ${info.country_name}. Explore climate matrix, best places to visit, travel advice, and handcrafted tour packages.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: info.hero_image ? [{ url: info.hero_image }] : [],
    },
  };
}

export default async function DestinationCountryPage({
  params,
}: DestinationPageProps) {
  const { slug } = await params;
  const info = await fetchCountryDestinationInfo(slug);

  if (!info) {
    notFound();
  }

  // Fetch live tours for this country on the server to seed fast initial render
  let initialTours: PublicTour[] = [];
  try {
    const toursRes = await fetchPublicTours({
      country: info.country_name,
      limit: 12,
    });
    initialTours = toursRes?.items || [];
  } catch {
    // Graceful fallback to client-side fetch in CountryToursSection
    initialTours = [];
  }

  return (
    <main>
      <CountryDestinationPageContent
        info={info}
        initialTours={initialTours}
      />
    </main>
  );
}
