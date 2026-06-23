const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const PROFILE_QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
}`;

const CONTEST_QUERY = `
query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
    topPercentage
    badge {
      name
    }
  }
}`;

export interface LeetCodeData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
  topPercentage: number;
  ranking: number;
}

interface LeetCodeProfileResponse {
  data?: {
    matchedUser?: {
      profile?: {
        ranking?: number;
      };
      submitStatsGlobal?: {
        acSubmissionNum?: Array<{
          difficulty?: string;
          count?: number;
        }>;
      };
    } | null;
  };
}

interface LeetCodeContestResponse {
  data?: {
    userContestRanking?: {
      rating?: number;
      topPercentage?: number;
    } | null;
  };
}

async function queryLeetCode(
  query: string,
  variables: Record<string, string>
): Promise<LeetCodeProfileResponse | LeetCodeContestResponse> {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error("LeetCode API request failed");
  return res.json() as Promise<LeetCodeProfileResponse | LeetCodeContestResponse>;
}

export async function fetchLeetCodeStats(
  username: string
): Promise<LeetCodeData> {
  const [profileRes, contestRes] = await Promise.allSettled([
    queryLeetCode(PROFILE_QUERY, { username }),
    queryLeetCode(CONTEST_QUERY, { username }),
  ]);

  let totalSolved = 0,
    easySolved = 0,
    mediumSolved = 0,
    hardSolved = 0,
    ranking = 0;

  if (profileRes.status === "fulfilled") {
    const user = (profileRes.value as LeetCodeProfileResponse).data?.matchedUser;
    if (user) {
      ranking = user.profile?.ranking || 0;
      const stats = user.submitStatsGlobal?.acSubmissionNum || [];
      for (const s of stats) {
        const count = s.count ?? 0;
        if (s.difficulty === "All") totalSolved = count;
        if (s.difficulty === "Easy") easySolved = count;
        if (s.difficulty === "Medium") mediumSolved = count;
        if (s.difficulty === "Hard") hardSolved = count;
      }
    }
  }

  let contestRating = 0,
    topPercentage = 0;

  if (contestRes.status === "fulfilled") {
    const contest = (contestRes.value as LeetCodeContestResponse).data?.userContestRanking;
    if (contest) {
      contestRating = Math.round(contest.rating || 0);
      topPercentage = Math.round((contest.topPercentage || 0) * 10) / 10;
    }
  }

  return {
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    contestRating,
    topPercentage,
    ranking,
  };
}
