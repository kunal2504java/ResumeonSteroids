import test from "node:test";
import assert from "node:assert/strict";
import {
  detectEmailPattern,
  eventTypeForDraft,
  attachMutualConnections,
  findEmailByPattern,
  findMutualConnections,
  generateEmailCandidates,
  scoreAndRankContacts,
  validateOutreachDraft,
  validateOutreachDrafts,
} from "./outreach";

test("contact scoring prefers hiring managers over recruiters", () => {
  const ranked = scoreAndRankContacts(
    [
      { fullName: "Riya Recruiter", title: "Technical Recruiter" },
      { fullName: "Aman Manager", title: "Engineering Manager, Backend Platform" },
      { fullName: "Dev Engineer", title: "Software Engineer" },
    ],
    "Senior Backend Engineer",
  );

  assert.equal(ranked[0].target_name, "Aman Manager");
  assert.ok(ranked[0].relevance_score > ranked[1].relevance_score);
});

test("email pattern permutations are generated correctly", () => {
  assert.deepEqual(generateEmailCandidates("Kunal", "Singh", "acme.com"), [
    "kunal.singh@acme.com",
    "kunalsingh@acme.com",
    "ksingh@acme.com",
    "kunal@acme.com",
    "kunal_singh@acme.com",
  ]);
});

test("mx verifier is called per candidate until a match is found", async () => {
  const called: string[] = [];
  const result = await findEmailByPattern({
    firstName: "Kunal",
    lastName: "Singh",
    companyDomain: "acme.com",
    verifyMx: async (email) => {
      called.push(email);
      return email === "ksingh@acme.com";
    },
  });

  assert.equal(result?.email, "ksingh@acme.com");
  assert.equal(result?.confidence, "medium");
  assert.deepEqual(called, [
    "kunal.singh@acme.com",
    "kunalsingh@acme.com",
    "ksingh@acme.com",
  ]);
});

test("detectEmailPattern returns matching template", () => {
  assert.equal(
    detectEmailPattern("kunal_singh@acme.com", "Kunal", "Singh", "acme.com"),
    "{first}_{last}@{domain}",
  );
});

test("mutual connection is flagged in target", () => {
  const ranked = scoreAndRankContacts(
    [{ name: "Priya Rao", title: "Senior Software Engineer", mutualFriend: "Kunal" }],
    "Backend Engineer",
  );

  assert.equal(ranked[0].mutual_connection_name, "Kunal");
  assert.ok(ranked[0].relevance_score >= 2);
});

test("mutual connections are found by cross-referencing user connections", () => {
  const mutuals = findMutualConnections({
    companyName: "Acme",
    companyContacts: [
      { name: "Priya Rao", title: "Engineering Manager", companyName: "Acme" },
      { name: "Someone Else", title: "Recruiter", companyName: "Acme" },
    ],
    userConnections: [{ name: "Priya Rao", title: "Tech Lead", companyName: "Acme" }],
  });

  assert.equal(mutuals.length, 1);
  assert.equal(mutuals[0].name, "Priya Rao");
  assert.equal(mutuals[0].connection_degree, 1);
});

test("mutual connections are attached before contact scoring", () => {
  const contacts = attachMutualConnections(
    [{ name: "Priya Rao", title: "Senior Software Engineer" }],
    [
      {
        name: "Priya Rao",
        title: "Senior Software Engineer",
        linkedin_url: null,
        connection_degree: 1,
        mutual_friend: "Priya Rao",
      },
    ],
  );

  const ranked = scoreAndRankContacts(contacts, "Backend Engineer");
  assert.equal(ranked[0].mutual_connection_name, "Priya Rao");
});

test("cold email over 150 words is rejected", () => {
  const body = Array.from({ length: 151 }, () => "word").join(" ");
  const issues = validateOutreachDraft({ draft_type: "cold_email", body });
  assert.ok(issues.some((issue) => issue.includes("150 words")));
});

test("linkedin dm connection request must be under 300 chars", () => {
  const issues = validateOutreachDraft({
    draft_type: "linkedin_dm",
    body: "Short follow-up",
    metadata: { connection_request: "x".repeat(301), follow_up_dm: "Short follow-up" },
  });

  assert.ok(issues.some((issue) => issue.includes("300 characters")));
});

test("follow-up dm must be under 500 chars", () => {
  const issues = validateOutreachDraft({
    draft_type: "linkedin_dm",
    body: "x".repeat(501),
    metadata: { connection_request: "Short request", follow_up_dm: "x".repeat(501) },
  });

  assert.ok(issues.some((issue) => issue.includes("500 characters")));
});

test("referral request requires fit paragraph", () => {
  const issues = validateOutreachDraft({
    draft_type: "referral_request",
    body: "Could you refer me for the backend role?",
    metadata: {},
  });

  assert.ok(issues.some((issue) => issue.includes("fit paragraph")));
});

test("forbidden phrases are absent from valid drafts", () => {
  const issues = validateOutreachDrafts([
    {
      draft_type: "cold_email",
      subject_line: "Backend platform at Acme",
      body: "Saw Acme scaling payments. Built Redis queues cutting latency 32%. Open to a 15-minute call Tuesday?",
    },
    {
      draft_type: "linkedin_dm",
      body: "Your infra work at Acme stood out. I built queue systems for similar scaling issues. Worth a short chat?",
      metadata: {
        connection_request: "Your infra work at Acme stood out. I build backend systems for similar scaling problems.",
        follow_up_dm:
          "Your infra work at Acme stood out. I built queue systems for similar scaling issues. Worth a short chat?",
      },
    },
    {
      draft_type: "referral_request",
      subject_line: "Referral for backend role",
      body: "Could you refer me internally for the Backend Engineer role? I built queue systems that cut latency 32%.",
      metadata: {
        fit_paragraph:
          "Kunal has backend systems experience across Redis, PostgreSQL, and queue-based architectures with measurable latency improvements.",
      },
    },
  ]);

  assert.deepEqual(issues, []);
});

test("forbidden phrases are flagged in drafts", () => {
  const issues = validateOutreachDraft({
    draft_type: "cold_email",
    body: "I hope this finds you well. I am writing to express my interest in the role.",
  });

  assert.ok(issues.some((issue) => issue.includes("forbidden")));
});

test("draft type maps to application event type", () => {
  assert.equal(eventTypeForDraft("cold_email"), "email_sent");
  assert.equal(eventTypeForDraft("linkedin_dm"), "dm_sent");
  assert.equal(eventTypeForDraft("referral_request"), "referral_sent");
});
