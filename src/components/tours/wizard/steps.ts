export type WizardStepId =
  | "basic"
  | "location"
  | "itinerary"
  | "pricing"
  | "calendar"
  | "accommodation"
  | "extras"
  | "inclusions"
  | "media"
  | "settings"
  | "seo"
  | "review";

export type WizardStepDef = {
  id: WizardStepId;
  number: string;
  label: string;
  description: string;
  /** Nice-to-have: a tour can be submitted without it. */
  optional?: boolean;
  /** Admin review-comment sections (tour approval screen) shown on this step. */
  reviewSections: string[];
};

export const WIZARD_STEPS: WizardStepDef[] = [
  { id: "basic", number: "01", label: "Basic Information", description: "Add the core information about this tour.", reviewSections: ["basic"] },
  { id: "location", number: "02", label: "Overview, Location & Category", description: "Add descriptions, trip overview, destination, and classification.", reviewSections: ["location", "overview"] },
  { id: "itinerary", number: "03", label: "Itinerary", description: "Build the day-by-day journey.", reviewSections: ["itinerary"] },
  { id: "pricing", number: "04", label: "Pricing & Discounts", description: "Set base pricing, promo codes, and group discounts.", reviewSections: ["pricing"] },
  { id: "calendar", number: "05", label: "Calendar & Availability", description: "Set the recurring schedule, specific dates, and blocked dates.", reviewSections: ["availability"] },
  { id: "accommodation", number: "06", label: "Accommodation & Activities", description: "Add accommodation options and optional activities.", optional: true, reviewSections: ["accommodation", "activities"] },
  { id: "extras", number: "07", label: "Extensions & Similar Tours", description: "Add trip extensions and link similar tours.", optional: true, reviewSections: [] },
  { id: "inclusions", number: "08", label: "Inclusions & Exclusions", description: "List what's included and excluded.", optional: true, reviewSections: ["policies"] },
  { id: "media", number: "09", label: "Media & Gallery", description: "Upload the cover, banner, and gallery images.", reviewSections: ["media"] },
  { id: "settings", number: "10", label: "Deposit, Cancellation & Settings", description: "Deposit and payment terms, cancellation and refund policy, and publishing settings.", optional: true, reviewSections: [] },
  { id: "seo", number: "11", label: "SEO", description: "Search visibility and metadata.", optional: true, reviewSections: [] },
  { id: "review", number: "12", label: "Review & Submit", description: "Check every section, then save or submit.", reviewSections: [] },
];

// All editable steps are summarized on the Review & Submit step; "review" itself is not.
export const REVIEWABLE_STEPS = WIZARD_STEPS.filter((s) => s.id !== "review");

export type StepStatus = "complete" | "missing" | "optional" | "not-started";
