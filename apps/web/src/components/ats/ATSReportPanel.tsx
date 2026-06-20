"use client";

import { useEffect, useState } from "react";
import { ATSRuleDrawer } from "@/components/ats/ATSRuleDrawer";
import { ATSRuleRow } from "@/components/ats/ATSRuleRow";
import { ATSScoreGauge } from "@/components/ats/ATSScoreGauge";
import { CriticalFailureBanner } from "@/components/ats/CriticalFailureBanner";
import { KeywordCoverage } from "@/components/ats/KeywordCoverage";
import { PlatformCompatibility } from "@/components/ats/PlatformCompatibility";
import type { ATSCategory, ATSReport, ATSRuleResult } from "@/types/ats";

interface Props {
  report: ATSReport | null;
  loading: boolean;
  error: string | null;
  onFix: (ruleId: string) => Promise<void>;
  onHighlightSection?: (section: string | undefined) => void;
  onRequestAnalysis?: () => void;
}

const CATEGORY_LABELS: Record<ATSCategory, string> = {
  parsing: "Parsing",
  keywords: "Keywords",
  formatting: "Formatting",
  content: "Content",
};

const STATUS_ORDER: Record<ATSRuleResult["status"], number> = {
  fail: 0,
  warn: 1,
  pass: 2,
};

function normalizeAffectedSection(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "experience") return "experience";
  if (normalized === "projects") return "projects";
  if (normalized === "education" || normalized === "dates") return "education";
  if (normalized === "skills" || normalized === "keywords") return "skills";
  if (normalized === "summary") return "summary";
  if (normalized === "header") return "personal";
  return undefined;
}

export function ATSReportPanel({
  report,
  loading,
  error,
  onFix,
  onHighlightSection,
  onRequestAnalysis,
}: Props) {
  const [selectedRule, setSelectedRule] = useState<ATSRuleResult | null>(null);

  useEffect(() => {
    onHighlightSection?.(normalizeAffectedSection(selectedRule?.affected_section || ""));
  }, [selectedRule, onHighlightSection]);

  const groupedRules = report
    ? report.rule_results.reduce<Record<ATSCategory, ATSRuleResult[]>>(
        (acc, rule) => {
          acc[rule.category] = [...(acc[rule.category] || []), rule].sort(
            (left, right) => STATUS_ORDER[left.status] - STATUS_ORDER[right.status],
          );
          return acc;
        },
        {
          parsing: [],
          keywords: [],
          formatting: [],
          content: [],
        },
      )
    : {
        parsing: [],
        keywords: [],
        formatting: [],
        content: [],
      };

  return (
    <div className="surf" style={{ height: "100%", overflow: "hidden", padding: 0 }}>
      <div className="h-full overflow-y-auto p-4 sm:p-5">
        <div className="space-y-4">
          {(report || loading) && (
            <ATSScoreGauge
              score={report?.total_score ?? 0}
              grade={report?.grade ?? "F"}
              loading={loading && !report}
            />
          )}

          {report && report.critical_failures.length > 0 ? (
            <CriticalFailureBanner
              failures={report.critical_failures}
              onFix={onFix}
              loading={loading}
            />
          ) : report ? (
            <div className="p-4 text-sm" style={{ border: "1.5px solid var(--hairline)", background: "var(--sheet)", color: "var(--ink-soft)" }}>
              Your resume is ATS-ready. No critical parser failures were detected.
            </div>
          ) : null}

          {report && (
            <>
              <PlatformCompatibility
                compatibility={report.parser_compatibility}
                ruleNames={report.rule_results.reduce<Record<string, string>>((acc, rule) => {
                  acc[rule.rule_id] = rule.rule_name;
                  return acc;
                }, {})}
              />
              <KeywordCoverage coverage={report.keyword_coverage} onFix={onFix} loading={loading} />

              {error && (
                <div className="p-4 text-sm" style={{ border: "1.5px solid var(--hairline)", background: "var(--sheet)", color: "var(--ink-soft)" }}>
                  {error}
                </div>
              )}

              {(["parsing", "keywords", "formatting", "content"] as ATSCategory[]).map(
                (category) => (
                  <details
                    key={category}
                    open={category === "parsing"}
                    className="p-4"
                    style={{ border: "1.5px solid var(--hairline)", background: "var(--paper-2)" }}
                  >
                    <summary className="cursor-pointer list-none" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                      {CATEGORY_LABELS[category]}
                    </summary>
                    <div className="mt-4 space-y-3">
                      {groupedRules[category].map((rule) => (
                        <ATSRuleRow
                          key={rule.rule_id}
                          rule={rule}
                          onClick={() => setSelectedRule(rule)}
                        />
                      ))}
                    </div>
                  </details>
                ),
              )}
            </>
          )}

          {!report && error && (
            <div className="p-4 text-sm" style={{ border: "1.5px solid var(--hairline)", background: "var(--sheet)", color: "var(--ink-soft)" }}>
              ATS report unavailable. Resume preview is still available. {error}
            </div>
          )}

          {!report && !loading && (
            <div className="p-6 text-sm" style={{ border: "2px dashed var(--ink-soft)", background: "var(--paper-2)", color: "var(--ink-soft)" }}>
              <span className="surf-label" style={{ marginBottom: 10 }}>run ATS simulation</span>
              <p style={{ lineHeight: 1.55 }}>
                Paste a job description to check parser compatibility, keyword placement,
                formatting, and content quality against this resume.
              </p>
              {onRequestAnalysis && (
                <button type="button" onClick={onRequestAnalysis} className="btn btn-pen btn-sm" style={{ marginTop: 18 }}>
                  Check ATS score <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ATSRuleDrawer
        rule={selectedRule}
        onClose={() => setSelectedRule(null)}
        onFix={onFix}
        loading={loading}
      />
    </div>
  );
}
