import { SlideContent } from './types'

export async function parsePDF(buffer: Buffer): Promise<SlideContent[]> {
  // Import the lib directly to avoid pdf-parse's index.js test file read bug
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js')
  const data = await pdfParse(buffer)

  const text: string = data.text || ''
  if (!text.trim()) {
    return []
  }

  // Split by form feed character (page boundary) or double newlines as fallback
  let pages = text.split('\f').filter((p: string) => p.trim().length > 0)

  if (pages.length <= 1) {
    pages = text.split(/\n{3,}/).filter((p: string) => p.trim().length > 0)
  }

  return pages.map((pageText: string, idx: number) => {
    const cleaned = pageText.trim()
    const wordCount = cleaned.split(/\s+/).filter((w: string) => w.length > 0).length
    return {
      slideNumber: idx + 1,
      rawText: cleaned,
      wordCount,
    }
  })
}

export async function parsePPTX(buffer: Buffer): Promise<SlideContent[]> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  const slides: SlideContent[] = []

  // Find all slide XML files
  const slideFiles: string[] = []
  zip.forEach((relativePath) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/)
    if (match) {
      slideFiles.push(relativePath)
    }
  })

  // Sort by slide number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)/)![1])
    const numB = parseInt(b.match(/slide(\d+)/)![1])
    return numA - numB
  })

  for (let i = 0; i < slideFiles.length; i++) {
    const file = zip.file(slideFiles[i])
    if (!file) continue

    const xml = await file.async('text')

    // Extract text from <a:t> tags using regex
    const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || []
    const textParts = textMatches.map((m: string) =>
      m.replace(/<a:t>/, '').replace(/<\/a:t>/, '').trim()
    )

    const rawText = textParts.filter((t: string) => t.length > 0).join(' ')
    const wordCount = rawText.split(/\s+/).filter((w: string) => w.length > 0).length

    slides.push({
      slideNumber: i + 1,
      rawText: rawText || '(empty slide)',
      wordCount,
    })
  }

  return slides
}

export async function parseFile(buffer: Buffer, fileName: string): Promise<SlideContent[]> {
  const ext = fileName.toLowerCase().split('.').pop()

  switch (ext) {
    case 'pdf':
      return parsePDF(buffer)
    case 'pptx':
      return parsePPTX(buffer)
    default:
      throw new Error(`Unsupported file type: .${ext}. Only PDF and PPTX files are supported.`)
  }
}
