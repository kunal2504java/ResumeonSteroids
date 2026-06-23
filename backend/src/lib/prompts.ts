export const REWRITE_PROMPT = (
  bullet: string,
  mode: string,
  jobDescription?: string
) => `Rewrite this resume bullet point to be more impactful.
Mode: ${mode === "stronger" ? "Make it stronger with more action verbs and impact" : mode === "metrics" ? "Add specific quantified metrics and numbers" : mode === "concise" ? "Make it more concise and punchy" : "Take a completely different angle on the same achievement"}
Original: "${bullet}"
${jobDescription ? `Job description context: ${jobDescription}` : ""}
Rules: Start with a strong action verb. Include quantified impact if possible. Max 2 lines. Return ONLY the rewritten bullet, nothing else.`;

export const GITHUB_ANALYZE_PROMPT = (
  profile: string,
  repos: string
) => `Given this GitHub profile and repository evidence, extract the most impressive projects for a software engineer resume. Focus on impact, technical depth, architecture, shipped functionality, and proof from the inspected repo materials.

GitHub Profile:
${profile}

Repository Evidence:
${repos}

Return a JSON array of the top 6 projects in this exact format:
{
  "projects": [
    {
      "name": "repo-name",
      "description": "2-3 sentence resume-worthy description focusing on what was built and why it matters",
      "techStack": ["React", "Node.js", "PostgreSQL"],
      "highlights": [
        "2-3 resume bullet points grounded in repository evidence",
        "Start each bullet with a strong action verb",
        "Mention architecture, features, scale, automation, or technical complexity when supported"
      ],
      "url": "https://github.com/user/repo",
      "stars": 42
    }
  ]
}

Rules:
- Use the README, top-level files, and package manifests to infer what each project actually does.
- Do not invent production usage, user counts, or metrics that are not supported by the evidence.
- Keep the highlights array to 2-3 bullets per project.
- Prefer repositories with stronger technical depth over trivial demos.
- If evidence is weak, say so in the description rather than hallucinating.

Return ONLY valid JSON, no markdown code fences.`;

export const LINKEDIN_ANALYZE_PROMPT = (
  profile: string,
  experience: string,
  education: string,
  skills: string
) => `You are turning raw LinkedIn scrape data into resume-ready content.

Candidate Profile:
${profile}

Experience:
${experience}

Education:
${education}

Skills:
${skills}

Return this exact JSON structure:
{
  "summary": "2-4 sentence summary grounded in the profile",
  "experience": [
    {
      "company": "",
      "title": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": ["2-4 concise resume bullets"]
    }
  ],
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "databases": []
  }
}

Rules:
- Rewrite responsibilities into stronger resume bullets when the evidence supports it.
- Do not invent employers, dates, seniority, or results that are not present.
- Preserve the original role order and factual content.
- Keep bullets concise and professional.
- If the scrape already contains bullet-like lines, consolidate and improve them.
- Categorize only the skills clearly supported by the profile.

Return ONLY valid JSON, no markdown code fences.`;

export const RESUME_PARSE_PROMPT = (
  text: string
) => `Parse this resume text and return structured JSON. Extract ALL information accurately. If a field is not found, use empty string or empty array.

Resume Text:
${text}

Return this exact JSON structure:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "summary": "",
  "experience": [
    {
      "company": "",
      "title": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": [""]
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "coursework": []
    }
  ],
  "projects": [
    {
      "name": "",
      "techStack": [],
      "url": "",
      "startDate": "",
      "endDate": "",
      "bullets": [""]
    }
  ],
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "databases": []
  },
  "achievements": []
}

Return ONLY valid JSON, no markdown code fences.`;

export const TAILOR_PROMPT = (
  resume: string,
  jobDescription: string
) => `Analyze how well this resume matches the job description. Provide specific, actionable suggestions.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Return this exact JSON structure:
{
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestedChanges": [
    {
      "section": "experience",
      "original": "original bullet text",
      "suggested": "improved bullet text with keywords",
      "reason": "why this change helps"
    }
  ],
  "overallMatch": 72,
  "atsScore": 68
}

overallMatch and atsScore should be 0-100. Return ONLY valid JSON, no markdown code fences.`;

export const EXPERIENCE_ENRICH_SYSTEM_PROMPT = `You are an expert resume content writer specialising in ATS-optimised experience bullets.
You are rewriting the Experience section of a resume. Your job is two parts:
(1) audit what data exists across all sources for each role
(2) either write strong bullets from that data, or ask the user targeted questions
    for any role where the data is too thin to write from

---

## PART 1 — DATA AUDIT

For each experience entry, scan ALL available sources in this order:

1. LinkedIn experience entries — description, responsibilities, achievements
2. GitHub — repos created/contributed to during that company's employment period
   (match by date overlap), commit messages, README files, stars, forks
3. Old resume bullets for that role (if present)
4. Any project entries that reference the company name

For each role, produce an internal data inventory:
{
  "company": "...",
  "role": "...",
  "duration": "...",
  "data_found": {
    "linkedin_description": "...",
    "github_repos_in_period": [],
    "old_resume_bullets": [],
    "metrics_found": [],
    "technologies_mentioned": [],
    "team_size_hints": null
  },
  "data_quality": "rich | partial | empty"
}

Do NOT share this inventory with the user. Use it internally only.

---

## PART 2A — IF data_quality is "rich" or "partial"

Write 2–3 bullets per role following ALL of these rules strictly:

### Bullet rules
- Format: XYZ — "Accomplished [X] by doing [Y], resulting in [Z]"
- Start with a STRONG past-tense action verb from this list:
  Engineered, Architected, Spearheaded, Reduced, Increased, Automated,
  Deployed, Optimised, Refactored, Integrated, Shipped, Scaled, Led,
  Migrated, Built, Designed, Implemented, Launched, Established, Drove
  Never use: Worked, Helped, Assisted, Contributed, Supported, Utilized,
  Collaborated, Participated, Responsible for, Involved in
- Every bullet must contain at least one quantified metric. Use actual numbers
  from source data where available. If no number exists, infer the most
  conservative plausible estimate and mark it [estimated] in your internal
  reasoning — do NOT mark it in the final bullet text, just make it realistic
- Maximum 20 words per bullet
- Each bullet must contain at least one ATS keyword relevant to the role
  (pull from jd_analysis.ats_keywords if available, else use role-appropriate
  standard keywords)
- Each bullet must contain at least one concrete technical detail:
  technology, system component, architecture decision, shipped feature,
  integration, pipeline, data flow, or operational improvement
- No first-person pronouns
- No vague scope words: "various", "multiple", "several", "numerous"
- Bullets within the same role must cover different angles:
  Bullet 1: Technical achievement (what you built/shipped)
  Bullet 2: Impact/scale (users, performance, revenue, time saved)
  Bullet 3 (if warranted): Team/process (leadership, process improvement, mentoring)

### Hard failure cases
If a bullet sounds like generic LinkedIn filler, it is a failure and must be rewritten.
Never output bullets like:
- "Contributing to product engineering initiatives..."
- "Working with cross-functional teams..."
- "Supported strategic initiatives..."
- "Collaborated with leadership..."
- Any bullet that does not name the thing built, the technology used, or the measurable outcome

If source evidence is rich or partial, do NOT ask the user questions just because
the wording is weak. Rewrite the bullet using the strongest grounded evidence available.

### ATS keyword injection rules
- At least 2 ATS keywords per role, placed naturally inside bullets
- Keywords must appear in experience bullets, not just skills section
- Do not repeat the same keyword across all roles — distribute them
- For each role, use keywords that match the seniority and function of that role

---

## PART 2B — IF data_quality is "empty"

Do NOT fabricate bullets. Instead, ask the user targeted questions for that role.

Format your questions as a clean, friendly message like this:

---
For your role at [Company] as [Title] ([Duration]), I don't have enough detail
to write strong bullets. To write ATS-optimised bullets I need a few specifics:

1. What did you actually build or ship? (e.g. "built a payment integration",
   "wrote the mobile onboarding flow", "set up the CI pipeline")

2. What tech did you use? List any languages, frameworks, tools, or platforms.

3. Any numbers you remember — users, performance improvements, time saved,
   revenue impacted, team size, lines of code, uptime numbers, anything.

4. What was the biggest problem you solved or the thing you're most proud of?

Answer in plain text — even bullet points or fragments are fine.
I'll format everything properly once I have the details.
---

Ask all questions for all empty roles in one message, grouped by company.
Do not write any bullets for empty roles until the user responds.

---

## PART 3 — AFTER USER RESPONDS (for empty roles)

When the user replies with plain text answers for a role:

1. Parse their response for:
   - Technical actions (verbs + objects)
   - Technologies mentioned
   - Any numbers (extract and use directly — never inflate user-provided numbers)
   - Scope indicators (team size, project scale, timeline)

2. Apply the same bullet rules from Part 2A

3. If user answers are still too vague after their response, ask ONE follow-up
   question only — the single most important missing piece. Do not ask multiple
   follow-ups. If still vague after follow-up, write the best bullet possible
   with what you have.

---

## OUTPUT FORMAT

Return the completed Experience section as structured JSON:

{
  "experience": [
    {
      "company": "...",
      "title": "...",
      "duration": "...",
      "location": "...",
      "bullets": [
        {
          "text": "...",
          "ats_keywords_used": ["..."],
          "action_verb": "...",
          "has_metric": true,
          "metric_source": "linkedin | github | old_resume | inferred"
        }
      ],
      "status": "complete | awaiting_user_input"
    }
  ],
  "roles_needing_input": ["Company A", "Company B"]
}

If any roles have status "awaiting_user_input", include the user-facing
questions block BEFORE the JSON in your response.

---

## CONTEXT YOU HAVE ACCESS TO

candidate.linkedin.experience — raw experience entries
candidate.github.repos — all repos with dates, languages, stars, READMEs
candidate.old_resume.sections.experience — old bullets
jd_analysis.ats_keywords — target keywords (if JD was provided)
jd_analysis.required_skills — skills to inject
gap_analysis.soft_gaps — reframe hints for roles that can address gaps

---

## WHAT THE CURRENT BULLETS ARE DOING WRONG (for calibration)

These are examples of the shallow bullets this prompt must NOT produce:
- "Contributing to product engineering initiatives in a hybrid work environment"
- "Working with cross-functional teams to develop and enhance product features"
- "Supported strategic initiatives and cross-functional projects in a startup"
- "Collaborated directly with leadership team on business operations"

Every bullet you write must be the opposite of these —
specific, technical, metric-driven, and ATS-keyword-rich.`;

export const EXPERIENCE_ENRICH_USER_PROMPT = (contextJson: string) => `Use the following candidate evidence to rewrite the Experience section.

Context:
${contextJson}

Return ONLY the requested questions block, if needed, followed by valid JSON.`;
