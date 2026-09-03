export type WizardStepId =
  | "basic"
  | "overview"
  | "location"
  | "itinerary"
  | "pricing"
  | "calendar"
  | "extensions"
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
  { id: "overview", number: "02", label: "Overview & Description", description: "Summarize the tour and add highlights." },
  { id: "location", number: "03", label: "Location & Category", description: "Set the destination and classify the tour." },
  { id: "itinerary", number: "04", label: "Itinerary", description: "Build the day-by-day journey." },
  { id: "pricing", number: "05", label: "Pricing & Discounts", description: "Set base pricing, promo codes, and group discounts." },
  { id: "calendar", number: "06", label: "Calendar & Availability", description: "Set the recurring schedule, specific dates, and blocked dates." },
  { id: "extensions", number: "07", label: "Extensions & Similar Tours", description: "Add optional extensions and related tours." },
  { id: "inclusions", number: "08", label: "Inclusions & Exclusions", description: "List what's included and excluded." },
  { id: "media", number: "09", label: "Media & Gallery", description: "Upload the cover, banner, and gallery images." },
  { id: "seo", number: "10", label: "SEO, Deposit & Cancellation Settings", description: "Search visibility, metadata, deposit/payment terms, cancellation & refund policy, and publishing settings." },
  { id: "review", number: "11", label: "Review & Submit", description: "Check every section, then save or submit." },
];

// Steps 1-11 are summarized on the Review & Submit step; "review" itself is not.
export const REVIEWABLE_STEPS = WIZARD_STEPS.filter((s) => s.id !== "review");
