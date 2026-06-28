export interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  html_url: string;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  fork: boolean;
  updated_at: string;
  default_branch: string;
}

export interface GitHubRepoInspection {
  name: string;
  description: string | null;
  html_url: string;
  stars: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  languages: string[];
  readme: string | null;
  topLevelFiles: string[];
  packageFiles: Array<{
    path: string;
    content: string;
  }>;
}

const GH_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "ResumeAI-Agent",
};

if (process.env.GITHUB_TOKEN) {
  GH_HEADERS.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: GH_HEADERS,
  });
  if (!res.ok) throw new Error(`GitHub user not found: ${username}`);
  return (await res.json()) as GitHubUser;
}

export async function fetchGitHubRepos(
  username: string
): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=stars&per_page=30&type=owner`,
    { headers: GH_HEADERS }
  );
  if (!res.ok) throw new Error(`Failed to fetch repos for: ${username}`);
  const repos = (await res.json()) as GitHubRepo[];
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10);
}

async function fetchRepoJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: GH_HEADERS });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function fetchRepoText(url: string, accept?: string): Promise<string | null> {
  const headers = accept ? { ...GH_HEADERS, Accept: accept } : GH_HEADERS;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return await res.text();
}

function trimForPrompt(text: string | null, maxChars: number): string | null {
  if (!text) return null;
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return null;
  return normalized.length > maxChars
    ? `${normalized.slice(0, maxChars)}\n...[truncated]`
    : normalized;
}

function pickInterestingFiles(paths: string[]): string[] {
  const preferred = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "Makefile",
    "Procfile",
  ];

  const hits = preferred.filter((target) =>
    paths.some((path) => path.toLowerCase() === target.toLowerCase())
  );

  return hits.slice(0, 4);
}

export async function inspectGitHubRepo(
  username: string,
  repo: GitHubRepo
): Promise<GitHubRepoInspection> {
  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/contents`;
  const readmeUrl = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/readme`;
  const languagesUrl = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`;

  const [contents, readme, languages] = await Promise.all([
    fetchRepoJson<Array<{ path: string; type: string }>>(contentsUrl),
    fetchRepoText(readmeUrl, "application/vnd.github.raw+json"),
    fetchRepoJson<Record<string, number>>(languagesUrl),
  ]);

  const topLevelFiles = Array.isArray(contents)
    ? contents.map((entry) => entry.path)
    : [];

  const interestingFiles = pickInterestingFiles(topLevelFiles);

  const packageFiles = await Promise.all(
    interestingFiles.map(async (filePath) => {
      const content = await fetchRepoText(
        `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/contents/${encodeURIComponent(filePath)}`,
        "application/vnd.github.raw+json"
      );

      return {
        path: filePath,
        content: trimForPrompt(content, 3000) ?? "",
      };
    })
  );

  return {
    name: repo.name,
    description: repo.description,
    html_url: repo.html_url,
    stars: repo.stargazers_count,
    language: repo.language,
    topics: repo.topics ?? [],
    updated_at: repo.updated_at,
    languages: Object.keys(languages ?? {}).slice(0, 8),
    readme: trimForPrompt(readme, 8000),
    topLevelFiles: topLevelFiles.slice(0, 20),
    packageFiles: packageFiles.filter((file) => file.content.trim().length > 0),
  };
}

export interface RepoContribution {
  name: string;
  stars: number;
  language: string | null;
  topics: string[];
  /** The owner's own commit count on this repo (anti-vanity-repo signal). */
  authorCommits: number;
  totalContributors: number;
  /** >1 contributor ⇒ collaborative; sole contributor ⇒ personal project. */
  projectType: "open_source" | "self_project";
}

/**
 * Fetch a repo's contributor list to derive the owner's commit share and a
 * collaborative-vs-personal classification — the real OSS signal a keyword ATS
 * (and HackerRank's >1-contributor heuristic) can't see on its own.
 */
export async function fetchRepoContribution(
  username: string,
  repo: GitHubRepo,
): Promise<RepoContribution> {
  const url = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/contributors?per_page=100`;
  const contributors = await fetchRepoJson<Array<{ login: string; contributions: number }>>(url);
  const list = Array.isArray(contributors) ? contributors : [];
  const mine = list.find((c) => c.login?.toLowerCase() === username.toLowerCase());
  const totalContributors = list.length;
  return {
    name: repo.name,
    stars: repo.stargazers_count,
    language: repo.language,
    topics: repo.topics ?? [],
    authorCommits: mine?.contributions ?? 0,
    totalContributors,
    projectType: totalContributors > 1 ? "open_source" : "self_project",
  };
}

export interface ExternalContributions {
  /** Total merged PRs authored by the user across all of GitHub. */
  totalMergedPrs: number;
  /** Distinct repos NOT owned by the user that they have merged PRs into. */
  externalRepoCount: number;
  /** Top external repos by stars, with the candidate's merged-PR count. */
  externalRepos: Array<{ repo: string; stars: number; prCount: number }>;
}

/**
 * The gold-standard open-source signal: the candidate's MERGED pull requests into
 * repositories they do NOT own. Uses the search API (separate, stricter rate limit:
 * 1 call here), then fetches stars for the top external repos to weight by popularity.
 */
export async function fetchExternalContributions(
  username: string,
): Promise<ExternalContributions | null> {
  const q = encodeURIComponent(`author:${username} type:pr is:merged`);
  const search = await fetchRepoJson<{
    total_count: number;
    items: Array<{ repository_url: string }>;
  }>(`https://api.github.com/search/issues?q=${q}&per_page=100&sort=created&order=desc`);
  if (!search || !Array.isArray(search.items)) return null;

  const counts = new Map<string, number>();
  for (const item of search.items) {
    const m = item.repository_url?.match(/\/repos\/([^/]+\/[^/]+)$/);
    if (!m) continue;
    const full = m[1]; // owner/repo
    if (full.split("/")[0].toLowerCase() === username.toLowerCase()) continue; // external only
    counts.set(full, (counts.get(full) ?? 0) + 1);
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const externalRepos = await Promise.all(
    top.map(async ([full, prCount]) => {
      const repo = await fetchRepoJson<{ stargazers_count: number }>(
        `https://api.github.com/repos/${full}`,
      );
      return { repo: full, stars: repo?.stargazers_count ?? 0, prCount };
    }),
  );

  return {
    totalMergedPrs: search.total_count ?? 0,
    externalRepoCount: counts.size,
    externalRepos: externalRepos.sort((a, b) => b.stars - a.stars),
  };
}
