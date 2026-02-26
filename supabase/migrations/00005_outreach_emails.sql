-- ============================================================================
-- Outreach Emails Table
-- Tracks in-platform emails sent from founders to VC firms
-- ============================================================================

CREATE TABLE IF NOT EXISTS outreach_emails (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vc_firm_id       UUID        NOT NULL REFERENCES vc_firms(id) ON DELETE CASCADE,
  to_email         TEXT        NOT NULL,
  to_name          TEXT,
  subject          TEXT        NOT NULL,
  body             TEXT        NOT NULL,
  -- status: sending | sent | delivered | opened | clicked | bounced | failed
  status           TEXT        NOT NULL DEFAULT 'sending',
  resend_email_id  TEXT,       -- Resend's email ID, used for webhook lookup
  sent_at          TIMESTAMPTZ DEFAULT NOW(),
  delivered_at     TIMESTAMPTZ,
  opened_at        TIMESTAMPTZ,
  clicked_at       TIMESTAMPTZ,
  bounced_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_emails_user_id        ON outreach_emails(user_id);
CREATE INDEX idx_outreach_emails_vc_firm_id     ON outreach_emails(vc_firm_id);
CREATE INDEX idx_outreach_emails_resend_id      ON outreach_emails(resend_email_id);
CREATE INDEX idx_outreach_emails_sent_at        ON outreach_emails(sent_at DESC);
CREATE INDEX idx_outreach_emails_status         ON outreach_emails(status);

-- Auto-update updated_at
CREATE TRIGGER update_outreach_emails_updated_at
  BEFORE UPDATE ON outreach_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outreach emails"
  ON outreach_emails FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own outreach emails"
  ON outreach_emails FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own outreach emails"
  ON outreach_emails FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all outreach emails"
  ON outreach_emails FOR SELECT
  USING (public.is_admin());
