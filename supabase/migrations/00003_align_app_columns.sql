-- ============================================================================
-- Align profiles and startups tables with application code
-- ============================================================================

-- profiles: add missing columns used by onboarding and profile pages
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- startups: rename user_id -> founder_id (matches app code)
ALTER TABLE startups RENAME COLUMN user_id TO founder_id;

DROP INDEX IF EXISTS idx_startups_user_id;
CREATE INDEX IF NOT EXISTS idx_startups_founder_id ON startups(founder_id);

-- startups: one startup per founder (required for upsert onConflict: 'founder_id')
ALTER TABLE startups ADD CONSTRAINT startups_founder_id_unique UNIQUE (founder_id);

-- startups: add missing columns used by onboarding
ALTER TABLE startups ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS location_country TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT;

-- startups: rename funding_goal -> funding_target (matches app code)
ALTER TABLE startups RENAME COLUMN funding_goal TO funding_target;

-- startups: make geography and stage nullable
-- (onboarding code sends null for these when not filled in)
ALTER TABLE startups ALTER COLUMN geography DROP NOT NULL;
ALTER TABLE startups ALTER COLUMN stage DROP NOT NULL;

-- Update RLS policies that referenced user_id
DROP POLICY IF EXISTS "Users can view their own startups" ON startups;
DROP POLICY IF EXISTS "Users can insert their own startups" ON startups;
DROP POLICY IF EXISTS "Users can update their own startups" ON startups;
DROP POLICY IF EXISTS "Users can delete their own startups" ON startups;
DROP POLICY IF EXISTS "Admins can view all startups" ON startups;

CREATE POLICY "Users can view their own startups"
  ON startups FOR SELECT
  USING (auth.uid() = founder_id);

CREATE POLICY "Users can insert their own startups"
  ON startups FOR INSERT
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Users can update their own startups"
  ON startups FOR UPDATE
  USING (auth.uid() = founder_id)
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Users can delete their own startups"
  ON startups FOR DELETE
  USING (auth.uid() = founder_id);

CREATE POLICY "Admins can view all startups"
  ON startups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
