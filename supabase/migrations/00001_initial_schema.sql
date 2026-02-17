-- ============================================================================
-- VC Platform - Initial Database Schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Custom Types
-- ============================================================================

CREATE TYPE user_role AS ENUM ('founder', 'admin');
CREATE TYPE vc_status AS ENUM ('saved', 'contacted', 'in_conversation', 'passed');

-- ============================================================================
-- Updated-at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Profiles Table
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'founder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Startups Table
-- ============================================================================

CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  pitch TEXT,
  sector TEXT[] NOT NULL DEFAULT '{}',
  stage TEXT NOT NULL,
  geography TEXT NOT NULL,
  team_size TEXT,
  founded_year INTEGER,
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  funding_raised BIGINT,
  funding_goal BIGINT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_startups_user_id ON startups(user_id);
CREATE INDEX idx_startups_slug ON startups(slug);
CREATE INDEX idx_startups_stage ON startups(stage);
CREATE INDEX idx_startups_geography ON startups(geography);
CREATE INDEX idx_startups_sector ON startups USING GIN(sector);

CREATE TRIGGER update_startups_updated_at
  BEFORE UPDATE ON startups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VC Firms Table
-- ============================================================================

CREATE TABLE vc_firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL,
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  logo_url TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  aum BIGINT,
  sectors TEXT[] NOT NULL DEFAULT '{}',
  stages TEXT[] NOT NULL DEFAULT '{}',
  geographies TEXT[] NOT NULL DEFAULT '{}',
  check_size_min BIGINT,
  check_size_max BIGINT,
  portfolio_count INTEGER,
  notable_portfolio TEXT[],
  contact_email TEXT,
  application_link TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vc_firms_slug ON vc_firms(slug);
CREATE INDEX idx_vc_firms_type ON vc_firms(type);
CREATE INDEX idx_vc_firms_is_verified ON vc_firms(is_verified);
CREATE INDEX idx_vc_firms_sectors ON vc_firms USING GIN(sectors);
CREATE INDEX idx_vc_firms_stages ON vc_firms USING GIN(stages);
CREATE INDEX idx_vc_firms_geographies ON vc_firms USING GIN(geographies);
CREATE INDEX idx_vc_firms_check_size ON vc_firms(check_size_min, check_size_max);

CREATE TRIGGER update_vc_firms_updated_at
  BEFORE UPDATE ON vc_firms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VC Partners Table
-- ============================================================================

CREATE TABLE vc_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vc_firm_id UUID NOT NULL REFERENCES vc_firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin TEXT,
  twitter TEXT,
  avatar_url TEXT,
  bio TEXT,
  sectors_of_interest TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vc_partners_vc_firm_id ON vc_partners(vc_firm_id);

CREATE TRIGGER update_vc_partners_updated_at
  BEFORE UPDATE ON vc_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Saved VCs Table
-- ============================================================================

CREATE TABLE saved_vcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vc_firm_id UUID NOT NULL REFERENCES vc_firms(id) ON DELETE CASCADE,
  status vc_status NOT NULL DEFAULT 'saved',
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  response_received BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, vc_firm_id)
);

CREATE INDEX idx_saved_vcs_user_id ON saved_vcs(user_id);
CREATE INDEX idx_saved_vcs_vc_firm_id ON saved_vcs(vc_firm_id);
CREATE INDEX idx_saved_vcs_status ON saved_vcs(status);

CREATE TRIGGER update_saved_vcs_updated_at
  BEFORE UPDATE ON saved_vcs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Pitch Deck Analyses Table
-- ============================================================================

CREATE TABLE pitch_deck_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  extracted_text TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  strengths TEXT[],
  improvements TEXT[],
  missing_sections TEXT[],
  suggestions JSONB,
  vc_readiness TEXT,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pitch_deck_analyses_user_id ON pitch_deck_analyses(user_id);
CREATE INDEX idx_pitch_deck_analyses_startup_id ON pitch_deck_analyses(startup_id);

CREATE TRIGGER update_pitch_deck_analyses_updated_at
  BEFORE UPDATE ON pitch_deck_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Auto-create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Startups
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own startups"
  ON startups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own startups"
  ON startups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own startups"
  ON startups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own startups"
  ON startups FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all startups"
  ON startups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- VC Firms (publicly readable)
ALTER TABLE vc_firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VC firms are viewable by authenticated users"
  ON vc_firms FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert vc firms"
  ON vc_firms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update vc firms"
  ON vc_firms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete vc firms"
  ON vc_firms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- VC Partners (publicly readable)
ALTER TABLE vc_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VC partners are viewable by authenticated users"
  ON vc_partners FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert vc partners"
  ON vc_partners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update vc partners"
  ON vc_partners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete vc partners"
  ON vc_partners FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Saved VCs
ALTER TABLE saved_vcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved vcs"
  ON saved_vcs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved vcs"
  ON saved_vcs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved vcs"
  ON saved_vcs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved vcs"
  ON saved_vcs FOR DELETE
  USING (auth.uid() = user_id);

-- Pitch Deck Analyses
ALTER TABLE pitch_deck_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses"
  ON pitch_deck_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON pitch_deck_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON pitch_deck_analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON pitch_deck_analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analyses"
  ON pitch_deck_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
