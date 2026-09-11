"use client";

import React from "react";
import {
  AboutTourvaaBanner,
  AirportTransfersBanner,
  BlogTeaserSection,
  CountriesWorthExploringSection,
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
  VisualPromoBanner,
} from "@/components/public/home";

export default function Home() {
  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      {/* 1. Hero Banner with Image/Video Carousel, Filter Bar & Trust Rating */}
      <HeroSection />

      {/* 2. Visual Promotional Banner */}
      <VisualPromoBanner />

      {/* 3. Top Deals Section with Dynamic Destination Tabs */}
      <Reveal>
        <TopDealsSection />
      </Reveal>

      {/* 4. Favourite Countries Section */}
      <Reveal>
        <FavouriteCountriesSection />
      </Reveal>

      {/* 5. About Tourvaa Panoramic Banner */}
      <Reveal>
        <AboutTourvaaBanner />
      </Reveal>

      {/* 6. Trending Tour Packages Carousel */}
      <Reveal>
        <TrendingToursSection />
      </Reveal>

      {/* 7. Blog Teaser Banner */}
      <Reveal>
        <BlogTeaserSection />
      </Reveal>

      {/* 8. Handpicked Tours for You */}
      <Reveal>
        <HandpickedToursSection />
      </Reveal>

      {/* 9. Countries Worth Exploring Carousel */}
      <Reveal>
        <CountriesWorthExploringSection />
      </Reveal>

      {/* 10. Travellers' Testimonials Carousel */}
      <Reveal>
        <HomeTestimonialsSection />
      </Reveal>

      {/* 11. Airport Transfers Partner Banner */}
      <Reveal>
        <AirportTransfersBanner />
      </Reveal>

      {/* 12. Frequently Asked Questions Accordion */}
      <Reveal>
        <HomeFaqSection />
      </Reveal>

      {/* 13. 24/7 Travel Support Banner */}
      <Reveal>
        <TravelSupportBanner />
      </Reveal>

      {/* 14. Panoramic Travel Newsletter Registration Banner */}
      <Reveal>
        <HomeNewsletterBanner />
      </Reveal>
    </main>
  );
}
