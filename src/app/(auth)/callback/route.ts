import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. No code provided.')}`
    );
  }

  try {
    const supabase = await createClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Auth callback exchange error:', exchangeError.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth callback user error:', userError?.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Could not retrieve user information.')}`
      );
    }

    // Check if the user has completed onboarding
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = row not found, which means new user
      console.error('Auth callback profile error:', profileError.message);
    }

    // New user or onboarding not completed
    if (!profile || !profile.onboarding_completed) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error('Auth callback unexpected error:', error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('An unexpected error occurred.')}`
    );
  }
}
