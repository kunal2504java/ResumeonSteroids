export interface Stage {
  progress: number;
  headline: string;
  subtitle: string;
  microStage: string;
}

export const CONNECTION_STAGES: Record<string, Stage[]> = {
  github: [
    {
      progress: 5,
      headline: "Knocking on GitHub\u2019s door...",
      subtitle: "Reaching out to the GitHub API to find your profile.",
      microStage: "Authenticating...",
    },
    {
      progress: 20,
      headline: "Found you. Scanning your repos.",
      subtitle: "Reading through your repositories, stars, and contribution history.",
      microStage: "Fetching repositories...",
    },
    {
      progress: 40,
      headline: "Your commits tell a story.",
      subtitle: "Analyzing your most impactful projects and what languages you use most.",
      microStage: "Analyzing contributions...",
    },
    {
      progress: 60,
      headline: "Reading between the lines.",
      subtitle: "Extracting READMEs and project descriptions to understand what you built.",
      microStage: "Parsing READMEs...",
    },
    {
      progress: 80,
      headline: "Picking the best projects.",
      subtitle: "Selecting your top repos by stars, recency, and technical complexity.",
      microStage: "Ranking projects...",
    },
    {
      progress: 100,
      headline: "GitHub: done.",
      subtitle: "Found {repoCount} repos. Added {projectCount} projects to your resume.",
      microStage: "Complete",
    },
  ],

  leetcode: [
    {
      progress: 10,
      headline: "Connecting to LeetCode...",
      subtitle: "Querying the LeetCode GraphQL API for your public stats.",
      microStage: "Connecting...",
    },
    {
      progress: 40,
      headline: "Counting every problem you\u2019ve crushed.",
      subtitle: "Tallying your easy, medium, and hard solve counts.",
      microStage: "Fetching solve stats...",
    },
    {
      progress: 70,
      headline: "Checking your contest history.",
      subtitle: "Looking at your contest rankings and peak rating.",
      microStage: "Fetching contest data...",
    },
    {
      progress: 100,
      headline: "LeetCode: done.",
      subtitle: "{total} problems solved. Contest rating: {rating}. That\u2019s impressive.",
      microStage: "Complete",
    },
  ],

  codeforces: [
    {
      progress: 15,
      headline: "Pinging Codeforces...",
      subtitle: "Looking up your competitive programming profile.",
      microStage: "Fetching profile...",
    },
    {
      progress: 50,
      headline: "Pulling your rating history.",
      subtitle: "Reading your contest participation and rating changes over time.",
      microStage: "Fetching rating history...",
    },
    {
      progress: 100,
      headline: "Codeforces: done.",
      subtitle: "Current rating: {rating} ({rank}). Peak: {maxRating}. Noted.",
      microStage: "Complete",
    },
  ],

  linkedin: [
    {
      progress: 10,
      headline: "Opening your LinkedIn profile...",
      subtitle: "Fetching your public profile page to extract your career history.",
      microStage: "Fetching profile page...",
    },
    {
      progress: 40,
      headline: "Reading your experience.",
      subtitle: "Extracting job titles, companies, dates, and responsibilities.",
      microStage: "Parsing experience...",
    },
    {
      progress: 70,
      headline: "Grabbing your education & skills.",
      subtitle: "Pulling your degrees, certifications, and listed skills.",
      microStage: "Parsing education & skills...",
    },
    {
      progress: 100,
      headline: "LinkedIn: done.",
      subtitle: "Imported {expCount} roles, {eduCount} education entries, and {skillCount} skills.",
      microStage: "Complete",
    },
  ],

  resume: [
    {
      progress: 10,
      headline: "Opening your resume...",
      subtitle: "Extracting text from your PDF or DOCX file.",
      microStage: "Parsing file...",
    },
    {
      progress: 35,
      headline: "Reading every line.",
      subtitle: "AI is scanning your resume for experience, skills, and achievements.",
      microStage: "Analyzing content...",
    },
    {
      progress: 65,
      headline: "Restructuring your content.",
      subtitle: "Mapping what we found into sections: experience, education, projects, skills.",
      microStage: "Structuring data...",
    },
    {
      progress: 85,
      headline: "Cleaning it up.",
      subtitle: "Removing duplicates, fixing formatting, and standardizing dates.",
      microStage: "Cleaning data...",
    },
    {
      progress: 100,
      headline: "Resume parsed.",
      subtitle: "Found {sectionCount} sections. Everything\u2019s been imported successfully.",
      microStage: "Complete",
    },
  ],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function interpolateStageMessage(
  template: string,
  data: unknown
): string {
  if (!data || typeof data !== "object") return template;
  const d = data as Record<string, any>;

  let result = template;

  // GitHub
  if (d.profile?.repos != null)
    result = result.replace("{repoCount}", String(d.profile.repos));
  if (d.projects?.length != null)
    result = result.replace("{projectCount}", String(d.projects.length));

  // LeetCode
  if (d.stats?.totalSolved != null)
    result = result.replace("{total}", String(d.stats.totalSolved));
  if (d.stats?.contestRating != null)
    result = result.replace(
      "{rating}",
      String(d.stats.contestRating || "Unrated")
    );

  // Codeforces
  if (d.stats?.rating != null)
    result = result.replace("{rating}", String(d.stats.rating));
  if (d.stats?.maxRating != null)
    result = result.replace("{maxRating}", String(d.stats.maxRating));
  if (d.stats?.rank != null)
    result = result.replace("{rank}", String(d.stats.rank));
  if (d.stats?.maxRank != null)
    result = result.replace("{rank}", String(d.stats.maxRank));

  // LinkedIn
  if (d.experience?.length != null)
    result = result.replace("{expCount}", String(d.experience.length));
  if (d.education?.length != null)
    result = result.replace("{eduCount}", String(d.education.length));
  if (d.skills) {
    const skillCount = Object.values(d.skills)
      .flat()
      .filter(Boolean).length;
    result = result.replace("{skillCount}", String(skillCount));
  }

  // Resume
  if (d.resumeData && typeof d.resumeData === "object") {
    const rd = d.resumeData as Record<string, unknown>;
    const sections = Object.keys(rd).filter((k) => {
      const v = rd[k];
      if (!v) return false;
      if (typeof v === "string") return v.length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v).length > 0;
      return false;
    });
    result = result.replace("{sectionCount}", String(sections.length));
  }

  return result;
}

export function getImportedItems(
  sourceId: string,
  data: unknown
): string[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, any>;

  switch (sourceId) {
    case "github": {
      const items: string[] = [];
      if (d.projects?.length)
        items.push(`${d.projects.length} project${d.projects.length > 1 ? "s" : ""}`);
      if (d.profile?.name) items.push("Profile info");
      return items;
    }
    case "leetcode": {
      const items: string[] = [];
      if (d.stats?.totalSolved)
        items.push(`${d.stats.totalSolved} problems solved`);
      if (d.stats?.contestRating > 0)
        items.push(`Contest rating: ${d.stats.contestRating}`);
      if (d.achievement) items.push("Achievement added");
      return items;
    }
    case "codeforces": {
      const items: string[] = [];
      if (d.stats?.maxRank)
        items.push(`${d.stats.maxRank} (${d.stats.maxRating})`);
      if (d.achievement) items.push("Achievement added");
      return items;
    }
    case "linkedin": {
      const liItems: string[] = [];
      if (d.experience?.length)
        liItems.push(`${d.experience.length} role${d.experience.length > 1 ? "s" : ""}`);
      if (d.education?.length)
        liItems.push(`${d.education.length} education`);
      if (d.skills) {
        const count = Object.values(d.skills)
          .flat()
          .filter(Boolean).length;
        if (count) liItems.push(`${count} skills`);
      }
      if (d.profile?.name) liItems.push("Profile info");
      if (liItems.length === 0) liItems.push("Profile URL saved");
      return liItems;
    }
    case "resume": {
      const items: string[] = [];
      const rd = d.resumeData;
      if (!rd) return items;
      if (rd.experience?.length)
        items.push(`${rd.experience.length} job${rd.experience.length > 1 ? "s" : ""}`);
      if (rd.education?.length)
        items.push(`${rd.education.length} education`);
      if (rd.projects?.length)
        items.push(`${rd.projects.length} project${rd.projects.length > 1 ? "s" : ""}`);
      if (rd.skills) {
        const count = Object.values(rd.skills)
          .flat()
          .filter(Boolean).length;
        if (count) items.push(`${count} skills`);
      }
      return items;
    }
    default:
      return [];
  }
}
