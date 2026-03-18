import { NextRequest } from "next/server";
import { LeetCodeImportSchema } from "@/types/api";
import { fetchLeetCodeStats } from "@/lib/api/leetcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LeetCodeImportSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid username" }, { status: 400 });
    }

    const stats = await fetchLeetCodeStats(parsed.data.username);

    const achievement = [
      `LeetCode: ${stats.totalSolved} problems solved`,
      `(Easy: ${stats.easySolved}, Medium: ${stats.mediumSolved}, Hard: ${stats.hardSolved})`,
      stats.contestRating > 0
        ? `| Contest Rating: ${stats.contestRating}`
        : "",
      stats.topPercentage > 0 ? `(Top ${stats.topPercentage}%)` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return Response.json({
      stats,
      achievement,
      skills: ["Problem Solving", "Data Structures", "Algorithms"],
    });
  } catch (error) {
    console.error("LeetCode import error:", error);
    const message =
      error instanceof Error ? error.message : "LeetCode import failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
