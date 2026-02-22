import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeDeck } from '@/lib/ai/analyze-deck'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to analyze pitch decks.' },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const startupId = formData.get('startup_id') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Upload a PDF or PPTX file.' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.pptx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and PPTX files are supported.' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const storagePath = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('pitch-decks')
      .upload(storagePath, buffer, {
        contentType: file.type,
      })

    let fileUrl: string | null = null
    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('pitch-decks').getPublicUrl(storagePath)
      fileUrl = publicUrl
    }

    // Run analysis
    const analysis = await analyzeDeck(buffer, file.name)

    // Save to database
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('pitch_deck_analyses')
      .insert({
        user_id: user.id,
        startup_id: startupId || null,
        file_name: file.name,
        file_url: fileUrl,
        score: analysis.deckQualityScore,
        vc_readiness: analysis.grade,
        strengths: analysis.strengths,
        improvements: analysis.weaknesses,
        analysis_data: analysis as unknown as Record<string, unknown>,
        analyzed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save pitch deck analysis:', insertError)
      return NextResponse.json({
        analysis,
        saved: false,
      })
    }

    return NextResponse.json({
      id: savedAnalysis.id,
      analysis,
      saved: true,
    })
  } catch (error) {
    console.error('Pitch deck analysis error:', error)

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'

    return NextResponse.json(
      { error: `Failed to analyze pitch deck: ${message}` },
      { status: 500 }
    )
  }
}
