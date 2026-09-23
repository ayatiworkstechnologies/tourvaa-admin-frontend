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
  HomeExtraSections,
  HomeFaqSection,
  HomeNewsletterBanner,
  HomeTestimonialsSection,
  Reveal,
  TopDealsSection,
  TravelSupportBanner,
  TrendingToursSection,
} from "@/components/public/home";
import { useSectionVisibility } from "@/components/public/home/sectionVisibility";
import ExploreDirectorySection from "@/components/public/ExploreDirectorySection";

export default function Home() {
  // Each section can be switched off from CMS > Home Page (Top Deals and
  // Trending check their own switch inside the component). After each one,
  // <HomeExtraSections> renders any admin-added sections placed there.
  const shown = useSectionVisibility();

  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      {/* 1. Hero Banner with Image/Video Carousel, Filter Bar & Trust Rating */}
      {shown("hero") && <HeroSection />}
      <HomeExtraSections after="hero" />

      {/* 2. Top Deals Section with Dynamic Destination Tabs */}
      <TopDealsSection />
      <HomeExtraSections after="top-deals" />

      {/* 3. Favourite Countries Section */}
      {shown("favourite") && (
        <Reveal variant="fade-up">
          <FavouriteCountriesSection />
        </Reveal>
      )}
      <HomeExtraSections after="favourite" />

      {/* 4. About Tourvaa Panoramic Banner */}
      {shown("about") && (
        <Reveal variant="fade">
          <AboutTourvaaBanner />
        </Reveal>
      )}
      <HomeExtraSections after="about" />

      {/* 5. Trending Tour Packages Carousel */}
      <TrendingToursSection />
      <HomeExtraSections after="trending" />

      {/* 6. Blog Teaser Banner */}
      {shown("blog") && (
        <Reveal variant="fade">
          <BlogTeaserSection />
        </Reveal>
      )}
      <HomeExtraSections after="blog" />

      {/* 7. Handpicked Tours for You */}
      {shown("handpicked") && (
        <Reveal variant="fade">
          <HandpickedToursSection />
        </Reveal>
      )}
      <HomeExtraSections after="handpicked" />

      {/* 8. Countries Worth Exploring Carousel */}
      {shown("countries") && (
        <Reveal variant="fade">
          <CountriesWorthExploringSection />
        </Reveal>
      )}
      <HomeExtraSections after="countries" />

      {/* 9. Travellers' Testimonials Carousel */}
      {shown("testimonials") && (
        <Reveal variant="fade">
          <HomeTestimonialsSection />
        </Reveal>
      )}
      <HomeExtraSections after="testimonials" />

      {/* 10. Directory / Popular Destination Searches Tabs Grid */}
      {shown("directory") && (
        <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-10 sm:py-14">
          <Reveal variant="fade-up">
            <ExploreDirectorySection />
          </Reveal>
        </div>
      )}
      <HomeExtraSections after="directory" />

      {/* 11. Airport Transfers Partner Banner */}
      {shown("airport") && (
        <Reveal variant="scale-up">
          <AirportTransfersBanner />
        </Reveal>
      )}
      <HomeExtraSections after="airport" />

      {/* 12. Frequently Asked Questions Accordion */}
      {shown("faq") && (
        <Reveal variant="fade">
          <HomeFaqSection />
        </Reveal>
      )}
      <HomeExtraSections after="faq" />

      {/* 13. 24/7 Travel Support Banner */}
      {shown("support") && (
        <Reveal variant="fade">
          <TravelSupportBanner />
        </Reveal>
      )}
      <HomeExtraSections after="support" />

      {/* 14. Panoramic Travel Newsletter Registration Banner */}
      {shown("offers") && (
        <Reveal variant="fade-up">
          <HomeNewsletterBanner />
        </Reveal>
      )}
      <HomeExtraSections after="offers" />
    </main>
  );
}
