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

async function queryLeetCode(
  query: string,
  variables: Record<string, string>
) {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error("LeetCode API request failed");
  return res.json();
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
    const user = profileRes.value?.data?.matchedUser;
    if (user) {
      ranking = user.profile?.ranking || 0;
      const stats = user.submitStatsGlobal?.acSubmissionNum || [];
      for (const s of stats) {
        if (s.difficulty === "All") totalSolved = s.count;
        if (s.difficulty === "Easy") easySolved = s.count;
        if (s.difficulty === "Medium") mediumSolved = s.count;
        if (s.difficulty === "Hard") hardSolved = s.count;
      }
    }
  }

  let contestRating = 0,
    topPercentage = 0;

  if (contestRes.status === "fulfilled") {
    const contest = contestRes.value?.data?.userContestRanking;
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
