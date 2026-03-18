import { NextRequest } from "next/server";
import { CodeforcesImportSchema } from "@/types/api";
import { fetchCodeforcesUser } from "@/lib/api/codeforces";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CodeforcesImportSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid handle" }, { status: 400 });
    }

    const user = await fetchCodeforcesUser(parsed.data.handle);

    const achievement = `Codeforces: ${user.maxRank} (max rating ${user.maxRating})`;

    return Response.json({
      stats: user,
      achievement,
    });
  } catch (error) {
    console.error("Codeforces import error:", error);
    const message =
      error instanceof Error ? error.message : "Codeforces import failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
