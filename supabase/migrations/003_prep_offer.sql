-- Migration 003: interview prep and offer negotiation

CREATE TABLE IF NOT EXISTS interview_prep (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_questions JSONB DEFAULT '[]',
  resume_questions JSONB DEFAULT '[]',
  star_answers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offer_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_salary INTEGER,
  bonus INTEGER,
  equity_value INTEGER,
  joining_bonus INTEGER,
  total_comp INTEGER,
  currency TEXT DEFAULT 'INR',
  market_data JSONB,
  negotiation_draft TEXT,
  offer_vs_market TEXT CHECK (
    offer_vs_market IS NULL OR offer_vs_market IN ('below', 'at', 'above')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_prep_app_id ON interview_prep(application_id);
CREATE INDEX IF NOT EXISTS idx_offer_details_app_id ON offer_details(application_id);

CREATE TRIGGER interview_prep_updated_at
  BEFORE UPDATE ON interview_prep
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE interview_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview prep"
  ON interview_prep FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview prep"
  ON interview_prep FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview prep"
  ON interview_prep FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own offer details"
  ON offer_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offer details"
  ON offer_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offer details"
  ON offer_details FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
