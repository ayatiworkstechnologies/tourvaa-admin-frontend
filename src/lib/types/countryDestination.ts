export interface QuickFacts {
  capital: string;
  currency: string;
  languages: string;
  timezone: string;
  ideal_duration: string;
  plug_types: string;
  dialing_code?: string;
  driving_side?: string;
}

export interface WhyVisitReason {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  badge?: string;
}

export interface SeasonDetail {
  label: string; // e.g. "Peak Season", "High Season"
  months: string; // e.g. "October - March"
  weather: string; // e.g. "Warm, dry and sunny across most regions"
  description: string;
  crowds: string;
  price_level: string;
}

export interface SeasonGuide {
  summary: string;
  peak_season: SeasonDetail;
  shoulder_season: SeasonDetail;
  low_season: SeasonDetail;
}

export interface MonsoonRegionalVariation {
  region: string;
  climate_note: string;
}

export interface MonsoonInfo {
  headline: string;
  monsoon_overview: string;
  rainfall_schedule: string;
  cyclone_or_extreme_note?: string;
  regional_variations: MonsoonRegionalVariation[];
}

export interface MonthlyWeather {
  month: string; // "Jan", "Feb", ...
  full_month: string; // "January", "February", ...
  avg_high_c: number;
  avg_low_c: number;
  avg_high_f: number;
  avg_low_f: number;
  rainfall_days: number;
  rainfall_mm?: number;
  recommendation: "Peak" | "Good" | "Shoulder" | "Monsoon / Low";
  highlight: string;
}

export interface TemperatureInfo {
  headline: string;
  climate_overview: string;
  monthly_weather: MonthlyWeather[];
}

export interface PlaceToVisit {
  id?: string;
  name: string;
  tag: string; // e.g. "Golden Triangle", "Cultural Capital", "Adventure Hub"
  image: string;
  description: string;
  highlights: string[];
  best_for?: string;
}

export interface TravelAdviceSection {
  visas_and_passports: string;
  money_and_tipping: string;
  health_and_vaccinations: string;
  local_customs_and_culture: string;
  getting_around_and_transport: string;
  packing_essentials: string;
  emergency_numbers?: string;
}

export interface CountryDestinationInfo extends Record<string, unknown> {
  country_id: number;
  country_name: string;
  country_slug: string;
  country_code: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  overview_narrative: string;
  quick_facts: QuickFacts;
  why_visit: {
    title: string;
    subtitle: string;
    reasons: WhyVisitReason[];
  };
  best_time_to_visit: SeasonGuide;
  monsoon_info: MonsoonInfo;
  temperature_info: TemperatureInfo;
  best_places_to_visit: {
    headline: string;
    subtitle: string;
    places: PlaceToVisit[];
  };
  travel_info: TravelAdviceSection;
  updated_at?: string | null;
}
