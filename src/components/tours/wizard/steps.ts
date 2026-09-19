export type WizardStepId =
  | "basic"
  | "location"
  | "itinerary"
  | "pricing"
  | "calendar"
  | "accommodation"
  | "inclusions"
  | "media"
  | "seo"
  | "review";

export type WizardStepDef = {
  id: WizardStepId;
  number: string;
  label: string;
  description: string;
};

export const WIZARD_STEPS: WizardStepDef[] = [
  { id: "basic", number: "01", label: "Basic Information", description: "Add the core information about this tour." },
  { id: "location", number: "02", label: "Overview, Location & Category", description: "Add descriptions, trip overview, destination, and classification." },
  { id: "itinerary", number: "03", label: "Itinerary", description: "Build the day-by-day journey." },
  { id: "pricing", number: "04", label: "Pricing & Discounts", description: "Set base pricing, promo codes, and group discounts." },
  { id: "calendar", number: "05", label: "Calendar & Availability", description: "Set the recurring schedule, specific dates, and blocked dates." },
  { id: "accommodation", number: "06", label: "Accommodation, Activities & Extensions", description: "Add accommodation, optional activities, extensions, and similar tours." },
  { id: "inclusions", number: "07", label: "Inclusions & Exclusions", description: "List what's included and excluded." },
  { id: "media", number: "08", label: "Media & Gallery", description: "Upload the cover, banner, and gallery images." },
  { id: "seo", number: "09", label: "SEO, Deposit & Cancellation Settings", description: "Search visibility, metadata, deposit/payment terms, cancellation & refund policy, and publishing settings." },
  { id: "review", number: "10", label: "Review & Submit", description: "Check every section, then save or submit." },
];

// All editable steps are summarized on the Review & Submit step; "review" itself is not.
export const REVIEWABLE_STEPS = WIZARD_STEPS.filter((s) => s.id !== "review");
