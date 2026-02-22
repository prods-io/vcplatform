import { FullAnalysisResult, AIAnalysisResponse } from './types'
import { parseFile } from './pdf-parser'
import { runRuleChecks } from './rule-checks'
import { buildSystemPrompt, buildUserPrompt } from './rubric'
import { getAIProvider } from './provider'

function extractJSON(text: string): string {
  let cleaned = text.trim()

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
  }

  // Find the outermost JSON object
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No JSON object found in AI response')
  }

  return cleaned.substring(firstBrace, lastBrace + 1)
}

export async function analyzeDeck(
  fileBuffer: Buffer,
  fileName: string
): Promise<FullAnalysisResult> {
  // 1. Parse the file into slides
  const slides = await parseFile(fileBuffer, fileName)

  if (slides.length === 0) {
    throw new Error(
      'Could not extract any text from the file. The PDF may be image-based or empty.'
    )
  }

  // 2. Run deterministic rule checks
  const ruleChecks = runRuleChecks(slides)

  // 3. Build prompts
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(slides)

  // 4. Call AI provider
  const provider = getAIProvider()
  const rawResponse = await provider.analyze(systemPrompt, userPrompt)

  // 5. Parse JSON response
  const jsonString = extractJSON(rawResponse)
  const aiResult: AIAnalysisResponse = JSON.parse(jsonString)

  // 6. Validate and clamp scores
  aiResult.deckQualityScore = Math.max(0, Math.min(100, Math.round(aiResult.deckQualityScore)))
  aiResult.tractionScore = Math.max(0, Math.min(100, Math.round(aiResult.tractionScore)))

  for (const dim of aiResult.dimensions) {
    dim.score = Math.max(0, Math.min(10, Math.round(dim.score)))
  }

  // Ensure arrays exist
  aiResult.strengths = aiResult.strengths || []
  aiResult.weaknesses = aiResult.weaknesses || []
  aiResult.redFlags = aiResult.redFlags || []
  aiResult.priorityImprovements = aiResult.priorityImprovements || []
  aiResult.slideBreakdown = aiResult.slideBreakdown || []
  aiResult.extractedMetrics = aiResult.extractedMetrics || {}

  // Validate grade
  const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
  if (!validGrades.includes(aiResult.grade)) {
    const s = aiResult.deckQualityScore
    if (s >= 95) aiResult.grade = 'A+'
    else if (s >= 90) aiResult.grade = 'A'
    else if (s >= 85) aiResult.grade = 'A-'
    else if (s >= 80) aiResult.grade = 'B+'
    else if (s >= 75) aiResult.grade = 'B'
    else if (s >= 70) aiResult.grade = 'B-'
    else if (s >= 65) aiResult.grade = 'C+'
    else if (s >= 60) aiResult.grade = 'C'
    else if (s >= 55) aiResult.grade = 'C-'
    else if (s >= 40) aiResult.grade = 'D'
    else aiResult.grade = 'F'
  }

  // 7. Merge with rule checks
  return {
    ...aiResult,
    ruleChecks,
  }
}
