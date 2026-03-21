import { Hono } from "hono";
import { GitHubImportSchema } from "@resumeai/shared/schemas";
import { anthropic } from "../../../lib/anthropic";
import { fetchGitHubUser, fetchGitHubRepos } from "../../../lib/github";
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

    const profileText = `Name: ${user.name || user.login}\nBio: ${user.bio || "N/A"}\nPublic repos: ${user.public_repos}\nFollowers: ${user.followers}`;

    const reposText = repos
      .map(
        (r) =>
          `- ${r.name}: ${r.description || "No description"} | Stars: ${r.stargazers_count} | Language: ${r.language || "N/A"} | Topics: ${r.topics?.join(", ") || "none"}`
      )
      .join("\n");

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
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
        name: user.name || user.login,
        bio: user.bio,
        url: user.html_url,
        repos: user.public_repos,
        followers: user.followers,
      },
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
