/**
 * GitHub Collector
 *
 * Fetches public profile + top repos via the GitHub REST API.
 * No OAuth required for public data. Respects rate limits (60/hr unauthenticated).
 */

export interface GitHubRawData {
  source: "github";
  name: string;
  bio: string | null;
  location: string | null;
  email: string | null;
  blog: string | null;
  login: string;
  htmlUrl: string;
  publicRepos: number;
  followers: number;
  projects: GitHubRawProject[];
}

export interface GitHubRawProject {
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  url: string;
  homepage: string | null;
  forks: number;
  updatedAt: string;
  readme: string | null; // fetch separately if needed
}

const GH_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "ResumeAI-Agent",
};

export async function collectGitHub(username: string): Promise<GitHubRawData> {
  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: GH_HEADERS,
    }),
    fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=30&type=owner`,
      { headers: GH_HEADERS }
    ),
  ]);

  if (!profileRes.ok) {
    throw new Error(`GitHub user not found: ${username} (${profileRes.status})`);
  }
  if (!reposRes.ok) {
    throw new Error(`Failed to fetch repos for: ${username} (${reposRes.status})`);
  }

  const profile = (await profileRes.json()) as Record<string, unknown>;
  const allRepos = (await reposRes.json()) as Array<Record<string, unknown>>;

  // Filter out forks, sort by stars, take top 10
  const projects: GitHubRawProject[] = allRepos
    .filter((r) => !r.fork)
    .sort((a, b) => (b.stargazers_count as number) - (a.stargazers_count as number))
    .slice(0, 10)
    .map((r) => ({
      name: r.name as string,
      description: r.description as string | null,
      stars: r.stargazers_count as number,
      language: r.language as string | null,
      topics: (r.topics as string[]) || [],
      url: r.html_url as string,
      homepage: r.homepage as string | null,
      forks: r.forks_count as number,
      updatedAt: r.updated_at as string,
      readme: null, // fetch separately if needed
    }));

  return {
    source: "github",
    name: (profile.name as string) || "",
    bio: (profile.bio as string | null) ?? null,
    location: (profile.location as string | null) ?? null,
    email: (profile.email as string | null) ?? null,
    blog: (profile.blog as string | null) ?? null,
    login: profile.login as string,
    htmlUrl: profile.html_url as string,
    publicRepos: profile.public_repos as number,
    followers: profile.followers as number,
    projects,
  };
}
