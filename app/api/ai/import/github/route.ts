import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GitHubImportSchema } from "@/types/api";
import { fetchGitHubUser, fetchGitHubRepos } from "@/lib/api/github";
import { GITHUB_ANALYZE_PROMPT } from "@/lib/ai/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GitHubImportSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid username" }, { status: 400 });
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

    return Response.json({
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
    console.error("GitHub import error:", error);
    const message =
      error instanceof Error ? error.message : "GitHub import failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
