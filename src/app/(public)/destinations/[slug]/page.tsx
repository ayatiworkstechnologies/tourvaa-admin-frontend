import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchPublicTours, PublicTour } from "@/lib/api/publicClient";
import {
  fetchCountryDestinationInfoForServer,
  isLegacyDestinationGuideSlug,
  isPublicDestinationCountryForServer,
} from "@/lib/data/countryDestinationCms";
import { cleanMetaText } from "@/lib/seo/seoPages";
import CountryDestinationPageContent from "@/components/public/country/CountryDestinationPageContent";

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const info = await fetchCountryDestinationInfoForServer(slug);

  if (!info) {
    return {
      title: { absolute: "Destination Guide | Tourvaa" },
      description: "Explore curated destination guides and tours with Tourvaa.",
    };
  }

  const title = `${info.country_name} Travel Guide & Tours | Tourvaa`;
  const description = cleanMetaText(
    info.tagline ||
    info.overview_narrative?.slice(0, 155) ||
    `Plan your trip to ${info.country_name}. Explore climate matrix, best places to visit, travel advice, and handcrafted tour packages.`,
  );

  return {
    title: { absolute: title },
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
  const info = await fetchCountryDestinationInfoForServer(slug);

  if (!info) {
    // A published long-form guide is optional. Preserve old destination URLs
    // for active countries and formerly published destination links by sending
    // visitors to the country tour catalogue. Unknown slugs remain a real 404.
    if (
      isLegacyDestinationGuideSlug(slug) ||
      await isPublicDestinationCountryForServer(slug)
    ) {
      redirect(`/tours/${encodeURIComponent(slug.toLowerCase())}`);
    }
    notFound();
  }

  // Fetch live tours for this country on the server to seed fast initial render
  let initialTours: PublicTour[] = [];
  let tourCount = 0;
  try {
    const toursRes = await fetchPublicTours({
      country: info.country_name,
      limit: 12,
    });
    initialTours = toursRes?.items || [];
    tourCount = toursRes?.total || 0;
  } catch {
    // Graceful fallback to client-side fetch in CountryToursSection
    initialTours = [];
  }

  return (
    <main>
      <CountryDestinationPageContent
        info={info}
        initialTours={initialTours}
        tourCount={tourCount}
      />
    </main>
  );
}
