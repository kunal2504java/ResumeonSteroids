/**
 * Codeforces Collector
 *
 * Fetches user info and contest history from the Codeforces REST API.
 */

export interface CodeforcesRawData {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  contestsCount: number;
}

export async function collectCodeforces(handle: string): Promise<CodeforcesRawData> {
  // Fetch user info and contest history in parallel
  const [infoRes, contestRes] = await Promise.all([
    fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`
    ),
    fetch(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`
    ),
  ]);

  if (!infoRes.ok) throw new Error(`Codeforces user not found: ${handle}`);

  const infoData = (await infoRes.json()) as Record<string, unknown>;
  if (infoData.status !== "OK" || !(infoData.result as unknown[])?.length) {
    throw new Error(`Codeforces user not found: ${handle}`);
  }

  const user = (infoData.result as Record<string, unknown>[])[0];
  let contestsCount = 0;

  if (contestRes.ok) {
    const contestData = (await contestRes.json()) as Record<string, unknown>;
    if (contestData.status === "OK") {
      contestsCount = (contestData.result as unknown[])?.length || 0;
    }
  }

  return {
    handle: user.handle as string,
    rating: (user.rating as number) || 0,
    maxRating: (user.maxRating as number) || 0,
    rank: (user.rank as string) || "Unrated",
    maxRank: (user.maxRank as string) || "Unrated",
    contestsCount,
  };
}
