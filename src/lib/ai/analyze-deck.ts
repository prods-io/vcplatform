import Anthropic from "@anthropic-ai/sdk"

export interface DeckAnalysisResult {
  score: number
  strengths: string[]
  improvements: string[]
  missing_sections: string[]
  suggestions: Record<string, string>
  vc_readiness: string
}

const SYSTEM_PROMPT = `You are an expert VC pitch deck analyst with decades of experience evaluating startup pitch decks for top-tier venture capital firms. Your role is to provide thorough, actionable, and honest feedback on pitch decks.

Analyze the provided pitch deck content and return a JSON response with the following structure:

{
  "score": <number 0-100>,
  "strengths": [<list of specific strengths>],
  "improvements": [<list of specific areas to improve>],
  "missing_sections": [<list of important sections that are missing>],
  "suggestions": {
    "<section_name>": "<specific actionable suggestion>"
  },
  "vc_readiness": "<one of: 'Not Ready', 'Needs Work', 'Almost Ready', 'Ready', 'Excellent'>"
}

Scoring guidelines:
- 0-20: Fundamentally incomplete, missing most key sections
- 21-40: Has basic information but significant gaps in storytelling and data
- 41-60: Decent foundation but needs refinement in key areas
- 61-80: Strong deck with minor areas for improvement
- 81-100: Exceptional, investor-ready deck

Key sections to evaluate:
1. Problem Statement - Is the problem clearly defined and compelling?
2. Solution - Is the solution clearly articulated and differentiated?
3. Market Size (TAM/SAM/SOM) - Are market numbers credible and well-sourced?
4. Business Model - Is the revenue model clear and scalable?
5. Traction - Are there metrics, users, revenue, or partnerships?
6. Team - Does the team have relevant experience and credibility?
7. Competition - Is the competitive landscape honestly assessed?
8. Go-to-Market Strategy - Is there a clear plan to acquire customers?
9. Financials - Are projections reasonable and well-structured?
10. Ask - Is the funding ask clear with planned use of funds?

Always respond with valid JSON only. No additional text outside the JSON.`

export async function analyzeDeck(
  textContent: string
): Promise<DeckAnalysisResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Please analyze the following pitch deck content and provide your structured assessment:\n\n---\n\n${textContent}\n\n---\n\nRespond with the JSON analysis only.`,
      },
    ],
    system: SYSTEM_PROMPT,
  })

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : ""

  // Extract JSON from the response, handling potential markdown code blocks
  let jsonString = responseText.trim()
  if (jsonString.startsWith("```")) {
    jsonString = jsonString
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
  }

  const analysis: DeckAnalysisResult = JSON.parse(jsonString)

  // Validate and clamp score
  analysis.score = Math.max(0, Math.min(100, Math.round(analysis.score)))

  // Ensure arrays exist
  analysis.strengths = analysis.strengths || []
  analysis.improvements = analysis.improvements || []
  analysis.missing_sections = analysis.missing_sections || []
  analysis.suggestions = analysis.suggestions || {}

  // Validate vc_readiness
  const validReadiness = [
    "Not Ready",
    "Needs Work",
    "Almost Ready",
    "Ready",
    "Excellent",
  ]
  if (!validReadiness.includes(analysis.vc_readiness)) {
    if (analysis.score < 20) analysis.vc_readiness = "Not Ready"
    else if (analysis.score < 40) analysis.vc_readiness = "Needs Work"
    else if (analysis.score < 60) analysis.vc_readiness = "Almost Ready"
    else if (analysis.score < 80) analysis.vc_readiness = "Ready"
    else analysis.vc_readiness = "Excellent"
  }

  return analysis
}
