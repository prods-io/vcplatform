ALTER TABLE pitch_deck_analyses ADD COLUMN IF NOT EXISTS analysis_data JSONB;
CREATE INDEX IF NOT EXISTS idx_pitch_deck_analyses_data ON pitch_deck_analyses USING GIN (analysis_data);
