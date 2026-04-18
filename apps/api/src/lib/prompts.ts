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
