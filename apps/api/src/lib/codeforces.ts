export interface CodeforcesUser {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
}

interface CodeforcesApiResponse {
  status?: string;
  result?: Array<{
    handle?: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    maxRank?: string;
  }>;
}

export async function fetchCodeforcesUser(
  handle: string
): Promise<CodeforcesUser> {
  const res = await fetch(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`
  );
  if (!res.ok) throw new Error(`Codeforces user not found: ${handle}`);
  const data = (await res.json()) as CodeforcesApiResponse;

  if (data.status !== "OK" || !data.result?.length) {
    throw new Error(`Codeforces user not found: ${handle}`);
  }

  const user = data.result[0];
  return {
    handle: user.handle ?? handle,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || "Unrated",
    maxRank: user.maxRank || "Unrated",
  };
}
