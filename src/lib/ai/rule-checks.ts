import { SlideContent, RuleCheckResult } from './types'

const BUZZWORDS = [
  'synergy', 'disrupt', 'revolutionary', 'game-changing', 'world-class',
  'best-in-class', 'paradigm', 'leverage', 'scalable', 'innovative',
  'cutting-edge', 'next-generation', 'bleeding-edge', 'first-mover',
  'unicorn', 'moonshot', 'pivot', 'ecosystem',
]

const CRITICAL_SLIDE_KEYWORDS: Record<string, string[]> = {
  'Problem': ['problem', 'pain', 'challenge', 'issue', 'gap'],
  'Solution': ['solution', 'product', 'platform', 'how it works', 'our approach'],
  'Market Size': ['market', 'tam', 'sam', 'som', 'addressable', 'billion', 'trillion'],
  'Business Model': ['business model', 'revenue', 'pricing', 'monetiz', 'unit economics'],
  'Traction': ['traction', 'metrics', 'growth', 'users', 'revenue', 'customers', 'mrr', 'arr'],
  'Team': ['team', 'founder', 'co-founder', 'ceo', 'cto', 'experience'],
  'Competition': ['compet', 'landscape', 'vs', 'alternative', 'differenti'],
  'Ask': ['ask', 'raise', 'funding', 'investment', 'use of funds', 'seeking', 'round'],
}

const CONTACT_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?\d[\d\s()-]{7,})|((https?:\/\/)?(www\.)?linkedin\.com)/i

const QUANT_REGEX = /(\$[\d,.]+[KMBkmb]?)|(\d+%)|(\d+[xX]\s)|(\d{1,3}(,\d{3})+)/

export function runRuleChecks(slides: SlideContent[]): RuleCheckResult {
  const warnings: string[] = []
  const slideCount = slides.length
  const totalWords = slides.reduce((sum, s) => sum + s.wordCount, 0)
  const avgWordsPerSlide = slideCount > 0 ? Math.round(totalWords / slideCount) : 0

  // Slide count check
  if (slideCount < 8) {
    warnings.push(`Deck has only ${slideCount} slides. Most successful decks have 10-15 slides.`)
  } else if (slideCount > 25) {
    warnings.push(`Deck has ${slideCount} slides. Consider trimming to under 20 for better engagement.`)
  }

  // Text density check
  if (avgWordsPerSlide > 150) {
    warnings.push(`Average of ${avgWordsPerSlide} words per slide is too high. Aim for under 100 words per slide for readability.`)
  }

  // Thin slides check
  const thinSlides: number[] = []
  for (const slide of slides) {
    if (slide.wordCount < 20 && slide.slideNumber > 1) {
      thinSlides.push(slide.slideNumber)
    }
  }
  if (thinSlides.length > 0) {
    warnings.push(`Slides ${thinSlides.join(', ')} have very little text content (<20 words). These may be image-heavy or empty.`)
  }

  // Buzzword detection
  const allText = slides.map((s) => s.rawText.toLowerCase()).join(' ')
  const foundBuzzwords = BUZZWORDS.filter((b) => allText.includes(b))
  const hasBuzzwordOveruse = foundBuzzwords.length >= 5
  if (hasBuzzwordOveruse) {
    warnings.push(`High buzzword density detected: "${foundBuzzwords.slice(0, 5).join('", "')}". Replace with specific, concrete language.`)
  }

  // Contact info check
  const hasContactInfo = CONTACT_REGEX.test(allText)
  if (!hasContactInfo) {
    warnings.push('No contact information detected. Include email or LinkedIn on the last slide.')
  }

  // Quantitative data check
  const hasQuantitativeData = QUANT_REGEX.test(allText)
  if (!hasQuantitativeData) {
    warnings.push('No quantitative data (numbers, percentages, dollar amounts) detected. VCs expect data-driven decks.')
  }

  // Missing critical slide types
  const missingSlideTypes: string[] = []
  for (const [slideType, keywords] of Object.entries(CRITICAL_SLIDE_KEYWORDS)) {
    const found = keywords.some((kw) => allText.includes(kw.toLowerCase()))
    if (!found) {
      missingSlideTypes.push(slideType)
    }
  }
  if (missingSlideTypes.length > 0) {
    warnings.push(`Potentially missing sections: ${missingSlideTypes.join(', ')}. These are expected in most investor decks.`)
  }

  return {
    warnings,
    slideCount,
    avgWordsPerSlide,
    thinSlides,
    hasBuzzwordOveruse,
    hasContactInfo,
    hasQuantitativeData,
    missingSlideTypes,
  }
}
