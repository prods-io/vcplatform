export interface SlideContent {
  slideNumber: number
  rawText: string
  wordCount: number
}

export type DimensionName =
  | 'problem'
  | 'solution'
  | 'marketSize'
  | 'businessModel'
  | 'traction'
  | 'team'
  | 'competition'
  | 'goToMarket'
  | 'financials'
  | 'ask'
  | 'storytelling'
  | 'designClarity'

export interface DimensionScore {
  key: DimensionName
  label: string
  score: number // 0-10
  feedback: string
}

export interface ExtractedMetrics {
  revenue?: string | null
  arr?: string | null
  growthRate?: string | null
  users?: string | null
  fundingAsk?: string | null
  burnRate?: string | null
  cac?: string | null
  ltv?: string | null
  teamSize?: string | null
  runway?: string | null
}

export interface SlideBreakdown {
  slideNumber: number
  classifiedType: string
  summary: string
}

export interface PriorityImprovement {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

export interface RuleCheckResult {
  warnings: string[]
  slideCount: number
  avgWordsPerSlide: number
  thinSlides: number[]
  hasBuzzwordOveruse: boolean
  hasContactInfo: boolean
  hasQuantitativeData: boolean
  missingSlideTypes: string[]
}

export interface AIAnalysisResponse {
  dimensions: DimensionScore[]
  strengths: string[]
  weaknesses: string[]
  redFlags: string[]
  priorityImprovements: PriorityImprovement[]
  extractedMetrics: ExtractedMetrics
  slideBreakdown: SlideBreakdown[]
  summary: string
  deckQualityScore: number // 0-100
  tractionScore: number // 0-100
  grade: string // A+ to F
}

export interface FullAnalysisResult extends AIAnalysisResponse {
  ruleChecks: RuleCheckResult
}
