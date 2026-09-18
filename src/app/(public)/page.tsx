"use client";

import React from "react";
import {
  AboutTourvaaBanner,
  AirportTransfersBanner,
  BlogTeaserSection,
  CountriesWorthExploringSection,
  EscapeSaleSection,
  FavouriteCountriesSection,
  HandpickedToursSection,
  HeroSection,
  HomeFaqSection,
  HomeNewsletterBanner,
  HomeTestimonialsSection,
  Reveal,
  TopDealsSection,
  TravelSupportBanner,
  TrendingToursSection,
} from "@/components/public/home";
import ExploreDirectorySection from "@/components/public/ExploreDirectorySection";

export default function Home() {
  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      {/* 1. Hero Banner with Image/Video Carousel, Filter Bar & Trust Rating */}
      <HeroSection />

      {/* 2. Escape Sale: urgency banner + auto-sliding deal carousel */}
      <EscapeSaleSection />

      {/* 3. Top Deals Section with Dynamic Destination Tabs */}
      <TopDealsSection />

      {/* 4. Favourite Countries Section */}
      <Reveal variant="fade-up">
        <FavouriteCountriesSection />
      </Reveal>

      {/* 5. About Tourvaa Panoramic Banner */}
      <Reveal variant="fade">
        <AboutTourvaaBanner />
      </Reveal>

      {/* 6. Trending Tour Packages Carousel */}
      <TrendingToursSection />

      {/* 7. Blog Teaser Banner */}
      <Reveal variant="fade">
        <BlogTeaserSection />
      </Reveal>

      {/* 8. Handpicked Tours for You */}
      <Reveal variant="fade-up">
        <HandpickedToursSection />
      </Reveal>

      {/* 9. Countries Worth Exploring Carousel */}
      <Reveal variant="fade-up">
        <CountriesWorthExploringSection />
      </Reveal>

      {/* 10. Travellers' Testimonials Carousel */}
      <Reveal variant="scale-up">
        <HomeTestimonialsSection />
      </Reveal>

      {/* 11. Directory / Popular Destination Searches Tabs Grid */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-5 my-8 sm:my-12">
        <Reveal variant="fade-up">
          <ExploreDirectorySection />
        </Reveal>
      </div>

      {/* 12. Airport Transfers Partner Banner */}
      <Reveal variant="scale-up">
        <AirportTransfersBanner />
      </Reveal>

      {/* 12. Frequently Asked Questions Accordion */}
      <Reveal variant="fade-up">
        <HomeFaqSection />
      </Reveal>

      {/* 13. 24/7 Travel Support Banner */}
      <Reveal variant="scale-up">
        <TravelSupportBanner />
      </Reveal>

      {/* 14. Panoramic Travel Newsletter Registration Banner */}
      <Reveal variant="fade-up">
        <HomeNewsletterBanner />
      </Reveal>
    </main>
  );
}

