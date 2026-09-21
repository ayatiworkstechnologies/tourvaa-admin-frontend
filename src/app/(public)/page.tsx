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
} from "@/components/public/home";
import ExploreDirectorySection from "@/components/public/ExploreDirectorySection";

export default function Home() {
  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      {/* 1. Hero Banner with Image/Video Carousel, Filter Bar & Trust Rating */}
      <HeroSection />

      {/* 2. Top Deals Section with Dynamic Destination Tabs */}
      <TopDealsSection />

      {/* 3. Favourite Countries Section */}
      <Reveal variant="fade-up">
        <FavouriteCountriesSection />
      </Reveal>

      {/* 4. About Tourvaa Panoramic Banner */}
      <Reveal variant="fade">
        <AboutTourvaaBanner />
      </Reveal>

      {/* 5. Trending Tour Packages Carousel */}
      <TrendingToursSection />

      {/* 6. Blog Teaser Banner */}
      <Reveal variant="fade">
        <BlogTeaserSection />
      </Reveal>

      {/* 7. Handpicked Tours for You */}
      <Reveal variant="fade">
        <HandpickedToursSection />
      </Reveal>

      {/* 8. Countries Worth Exploring Carousel */}
      <Reveal variant="fade">
        <CountriesWorthExploringSection />
      </Reveal>

      {/* 9. Travellers' Testimonials Carousel */}
      <Reveal variant="fade">
        <HomeTestimonialsSection />
      </Reveal>

      {/* 10. Directory / Popular Destination Searches Tabs Grid */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-10 sm:py-14">
        <Reveal variant="fade-up">
          <ExploreDirectorySection />
        </Reveal>
      </div>

      {/* 11. Airport Transfers Partner Banner */}
      <Reveal variant="scale-up">
        <AirportTransfersBanner />
      </Reveal>

      {/* 12. Frequently Asked Questions Accordion */}
      <Reveal variant="fade">
        <HomeFaqSection />
      </Reveal>

      {/* 13. 24/7 Travel Support Banner */}
      <Reveal variant="fade">
        <TravelSupportBanner />
      </Reveal>

      {/* 14. Panoramic Travel Newsletter Registration Banner */}
      <Reveal variant="fade-up">
        <HomeNewsletterBanner />
      </Reveal>
    </main>
  );
}

