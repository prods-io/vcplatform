export const SECTORS = [
  { value: "fintech", label: "Fintech" },
  { value: "saas", label: "SaaS" },
  { value: "healthtech", label: "Healthtech" },
  { value: "edtech", label: "Edtech" },
  { value: "deeptech", label: "Deeptech" },
  { value: "cleantech", label: "Cleantech" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "gaming", label: "Gaming" },
  { value: "media", label: "Media" },
  { value: "enterprise", label: "Enterprise" },
  { value: "consumer", label: "Consumer" },
  { value: "logistics", label: "Logistics" },
  { value: "agritech", label: "Agritech" },
  { value: "proptech", label: "Proptech" },
  { value: "insurtech", label: "Insurtech" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "ai_ml", label: "AI / ML" },
  { value: "blockchain", label: "Blockchain" },
  { value: "biotech", label: "Biotech" },
  { value: "foodtech", label: "Foodtech" },
] as const

export const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b_plus", label: "Series B+" },
] as const

export const GEOGRAPHIES = [
  { value: "india", label: "India" },
  { value: "us", label: "United States" },
  { value: "europe", label: "Europe" },
  { value: "southeast_asia", label: "Southeast Asia" },
  { value: "middle_east", label: "Middle East" },
  { value: "africa", label: "Africa" },
  { value: "latam", label: "Latin America" },
  { value: "global", label: "Global" },
] as const

export const VC_TYPES = [
  { value: "vc", label: "Venture Capital" },
  { value: "angel", label: "Angel Investor" },
  { value: "incubator", label: "Incubator" },
  { value: "accelerator", label: "Accelerator" },
  { value: "grant", label: "Grant" },
] as const

export const TEAM_SIZES = [
  { value: "1-5", label: "1-5 Members" },
  { value: "6-15", label: "6-15 Members" },
  { value: "16-50", label: "16-50 Members" },
  { value: "50+", label: "50+ Members" },
] as const

export const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "contacted", label: "Contacted" },
  { value: "in_conversation", label: "In Conversation" },
  { value: "passed", label: "Passed" },
] as const

export type SectorValue = (typeof SECTORS)[number]["value"]
export type StageValue = (typeof STAGES)[number]["value"]
export type GeographyValue = (typeof GEOGRAPHIES)[number]["value"]
export type VCTypeValue = (typeof VC_TYPES)[number]["value"]
export type TeamSizeValue = (typeof TEAM_SIZES)[number]["value"]
export type StatusValue = (typeof STATUS_OPTIONS)[number]["value"]
