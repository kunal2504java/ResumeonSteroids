-- Migration 005: daily job deck — global harvested pool + per-user swipes & preferences
--
-- job_opportunities (migration 004) stays PER-USER and becomes the "swiped right"
-- projection. This migration adds the GLOBAL pool the harvester writes once and every
-- student's deck reads from, plus the per-user swipe log and deck preferences.

-- ---------------------------------------------------------------------------
-- Global harvested pool. No user_id: written by the harvester via the service
-- role (which bypasses RLS), read by any authenticated student.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  -- canonical_url is the dedup key: source_url stripped of /apply, /application,
  -- ?source=, and other tracking junk. One row per real posting.
  canonical_url TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'serper' CHECK (
    source IN ('serper', 'ashby', 'greenhouse', 'lever', 'workday', 'career_page', 'manual')
  ),
  location TEXT,
  -- coarse bucket used for deck filtering: 'us', 'in', 'remote', 'other', ...
  region TEXT,
  employment_type TEXT,                 -- 'intern' | 'full_time' | 'contract' | null
  is_entry_level BOOLEAN NOT NULL DEFAULT TRUE,
  title_raw TEXT,                       -- the unparsed Serper result title
  snippet TEXT,                         -- Serper snippet (sometimes leaks location/type)
  normalized_jd TEXT,                   -- lazily filled on first swipe-right via extractJobPage
  posted_at TIMESTAMPTZ,                -- parsed from Serper's freshness date
  matched_role TEXT,                    -- which curated role query surfaced this
  harvest_query TEXT,                   -- the exact Serper query (debugging/provenance)
  provider_metadata JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Per-user swipe log. Drives "don't show what I've already seen" and links a
-- right-swipe to the job_opportunities row it materialized.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deck_swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  opportunity_id UUID REFERENCES job_opportunities(id) ON DELETE SET NULL,
  run_id UUID REFERENCES resume_command_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, posting_id)
);

-- ---------------------------------------------------------------------------
-- Per-user deck preferences. Drives which slice of the pool the student sees.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deck_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_roles TEXT[] NOT NULL DEFAULT '{}',
  locations TEXT[] NOT NULL DEFAULT '{}',
  remote_ok BOOLEAN NOT NULL DEFAULT TRUE,
  daily_cap INT NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_posted_at ON job_postings(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_region ON job_postings(region);
CREATE INDEX IF NOT EXISTS idx_job_postings_role ON job_postings(matched_role);
CREATE INDEX IF NOT EXISTS idx_job_postings_entry_level ON job_postings(is_entry_level);
CREATE INDEX IF NOT EXISTS idx_deck_swipes_user_id ON deck_swipes(user_id);

CREATE TRIGGER job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER deck_preferences_updated_at
  BEFORE UPDATE ON deck_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_preferences ENABLE ROW LEVEL SECURITY;

-- The pool is a shared read surface: any authenticated student can read it.
-- Writes happen only through the service role (harvester), which bypasses RLS,
-- so there is intentionally no INSERT/UPDATE policy for end users.
CREATE POLICY "Authenticated users can read job postings"
  ON job_postings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own swipes"
  ON deck_swipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipes"
  ON deck_swipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deck preferences"
  ON deck_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deck preferences"
  ON deck_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deck preferences"
  ON deck_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
