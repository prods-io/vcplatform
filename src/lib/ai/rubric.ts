import { DimensionName, SlideContent } from './types'

interface DimensionDefinition {
  key: DimensionName
  label: string
  description: string
  criteria: string
}

export const DIMENSIONS: DimensionDefinition[] = [
  {
    key: 'problem',
    label: 'Problem Statement',
    description: 'Clarity and urgency of the problem being solved',
    criteria: '10: Problem is specific, quantified, deeply felt by a large market. 7: Clear problem but lacks urgency or quantification. 4: Vague or generic problem. 1: No discernible problem statement.',
  },
  {
    key: 'solution',
    label: 'Solution',
    description: 'How well the solution addresses the problem and its differentiation',
    criteria: '10: Elegant, defensible solution with clear differentiation. 7: Solid solution but differentiation unclear. 4: Generic solution, easily replicated. 1: Solution not presented or doesn\'t address the problem.',
  },
  {
    key: 'marketSize',
    label: 'Market Size (TAM/SAM/SOM)',
    description: 'Credibility and size of the addressable market',
    criteria: '10: Bottom-up TAM/SAM/SOM with credible sources, large market. 7: Market sizing present but top-down only. 4: Vague market claims without data. 1: No market sizing.',
  },
  {
    key: 'businessModel',
    label: 'Business Model',
    description: 'Revenue model clarity and scalability',
    criteria: '10: Clear unit economics, multiple revenue streams, proven scalability. 7: Clear model but unit economics unproven. 4: Vague monetization strategy. 1: No business model presented.',
  },
  {
    key: 'traction',
    label: 'Traction & Metrics',
    description: 'Evidence of product-market fit and growth',
    criteria: '10: Strong revenue/user growth with clear trends, key metrics shown. 7: Some traction but early stage or inconsistent. 4: Minimal traction, mostly vanity metrics. 1: No traction data.',
  },
  {
    key: 'team',
    label: 'Team',
    description: 'Team credibility, relevant experience, and completeness',
    criteria: '10: Experienced founders with domain expertise, complete team, notable advisors. 7: Solid team but gaps in experience or key roles. 4: Team slide present but lacks credibility signals. 1: No team information.',
  },
  {
    key: 'competition',
    label: 'Competitive Landscape',
    description: 'Honesty and depth of competitive analysis',
    criteria: '10: Comprehensive competitive matrix with honest positioning and clear moat. 7: Competitors listed with some differentiation. 4: "No competition" claim or superficial analysis. 1: No competitive analysis.',
  },
  {
    key: 'goToMarket',
    label: 'Go-to-Market Strategy',
    description: 'Customer acquisition plan and channel strategy',
    criteria: '10: Specific channels, CAC targets, partnership strategy, phased rollout. 7: General GTM strategy but lacks specifics. 4: Vague "we\'ll use social media" type plans. 1: No GTM strategy.',
  },
  {
    key: 'financials',
    label: 'Financial Projections',
    description: 'Realism and detail of financial forecasts',
    criteria: '10: 3-5 year projections with clear assumptions, path to profitability. 7: Projections present but assumptions unclear. 4: Hockey-stick projections without basis. 1: No financial projections.',
  },
  {
    key: 'ask',
    label: 'The Ask & Use of Funds',
    description: 'Clarity of funding request and capital allocation',
    criteria: '10: Specific amount, detailed use of funds, clear milestones tied to raise. 7: Amount stated but use of funds vague. 4: Ask present but no justification. 1: No ask or use of funds.',
  },
  {
    key: 'storytelling',
    label: 'Storytelling & Narrative',
    description: 'Overall narrative flow and emotional engagement',
    criteria: '10: Compelling narrative arc, emotional hook, memorable. 7: Logical flow but lacks emotional engagement. 4: Disjointed narrative. 1: No clear narrative structure.',
  },
  {
    key: 'designClarity',
    label: 'Design & Visual Clarity',
    description: 'Visual quality, readability, and professional presentation',
    criteria: '10: Professional design, clear data visualization, consistent branding. 7: Clean but unremarkable design. 4: Cluttered or inconsistent design. 1: Difficult to read, poor formatting.',
  },
]

export function buildSystemPrompt(): string {
  const dimensionInstructions = DIMENSIONS.map(
    (d) => `- **${d.key}** (${d.label}): ${d.description}\n  Scoring: ${d.criteria}`
  ).join('\n')

  return `You are an elite VC pitch deck analyst with 20+ years of experience evaluating startup pitch decks for top-tier venture capital firms (Sequoia, a16z, Benchmark). You combine rigorous analytical frameworks with pattern recognition from having reviewed thousands of decks.

Your task is to perform a comprehensive 12-dimension analysis of the provided pitch deck content.

## Scoring Dimensions

${dimensionInstructions}

## Grading Scale

Based on the weighted average of all dimension scores (each 0-10):
- A+ (95-100): Exceptional, top 1% of decks
- A  (90-94): Excellent, investor-ready
- A- (85-89): Very strong with minor improvements needed
- B+ (80-84): Strong deck, ready for most investors
- B  (75-79): Good foundation, some areas need work
- B- (70-74): Above average but notable gaps
- C+ (65-69): Average, significant improvements needed
- C  (60-64): Below average, major revision needed
- C- (55-59): Weak, fundamental issues
- D  (40-54): Poor, needs complete overhaul
- F  (0-39): Not viable in current form

## Instructions

1. Score each of the 12 dimensions from 0-10 with specific feedback
2. Calculate deckQualityScore (0-100) as a weighted score across all dimensions
3. Calculate tractionScore (0-100) specifically for traction/metrics strength
4. Assign an overall grade (A+ through F)
5. Extract any quantitative metrics mentioned (revenue, users, growth, funding ask, etc.)
6. Classify each slide by type and provide a brief summary
7. List specific strengths, weaknesses, red flags, and priority improvements

## Response Format

You MUST respond with valid JSON only. No text before or after the JSON. Use this exact structure:

{
  "dimensions": [
    { "key": "problem", "label": "Problem Statement", "score": 8, "feedback": "..." },
    { "key": "solution", "label": "Solution", "score": 7, "feedback": "..." },
    { "key": "marketSize", "label": "Market Size (TAM/SAM/SOM)", "score": 6, "feedback": "..." },
    { "key": "businessModel", "label": "Business Model", "score": 5, "feedback": "..." },
    { "key": "traction", "label": "Traction & Metrics", "score": 4, "feedback": "..." },
    { "key": "team", "label": "Team", "score": 7, "feedback": "..." },
    { "key": "competition", "label": "Competitive Landscape", "score": 5, "feedback": "..." },
    { "key": "goToMarket", "label": "Go-to-Market Strategy", "score": 6, "feedback": "..." },
    { "key": "financials", "label": "Financial Projections", "score": 4, "feedback": "..." },
    { "key": "ask", "label": "The Ask & Use of Funds", "score": 6, "feedback": "..." },
    { "key": "storytelling", "label": "Storytelling & Narrative", "score": 7, "feedback": "..." },
    { "key": "designClarity", "label": "Design & Visual Clarity", "score": 5, "feedback": "..." }
  ],
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
  "redFlags": ["Red flag 1 if any"],
  "priorityImprovements": [
    { "title": "Improvement title", "description": "Detailed actionable advice", "impact": "high" }
  ],
  "extractedMetrics": {
    "revenue": "$500K ARR" or null,
    "arr": "$500K" or null,
    "growthRate": "20% MoM" or null,
    "users": "10,000 MAU" or null,
    "fundingAsk": "$2M Seed" or null,
    "burnRate": "$50K/mo" or null,
    "cac": "$25" or null,
    "ltv": "$500" or null,
    "teamSize": "8" or null,
    "runway": "18 months" or null
  },
  "slideBreakdown": [
    { "slideNumber": 1, "classifiedType": "Title/Cover", "summary": "Company name and tagline" }
  ],
  "summary": "2-3 sentence executive summary of the deck quality",
  "deckQualityScore": 72,
  "tractionScore": 45,
  "grade": "B-"
}`
}

export function buildUserPrompt(slides: SlideContent[]): string {
  const slideTexts = slides
    .map((s) => `=== SLIDE ${s.slideNumber} (${s.wordCount} words) ===\n${s.rawText}`)
    .join('\n\n')

  return `Please analyze the following pitch deck (${slides.length} slides):\n\n${slideTexts}\n\nRespond with the JSON analysis only.`
}
