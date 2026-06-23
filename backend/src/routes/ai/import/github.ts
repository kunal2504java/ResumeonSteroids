import { Hono } from "hono";
import { GitHubImportSchema } from "@resumeai/shared/schemas";
import { anthropic } from "../../../lib/anthropic";
import {
  fetchGitHubUser,
  fetchGitHubRepos,
  inspectGitHubRepo,
} from "../../../lib/github";
import { GITHUB_ANALYZE_PROMPT } from "../../../lib/prompts";
import { optionalAuthMiddleware } from "../../../middleware/auth";

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const parsed = GitHubImportSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid username" }, 400);
    }

    const { username } = parsed.data;

    const [user, repos] = await Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepos(username),
    ]);

    const inspectedRepos = await Promise.all(
      repos.slice(0, 5).map((repo) => inspectGitHubRepo(username, repo))
    );

    const profileText = `Display name: ${user.name || "N/A"}\nUsername: ${user.login}\nBio: ${user.bio || "N/A"}\nPublic repos: ${user.public_repos}\nFollowers: ${user.followers}`;

    const reposText = inspectedRepos
      .map(
        (r) =>
          [
            `Repository: ${r.name}`,
            `URL: ${r.html_url}`,
            `Description: ${r.description || "No description"}`,
            `Stars: ${r.stars}`,
            `Primary language: ${r.language || "N/A"}`,
            `Detected languages: ${r.languages.join(", ") || "unknown"}`,
            `Topics: ${r.topics.join(", ") || "none"}`,
            `Updated: ${r.updated_at}`,
            `Top-level files: ${r.topLevelFiles.join(", ") || "none"}`,
            r.packageFiles.length
              ? `Key files:\n${r.packageFiles
                  .map(
                    (file) =>
                      `--- ${file.path} ---\n${file.content}`
                  )
                  .join("\n")}`
              : "Key files: none",
            `README:\n${r.readme || "No README available"}`,
          ].join("\n")
      )
      .join("\n\n====================\n\n");

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: GITHUB_ANALYZE_PROMPT(profileText, reposText),
        },
      ],
    });

    const text =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    let projects;
    try {
      projects = JSON.parse(text);
    } catch {
      projects = { projects: [] };
    }

    return c.json({
      profile: {
        name: user.name || "",
        username: user.login,
        bio: user.bio,
        url: user.html_url,
        repos: user.public_repos,
        followers: user.followers,
      },
      analysis: {
        inspectedRepoCount: inspectedRepos.length,
        totalCandidateRepoCount: repos.length,
      },
      repoEvidence: inspectedRepos.map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stars,
        language: repo.language,
        languages: repo.languages,
        topics: repo.topics,
        updatedAt: repo.updated_at,
        readme: repo.readme,
      })),
      ...projects,
    });
  } catch (error) {
    console.error("[GitHub Import Error]", error);
    const message =
      error instanceof Error ? error.message : "GitHub import failed";
    return c.json({ error: message }, 500);
  }
});

export { route as githubImportRoute };
