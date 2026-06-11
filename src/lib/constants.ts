export const SERVICE_TYPES = [
  { value: "swedish", label: "Swedish" },
  { value: "deep_tissue", label: "Deep Tissue" },
  { value: "aroma", label: "Aromatherapy" },
  { value: "thai", label: "Thai" },
  { value: "sports", label: "Sports" },
  { value: "reflexology", label: "Reflexology" },
  { value: "hot_stone", label: "Hot Stone" },
  { value: "balinese", label: "Balinese" },
  { value: "shiatsu", label: "Shiatsu" },
  { value: "lymphatic", label: "Lymphatic Drainage" },
  { value: "prenatal", label: "Prenatal" },
  { value: "head_shoulder", label: "Head & Shoulder" },
  { value: "korean", label: "Korean Gyeongnak" },
  { value: "couples", label: "Couples" },
  { value: "four_hands", label: "Four Hands" },
  { value: "cupping", label: "Cupping" },
] as const;

export const DUBAI_AREAS = [
  "Dubai Marina",
  "JBR",
  "Palm Jumeirah",
  "Downtown Dubai",
  "Business Bay",
  "DIFC",
  "City Walk",
  "Jumeirah",
  "Umm Suqeim",
  "Media City",
  "Bluewaters",
  "Deira",
  "Festival City",
] as const;

// approximate centre coordinates for map view
export const AREA_COORDS: Record<string, [number, number]> = {
  "Dubai Marina": [25.0805, 55.1403],
  JBR: [25.0752, 55.1338],
  "Palm Jumeirah": [25.1124, 55.139],
  "Downtown Dubai": [25.1972, 55.2744],
  "Business Bay": [25.1851, 55.2666],
  DIFC: [25.2138, 55.2824],
  "City Walk": [25.2048, 55.2622],
  Jumeirah: [25.2191, 55.2531],
  "Umm Suqeim": [25.1564, 55.2046],
  "Media City": [25.0926, 55.1556],
  Bluewaters: [25.0792, 55.1206],
  Deira: [25.2697, 55.3094],
  "Festival City": [25.2222, 55.3522],
};

// reviews containing these terms are auto-held for admin moderation (spec 3.3.1)
export const REVIEW_FLAG_KEYWORDS = [
  "extra",
  "extras",
  "special service",
  "happy ending",
  "full service",
  "b2b",
  "nuru",
  "sensual",
  "erotic",
  "whatsapp me",
  "call me",
  "outside the app",
  "cash only",
];

export function shouldHoldReview(text: string): boolean {
  const lower = text.toLowerCase();
  return REVIEW_FLAG_KEYWORDS.some((k) => lower.includes(k));
}

export const REVIEW_TAGS = [
  "professional",
  "punctual",
  "friendly",
  "relaxing",
  "great pressure",
  "clean",
  "premium oils",
  "on time",
] as const;

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  expired: "Expired",
};

export const BOOKING_STATUS_COLOR: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-neutral-200 text-neutral-600",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-neutral-200 text-neutral-500",
};

export function serviceLabel(value: string) {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

export function formatAED(amount: number | string) {
  return `AED ${Number(amount).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}
