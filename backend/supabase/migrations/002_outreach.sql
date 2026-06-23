-- Migration 002: outreach targets, drafts, and nudges

CREATE TABLE IF NOT EXISTS outreach_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_linkedin_url TEXT,
  target_name TEXT,
  target_title TEXT,
  target_linkedin_url TEXT,
  target_email TEXT,
  email_confidence TEXT CHECK (
    email_confidence IS NULL OR email_confidence IN ('high', 'medium', 'low')
  ),
  email_pattern_used TEXT,
  is_mutual_connection BOOLEAN DEFAULT FALSE,
  mutual_connection_name TEXT,
  mutual_connection_title TEXT,
  scrape_source TEXT CHECK (
    scrape_source IS NULL OR scrape_source IN ('linkedin_search', 'company_page', 'manual')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outreach_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  outreach_target_id UUID REFERENCES outreach_targets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL CHECK (
    draft_type IN ('cold_email', 'linkedin_dm', 'referral_request', 'follow_up')
  ),
  subject_line TEXT,
  body TEXT NOT NULL,
  tone TEXT CHECK (
    tone IS NULL OR tone IN ('professional', 'casual', 'direct')
  ),
  version INTEGER DEFAULT 1,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  user_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL CHECK (
    nudge_type IN (
      'send_follow_up',
      'request_referral',
      'prep_interview',
      'check_status',
      'send_thank_you',
      'negotiate_offer',
      'ghosted_alert',
      'send_outreach'
    )
  ),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_label TEXT,
  action_type TEXT,
  action_payload JSONB,
  is_dismissed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_targets_app_id ON outreach_targets(application_id);
CREATE INDEX IF NOT EXISTS idx_outreach_targets_user_id ON outreach_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_app_id ON outreach_drafts(application_id);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_user_id ON outreach_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_nudges_user_id_dismissed ON nudges(user_id, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_nudges_app_id ON nudges(application_id);
CREATE INDEX IF NOT EXISTS idx_nudges_due_date ON nudges(due_date);

ALTER TABLE outreach_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outreach targets"
  ON outreach_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outreach targets"
  ON outreach_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outreach targets"
  ON outreach_targets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own outreach drafts"
  ON outreach_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outreach drafts"
  ON outreach_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outreach drafts"
  ON outreach_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own nudges"
  ON nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nudges"
  ON nudges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nudges"
  ON nudges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
