export const ADDON_CATEGORIES = [
  { value: "pickup", label: "Airport Pickup" },
  { value: "room_upgrade", label: "Room Upgrade" },
  { value: "dining", label: "Dining" },
  { value: "insurance", label: "Travel Insurance" },
  { value: "extra_activity", label: "Extra Activity" },
  { value: "additional_night", label: "Additional Night" },
  { value: "meal", label: "Special Meal" },
  { value: "visa_assistance", label: "Visa Assistance" },
  { value: "other", label: "Other" },
] as const;

export function addonCategoryLabel(value: string): string {
  return ADDON_CATEGORIES.find((c) => c.value === value)?.label || "Other";
}
