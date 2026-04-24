-- Migration 001: application tracker foundation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_run_id TEXT,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  jd_url TEXT,
  jd_raw_text TEXT,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (
    status IN (
      'saved',
      'applied',
      'outreach_sent',
      'screen_scheduled',
      'interviewing',
      'offer',
      'rejected',
      'withdrawn',
      'ghosted'
    )
  ),
  applied_at TIMESTAMPTZ,
  source TEXT CHECK (
    source IS NULL OR source IN (
      'linkedin',
      'naukri',
      'company_site',
      'referral',
      'other'
    )
  ),
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT,
  is_remote BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'applied',
      'email_sent',
      'dm_sent',
      'referral_sent',
      'replied',
      'screen_scheduled',
      'interview_scheduled',
      'offer_received',
      'rejected',
      'status_changed',
      'note_added'
    )
  ),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON applications(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_events_app_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_application_events_user_id ON application_events(user_id);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own application events"
  ON application_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application events"
  ON application_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
