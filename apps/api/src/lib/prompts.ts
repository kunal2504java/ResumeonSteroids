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
) => `Given this GitHub profile and repositories, extract the most impressive projects for a software engineer resume. Focus on projects with the most impact, stars, and technical complexity.

GitHub Profile:
${profile}

Repositories:
${repos}

Return a JSON array of the top 6 projects in this exact format:
{
  "projects": [
    {
      "name": "repo-name",
      "description": "2-3 sentence resume-worthy description focusing on technical impact",
      "techStack": ["React", "Node.js", "PostgreSQL"],
      "highlights": ["Built X that achieved Y", "Implemented Z resulting in W"],
      "url": "https://github.com/user/repo",
      "stars": 42
    }
  ]
}

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
