-- Align vc_firms columns with TypeScript types
ALTER TABLE vc_firms RENAME COLUMN linkedin TO linkedin_url;
ALTER TABLE vc_firms RENAME COLUMN twitter TO twitter_url;
ALTER TABLE vc_firms RENAME COLUMN aum TO fund_size;
ALTER TABLE vc_firms RENAME COLUMN stages TO investment_stages;
ALTER TABLE vc_firms RENAME COLUMN contact_email TO email;
ALTER TABLE vc_firms RENAME COLUMN is_verified TO is_active;

-- Change fund_size from BIGINT to TEXT (stores values like "$500M")
ALTER TABLE vc_firms ALTER COLUMN fund_size TYPE TEXT USING fund_size::TEXT;

-- Add missing columns
ALTER TABLE vc_firms ADD COLUMN IF NOT EXISTS crunchbase_url TEXT;
ALTER TABLE vc_firms ADD COLUMN IF NOT EXISTS data_quality_score INTEGER;

-- Drop columns not in the TypeScript types (optional, can keep if desired)
-- ALTER TABLE vc_firms DROP COLUMN IF EXISTS notable_portfolio;
-- ALTER TABLE vc_firms DROP COLUMN IF EXISTS application_link;

-- Update indexes that referenced old column names
DROP INDEX IF EXISTS idx_vc_firms_stages;
DROP INDEX IF EXISTS idx_vc_firms_is_verified;
CREATE INDEX idx_vc_firms_investment_stages ON vc_firms USING GIN(investment_stages);
CREATE INDEX idx_vc_firms_is_active ON vc_firms(is_active);

-- Align vc_partners columns
ALTER TABLE vc_partners RENAME COLUMN linkedin TO linkedin_url;
ALTER TABLE vc_partners RENAME COLUMN twitter TO twitter_url;
