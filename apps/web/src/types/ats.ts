import type { Resume } from "@resumeai/shared";

export type ATSStatus = "pass" | "warn" | "fail";
export type ATSSeverity = "critical" | "major" | "minor";
export type ATSGrade = "A" | "B" | "C" | "D" | "F";
export type ATSCategory = "parsing" | "keywords" | "formatting" | "content";

export interface ATSRuleResult {
  rule_id: string;
  rule_name: string;
  category: ATSCategory;
  status: ATSStatus;
  score_impact: number;
  message: string;
  fix: string;
  affected_section: string;
  severity: ATSSeverity;
}

export interface PlatformResult {
  compatible: boolean;
  blocking_rules: string[];
  score: number;
  description?: string;
  market_share?: string;
}

export interface KeywordCoverage {
  location_weighted_score: number;
  keywords_in_experience: string[];
  keywords_in_summary: string[];
  keywords_in_skills: string[];
  keywords_missing: string[];
}

export interface ATSReport {
  total_score: number;
  grade: ATSGrade;
  rule_results: ATSRuleResult[];
  critical_failures: ATSRuleResult[];
  keyword_coverage: KeywordCoverage;
  parser_compatibility: Record<string, PlatformResult>;
  summary: string;
}

export interface ATSRuleInfo {
  id: string;
  name: string;
  category: ATSCategory;
  severity: ATSSeverity;
  description: string;
  why_it_matters: string;
  how_to_fix: string;
}

export interface ATSSimulationResponse extends ATSReport {
  run_id: string;
}

export interface ATSFixResponse {
  auto_fixed: boolean;
  manual_instruction: string | null;
  report?: ATSReport;
  assembled_resume?: Resume;
}
