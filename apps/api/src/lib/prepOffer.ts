export interface PrepQuestion {
  question: string;
  source: "company" | "resume";
  category: "technical" | "behavioral" | "company";
}

export interface StarAnswer {
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface MarketData {
  p25: number;
  median: number;
  p75: number;
  currency: string;
  sources: string[];
}

export type OfferPosition = "below" | "at" | "above";

const TECH_TERMS =
  /\b(?:Python|Java|TypeScript|JavaScript|React|Node|Go|Rust|AWS|Docker|Kubernetes|PostgreSQL|Redis|Kafka|GraphQL|REST|gRPC|CI\/CD|microservices|distributed systems|system design)\b/gi;

export function normalizeQuestion(value: unknown): PrepQuestion | null {
  if (typeof value === "string" && value.trim()) {
    return {
      question: value.trim(),
      source: "company",
      category: "company",
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  if (!question) {
    return null;
  }

  return {
    question,
    source: raw.source === "resume" ? "resume" : "company",
    category:
      raw.category === "technical" || raw.category === "behavioral" || raw.category === "company"
        ? raw.category
        : "company",
  };
}

export function generateResumeQuestions(resumeBullets: string[], roleTitle: string): PrepQuestion[] {
  const questions: PrepQuestion[] = [];
  for (const bullet of resumeBullets.slice(0, 8)) {
    const tech = Array.from(new Set(bullet.match(TECH_TERMS) ?? [])).slice(0, 2);
    if (tech.length > 0) {
      questions.push({
        question: `Walk me through how you used ${tech.join(" and ")} in: "${bullet}"`,
        source: "resume",
        category: "technical",
      });
    } else {
      questions.push({
        question: `What was your specific contribution and measurable result for: "${bullet}"`,
        source: "resume",
        category: "behavioral",
      });
    }
  }

  if (questions.length === 0) {
    questions.push({
      question: `What backend system design trade-offs would matter most for a ${roleTitle} role?`,
      source: "resume",
      category: "technical",
    });
  }

  return questions.slice(0, 10);
}

export function combinePrepQuestions(
  companyQuestions: unknown[],
  resumeQuestions: PrepQuestion[],
): PrepQuestion[] {
  const normalizedCompany = companyQuestions
    .map(normalizeQuestion)
    .filter((question): question is PrepQuestion => Boolean(question));

  const seen = new Set<string>();
  return [...normalizedCompany, ...resumeQuestions]
    .filter((question) => {
      const key = question.question.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 15);
}

export function fallbackStarAnswers(questions: PrepQuestion[]): StarAnswer[] {
  return questions.slice(0, 8).map((question) => ({
    question: question.question,
    situation: "Use a recent project or role where this topic directly appeared.",
    task: "State the responsibility, constraint, and success criteria clearly.",
    action: "Explain the technical decisions, trade-offs, and execution steps.",
    result: "Close with a metric, business outcome, or concrete learning.",
  }));
}

export function computeTotalComp(input: {
  base_salary?: number;
  bonus?: number;
  equity_value?: number;
  joining_bonus?: number;
}): number {
  return (
    Number(input.base_salary ?? 0) +
    Number(input.bonus ?? 0) +
    Number(input.equity_value ?? 0) +
    Number(input.joining_bonus ?? 0)
  );
}

export function fallbackMarketData(roleTitle: string, currency = "INR"): MarketData {
  const role = roleTitle.toLowerCase();
  const seniorMultiplier =
    role.includes("staff") || role.includes("principal")
      ? 1.8
      : role.includes("senior")
        ? 1.35
        : role.includes("lead")
          ? 1.5
          : 1.0;
  const baseMedian = role.includes("backend") || role.includes("software") ? 32 : 24;
  const median = Math.round(baseMedian * seniorMultiplier);

  return {
    p25: Math.round(median * 0.75),
    median,
    p75: Math.round(median * 1.3),
    currency,
    sources: ["fallback_market_model"],
  };
}

export function compareOfferToMarket(totalComp: number, marketData: MarketData): OfferPosition {
  if (totalComp < marketData.median) {
    return "below";
  }
  if (totalComp > marketData.p75) {
    return "above";
  }
  return "at";
}

export function negotiationAnchor(totalComp: number): number {
  return Math.round(totalComp * 1.18);
}

export function fallbackNegotiationDraft(input: {
  companyName: string;
  roleTitle: string;
  totalComp: number;
  marketData: MarketData;
  offerVsMarket: OfferPosition;
}): string {
  const anchor = negotiationAnchor(input.totalComp);
  const framing =
    input.offerVsMarket === "below"
      ? `The offer appears below the market median of ${input.marketData.median} ${input.marketData.currency}L.`
      : `The offer is competitive, and the ask is framed around the scope and responsibilities of the ${input.roleTitle} role.`;

  return [
    `Thank you for the ${input.companyName} offer for the ${input.roleTitle} role.`,
    framing,
    `Based on the role scope and market data, would you be able to revise the total compensation to ${anchor} ${input.marketData.currency}L?`,
    "If base compensation is fixed, I would also be open to discussing signing bonus, equity, or flexibility.",
  ].join("\n\n");
}

