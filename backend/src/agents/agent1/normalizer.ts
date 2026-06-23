/**
 * Agent 1 Normalizer
 *
 * Takes ALL raw collected source data and makes a single Claude call
 * to extract, merge, deduplicate, and normalize everything into one
 * clean JSON object matching the NormalizedData schema.
 *
 * This replaces the previous per-source heuristic normalizers + merge.
 * Claude handles the intelligent cross-source resolution in one pass:
 *   - Prefers LinkedIn data for experience
 *   - Prefers GitHub data for projects
 *   - Merges duplicates intelligently
 *   - Categorizes skills by domain
 */

import type { NormalizedData } from "../pipeline.types";
import { anthropic } from "../../lib/anthropic";

const NORMALIZE_SYSTEM_PROMPT = `You are a resume data extraction specialist.
You receive raw data from multiple sources (GitHub, LinkedIn, LeetCode, 
Codeforces, uploaded resume text).

Your job is to extract and normalize everything into this EXACT JSON schema:
{
  "personal": {
    "name": "", "email": "", "phone": "", 
    "location": "", "linkedin": "", "github": ""
  },
  "education": [{
    "institution": "", "degree": "", 
    "dates": "", "location": "", "gpa": ""
  }],
  "experience": [{
    "company": "", "title": "", "location": "",
    "dates": "", "bullets": ["", ""]
  }],
  "projects": [{
    "name": "", "techStack": "", "date": "",
    "bullets": ["", ""], "url": "", "stars": 0
  }],
  "skills": {
    "languages": [], "backend": [], "frontend": [],
    "databases": [], "devops": [], "other": []
  },
  "competitive": {
    "leetcode": { "solved": 0, "rating": 0, "rank": "" },
    "codeforces": { "rating": 0, "rank": "" }
  }
}

Rules:
- Merge duplicate data intelligently (e.g. GitHub projects + uploaded resume projects)
- Prefer LinkedIn data for experience, GitHub for projects
- For dates, use human-readable format like "Aug 2022 -- Present" or "May 2021 -- Aug 2022"
- For project techStack, join technologies into a single comma-separated string
- For skills, categorize into the correct buckets (languages, backend, frontend, databases, devops, other)
- For competitive stats, extract LeetCode solved count / contest rating / rank and Codeforces rating / rank
- If a source is missing or has no data, use empty strings/arrays/zeros as defaults
- Deduplicate skills across sources
- ONLY return valid JSON, no explanation, no markdown backticks`;

/**
 * Normalize all raw source data into a single clean NormalizedData object
 * using a single Claude call.
 *
 * @param rawSources - Object mapping source names to their raw collected data
 * @returns NormalizedData - The unified, clean resume data
 */
export async function normalizeAllSources(
  rawSources: Record<string, unknown>
): Promise<NormalizedData> {
  console.log("[Agent 1 Normalizer] Sending all raw data to Claude for normalization...");

  const rawJson = JSON.stringify(rawSources, null, 2);
  // Truncate if extremely large to avoid token limits
  const truncated = rawJson.length > 30000 ? rawJson.slice(0, 30000) + "\n...(truncated)" : rawJson;

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: NORMALIZE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Normalize this data from multiple sources:\n\n${truncated}`,
      },
    ],
  });

  const content = res.content[0].type === "text" ? res.content[0].text : "";

  let parsed: NormalizedData;
  try {
    parsed = JSON.parse(content) as NormalizedData;
  } catch {
    console.error("[Agent 1 Normalizer] Failed to parse Claude response:", content.slice(0, 500));
    throw new Error("Claude returned invalid JSON during normalization");
  }

  // Ensure all required fields have defaults
  const data: NormalizedData = {
    personal: {
      name: parsed.personal?.name || "",
      email: parsed.personal?.email || "",
      phone: parsed.personal?.phone || "",
      location: parsed.personal?.location || "",
      linkedin: parsed.personal?.linkedin || "",
      github: parsed.personal?.github || "",
    },
    education: (parsed.education || []).map((e) => ({
      institution: e.institution || "",
      degree: e.degree || "",
      dates: e.dates || "",
      location: e.location || "",
      gpa: e.gpa || "",
    })),
    experience: (parsed.experience || []).map((e) => ({
      company: e.company || "",
      title: e.title || "",
      location: e.location || "",
      dates: e.dates || "",
      bullets: e.bullets || [],
    })),
    projects: (parsed.projects || []).map((p) => ({
      name: p.name || "",
      techStack: p.techStack || "",
      date: p.date || "",
      bullets: p.bullets || [],
      url: p.url || "",
      stars: p.stars || 0,
    })),
    skills: {
      languages: parsed.skills?.languages || [],
      backend: parsed.skills?.backend || [],
      frontend: parsed.skills?.frontend || [],
      databases: parsed.skills?.databases || [],
      devops: parsed.skills?.devops || [],
      other: parsed.skills?.other || [],
    },
    competitive: {
      leetcode: {
        solved: parsed.competitive?.leetcode?.solved || 0,
        rating: parsed.competitive?.leetcode?.rating || 0,
        rank: parsed.competitive?.leetcode?.rank || "",
      },
      codeforces: {
        rating: parsed.competitive?.codeforces?.rating || 0,
        rank: parsed.competitive?.codeforces?.rank || "",
      },
    },
  };

  console.log("[Agent 1 Normalizer] Normalization complete:");
  console.log(`  Personal: ${data.personal.name || "(no name)"}`);
  console.log(`  Experience: ${data.experience.length} entries`);
  console.log(`  Education: ${data.education.length} entries`);
  console.log(`  Projects: ${data.projects.length} entries`);
  console.log(`  Skills: ${Object.values(data.skills).flat().length} total`);

  return data;
}
