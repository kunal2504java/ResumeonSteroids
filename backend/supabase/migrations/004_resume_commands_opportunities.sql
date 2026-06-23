-- Migration 004: resume command delivery and hybrid opportunity feed

CREATE TABLE IF NOT EXISTS resume_command_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id TEXT,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  opportunity_id UUID,
  instruction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'processing', 'completed', 'failed')
  ),
  output_resume JSONB,
  changes JSONB DEFAULT '[]',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES resume_command_runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'whatsapp')),
  recipient TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  filename TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'sent', 'failed', 'skipped')
  ),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  location TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  raw_text TEXT,
  normalized_jd TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'saved', 'applied', 'archived')
  ),
  provider_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_source_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES job_opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  raw_payload JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outreach_targets
  ADD COLUMN IF NOT EXISTS provider_source TEXT,
  ADD COLUMN IF NOT EXISTS provider_confidence TEXT CHECK (
    provider_confidence IS NULL OR provider_confidence IN ('high', 'medium', 'low')
  ),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS raw_provider_payload JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_resume_command_runs_user_id ON resume_command_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_command_runs_status ON resume_command_runs(status);
CREATE INDEX IF NOT EXISTS idx_resume_deliveries_run_id ON resume_deliveries(run_id);
CREATE INDEX IF NOT EXISTS idx_resume_deliveries_user_id ON resume_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_user_id ON job_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_status ON job_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_job_source_events_opp_id ON job_source_events(opportunity_id);

CREATE TRIGGER resume_command_runs_updated_at
  BEFORE UPDATE ON resume_command_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER job_opportunities_updated_at
  BEFORE UPDATE ON job_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE resume_command_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_source_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resume command runs"
  ON resume_command_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume command runs"
  ON resume_command_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume command runs"
  ON resume_command_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own resume deliveries"
  ON resume_deliveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume deliveries"
  ON resume_deliveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own job opportunities"
  ON job_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job opportunities"
  ON job_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job opportunities"
  ON job_opportunities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own job source events"
  ON job_source_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job source events"
  ON job_source_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
