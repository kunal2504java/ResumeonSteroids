import test from "node:test";
import assert from "node:assert/strict";
import {
  combinePrepQuestions,
  compareOfferToMarket,
  computeTotalComp,
  fallbackMarketData,
  fallbackNegotiationDraft,
  generateResumeQuestions,
  negotiationAnchor,
} from "./prepOffer";

test("prep generation combines company questions and resume-specific questions", () => {
  const resumeQuestions = generateResumeQuestions(
    ["Built Redis queue workers in Python reducing job latency 42%"],
    "Senior Backend Engineer",
  );
  const questions = combinePrepQuestions(
    ["How do backend engineers debug production incidents?"],
    resumeQuestions,
  );

  assert.equal(questions.some((question) => question.source === "company"), true);
  assert.equal(questions.some((question) => question.source === "resume"), true);
  assert.equal(questions.some((question) => question.question.includes("Redis")), true);
});

test("total compensation is computed from all components", () => {
  assert.equal(
    computeTotalComp({
      base_salary: 30,
      bonus: 3,
      equity_value: 5,
      joining_bonus: 2,
    }),
    40,
  );
});

test("offer below market uses below-market framing", () => {
  const marketData = { p25: 24, median: 32, p75: 42, currency: "INR", sources: ["test"] };
  const position = compareOfferToMarket(28, marketData);
  const draft = fallbackNegotiationDraft({
    companyName: "Acme",
    roleTitle: "Senior Backend Engineer",
    totalComp: 28,
    marketData,
    offerVsMarket: position,
  });

  assert.equal(position, "below");
  assert.match(draft, /below the market median/i);
});

test("offer above market uses responsibility framing", () => {
  const marketData = { p25: 24, median: 32, p75: 42, currency: "INR", sources: ["test"] };
  const position = compareOfferToMarket(45, marketData);
  const draft = fallbackNegotiationDraft({
    companyName: "Acme",
    roleTitle: "Senior Backend Engineer",
    totalComp: 45,
    marketData,
    offerVsMarket: position,
  });

  assert.equal(position, "above");
  assert.match(draft, /scope and responsibilities/i);
});

test("fallback market data scales for senior roles", () => {
  const mid = fallbackMarketData("Backend Engineer");
  const senior = fallbackMarketData("Senior Backend Engineer");

  assert.ok(senior.median > mid.median);
});

test("negotiation anchor asks for roughly 15 to 20 percent above offer", () => {
  assert.equal(negotiationAnchor(100), 118);
});

