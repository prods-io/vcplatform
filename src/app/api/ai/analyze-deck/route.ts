import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeDeck } from '@/lib/ai/analyze-deck'

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

    const body = await request.json()
    const { text, file_name, file_url, startup_id } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "text" field. Provide the pitch deck text content.' },
        { status: 400 }
      )
    }

    // Run AI analysis
    const analysis = await analyzeDeck(text.trim())

    // Save analysis to the database
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('pitch_deck_analyses')
      .insert({
        user_id: user.id,
        startup_id: startup_id || null,
        file_name: file_name || 'pitch-deck.pdf',
        file_url: file_url || null,
        extracted_text: text.trim(),
        score: analysis.score,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        missing_sections: analysis.missing_sections,
        suggestions: analysis.suggestions,
        vc_readiness: analysis.vc_readiness,
        analyzed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save pitch deck analysis:', insertError)
      return NextResponse.json({
        ...analysis,
        overall_score: analysis.score,
        file_name: file_name || 'pitch-deck.pdf',
        saved: false,
      })
    }

    return NextResponse.json({
      ...savedAnalysis,
      overall_score: analysis.score,
      saved: true,
    })
  } catch (error) {
    console.error('Pitch deck analysis error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body.' },
        { status: 400 }
      )
    }

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'

    return NextResponse.json(
      { error: `Failed to analyze pitch deck: ${message}` },
      { status: 500 }
    )
  }
}
