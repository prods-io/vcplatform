import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import seedData from '@/../data/seed-vcs.json'

// Use service role client for seeding - bypasses RLS
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization: check for admin API key or authenticated admin user
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.SEED_ADMIN_API_KEY

    let isAuthorized = false

    // Method 1: Check for admin API key in Authorization header
    if (adminApiKey && authHeader === `Bearer ${adminApiKey}`) {
      isAuthorized = true
    }

    // Method 2: Check for authenticated admin user via Supabase session
    if (!isAuthorized) {
      try {
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        )
        const supabase = await createServerClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Check if user has admin role in profiles or user_metadata
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (profile?.role === 'admin') {
            isAuthorized = true
          }

          // Fallback: check user metadata
          if (!isAuthorized && user.user_metadata?.role === 'admin') {
            isAuthorized = true
          }
        }
      } catch {
        // If Supabase server client fails, continue with unauthorized
      }
    }

    // In development, allow seeding without auth
    if (!isAuthorized && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required to seed the database.' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Validate seed data
    if (!Array.isArray(seedData) || seedData.length === 0) {
      return NextResponse.json(
        { error: 'Seed data is empty or invalid.' },
        { status: 500 }
      )
    }

    // Transform seed data to match the vc_firms table schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = (seedData as any[]).map((vc) => ({
      name: vc.name,
      slug: vc.slug,
      description: vc.description ?? null,
      website: vc.website ?? null,
      logo_url: vc.logo_url ?? null,
      type: vc.type ?? 'vc',
      investment_stages: vc.stages ?? vc.investment_stages ?? [],
      sectors: vc.sectors ?? [],
      geographies: vc.geographies ?? [],
      check_size_min: vc.check_size_min ?? null,
      check_size_max: vc.check_size_max ?? null,
      fund_size: vc.total_fund_size ?? vc.fund_size ?? null,
      portfolio_count: vc.portfolio_count ?? null,
      founded_year: vc.founded_year ?? null,
      headquarters: vc.headquarters ?? null,
      email: vc.contact_email ?? vc.email ?? null,
      linkedin_url: vc.linkedin_url ?? null,
      twitter_url: vc.twitter_url ?? null,
      crunchbase_url: vc.crunchbase_url ?? null,
      is_active: vc.is_active ?? true,
      data_quality_score: vc.data_quality_score ?? null,
    }))

    // Upsert in batches of 25 to avoid potential payload limits
    const BATCH_SIZE = 25
    let insertedCount = 0
    let updatedCount = 0
    const errors: Array<{ batch: number; error: string }> = []

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1

      const { data, error } = await supabase
        .from('vc_firms')
        .upsert(batch, {
          onConflict: 'slug',
          ignoreDuplicates: false,
        })
        .select('id')

      if (error) {
        console.error(`Seed batch ${batchNumber} error:`, error)
        errors.push({
          batch: batchNumber,
          error: error.message,
        })
      } else {
        insertedCount += data?.length || batch.length
      }
    }

    if (errors.length > 0 && insertedCount === 0) {
      return NextResponse.json(
        {
          error: 'Failed to seed any records.',
          details: errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedCount} VC firms.`,
      total_in_seed_file: seedData.length,
      inserted_or_updated: insertedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Seed endpoint error:', error)

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'

    return NextResponse.json(
      { error: `Seed operation failed: ${message}` },
      { status: 500 }
    )
  }
}
