/**
 * LeetCode Collector
 *
 * Fetches user stats via the public LeetCode GraphQL API.
 * Gets submission counts by difficulty, contest rating, badges, and skills.
 */

export interface LeetCodeRawData {
  source: "leetcode";
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contestRating: number;
  globalRanking: number;
  topPercentage: number;
  totalParticipants: number;
  badges: string[];
  skillTags: string[];
}

const LEETCODE_GQL = "https://leetcode.com/graphql";

const USER_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
      skillTags
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    badges {
      name
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
}`;

async function gql(query: string, variables: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(LEETCODE_GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

export async function collectLeetCode(username: string): Promise<LeetCodeRawData> {
  const result = await gql(USER_QUERY, { username });
  const data = result?.data as Record<string, unknown> | undefined;

  const user = data?.matchedUser as Record<string, unknown> | undefined;
  if (!user) throw new Error(`LeetCode user not found: ${username}`);

  // Extract submission stats
  let totalSolved = 0, easySolved = 0, mediumSolved = 0, hardSolved = 0;
  const submitStats = user.submitStats as Record<string, unknown> | undefined;
  for (const s of (submitStats?.acSubmissionNum as Array<{ difficulty: string; count: number }>) || []) {
    if (s.difficulty === "All") totalSolved = s.count;
    if (s.difficulty === "Easy") easySolved = s.count;
    if (s.difficulty === "Medium") mediumSolved = s.count;
    if (s.difficulty === "Hard") hardSolved = s.count;
  }

  const userProfile = user.profile as Record<string, unknown> | undefined;
  const ranking = (userProfile?.ranking as number) || 0;
  const skillTags: string[] = (userProfile?.skillTags as string[]) || [];
  const badges: string[] = ((user.badges as Array<{ name: string }>) || []).map((b) => b.name);

  // Extract contest stats
  const contest = data?.userContestRanking as Record<string, unknown> | undefined;
  const contestRating = Math.round((contest?.rating as number) || 0);
  const globalRanking = (contest?.globalRanking as number) || 0;
  const totalParticipants = (contest?.totalParticipants as number) || 0;
  const topPercentage = Math.round(((contest?.topPercentage as number) || 0) * 10) / 10;

  return {
    source: "leetcode",
    username,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    ranking,
    contestRating,
    globalRanking,
    topPercentage,
    totalParticipants,
    badges,
    skillTags,
  };
}
