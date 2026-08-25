"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getItineraries,
  getPricing,
  getGallery,
  getCalendar,
  getAvailabilityConfig,
  getInclusions,
  getExclusions,
  getExtensions,
  getSimilarTours,
  getAccommodationExtras,
  getOptionalActivities,
} from "@/lib/api/services/tourDetailService";
import type { StepStatus } from "./WizardSidebar";

type Tour = Record<string, unknown>;

/** Fetches lightweight counts for each sub-resource so the sidebar and the
 * Review & Submit step can show real complete/missing/optional status
 * without inventing backend validation. Only `title` + `number_of_days`
 * are ever backend-hard-required (enforced at the Basic Information step
 * itself); everything else here is a UI recommendation, never a submit
 * blocker. */
export function useStepCompletion(tourId: string | undefined, tour: Tour | null) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!tourId) return;
    setLoading(true);
    try {
      const [
        itineraries, pricing, gallery, calendar, availability,
        inclusions, exclusions, extensions, similar, accommodation, activities,
      ] = await Promise.all([
        getItineraries(tourId), getPricing(tourId), getGallery(tourId), getCalendar(tourId), getAvailabilityConfig(tourId),
        getInclusions(tourId), getExclusions(tourId), getExtensions(tourId), getSimilarTours(tourId), getAccommodationExtras(tourId), getOptionalActivities(tourId),
      ]);
      setCounts({
        itineraries: itineraries.length,
        pricing: pricing.filter((p) => p.status === "active").length,
        gallery: gallery.length,
        calendar: calendar.length + (availability ? 1 : 0),
        inclusions: inclusions.length,
        exclusions: exclusions.length,
        extensions: extensions.length,
        similar: similar.length,
        accommodation: accommodation.length,
        activities: activities.length,
      });
    } catch {
      // Non-critical -- the wizard still works without completion badges.
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const title = String(tour?.title ?? "").trim();
  const numberOfDays = Number(tour?.number_of_days ?? 0);

  // Index must match WIZARD_STEPS order in steps.ts.
  const statuses: Record<number, StepStatus> = {
    0: title && numberOfDays >= 1 ? "complete" : "missing",
    1: tour?.country_id && tour?.category_id ? "complete" : "missing",
    2: String(tour?.short_description ?? "").trim() ? "complete" : "missing",
    3: (counts.itineraries ?? 0) > 0 ? "complete" : "missing",
    4: (counts.pricing ?? 0) > 0 ? "complete" : "missing",
    5: (counts.calendar ?? 0) > 0 ? "complete" : "missing",
    6: (counts.accommodation ?? 0) > 0 || (counts.activities ?? 0) > 0 ? "complete" : "optional",
    7: (counts.inclusions ?? 0) > 0 || (counts.exclusions ?? 0) > 0 ? "complete" : "optional",
    8: (counts.extensions ?? 0) > 0 || (counts.similar ?? 0) > 0 ? "complete" : "optional",
    9: String(tour?.banner_image ?? "").trim() || (counts.gallery ?? 0) > 0 ? "complete" : "missing",
    10: String(tour?.seo_title ?? "").trim() && String(tour?.seo_description ?? "").trim() ? "complete" : "optional",
  };

  return { statuses, counts, loading, refresh };
}
