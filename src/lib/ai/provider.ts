import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIProvider {
  analyze(systemPrompt: string, userContent: string): Promise<string>
}

class GeminiProvider implements AIProvider {
  private model: string

  constructor(model?: string) {
    this.model = model || process.env.AI_MODEL || 'gemini-2.5-flash'
  }

  async analyze(systemPrompt: string, userContent: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent(userContent)
    const response = result.response
    return response.text()
  }
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'gemini'

  switch (provider) {
    case 'gemini':
      return new GeminiProvider()
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}
