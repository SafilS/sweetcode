import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sampleProblems from "@/data/sample-problems.json";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getRedisClient } from "@/lib/redis";


export type ProblemListItem = {
  id: string;
  problem_number: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  is_premium: boolean;
  user_status?: ProgressStatus | null;
  is_bookmarked?: boolean;
  problem_tags?: { tags: { name: string; slug: string } }[];
};

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "SOLVED" | "REVISITING";

export type ProblemListResult = {
  items: ProblemListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ProblemDetail = {
  id: string;
  problem_number: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  is_premium: boolean;
  remark: string | null;
  source_link: string | null;
  problem_texts: {
    description: string;
    examples: string[];
    constraints: string[];
  } | null;
  problem_tags: { tags: { name: string; slug: string } }[];
  editorial_screenshots?: {
    id: string;
    image_url: string;
    source_url: string | null;
    caption: string | null;
    sort_order: number;
  }[];
  solution_approaches: {
    id: string;
    title: string;
    explanation: string | null;
    time_complexity: string | null;
    space_complexity: string | null;
    sort_order: number;
    code_snippets: {
      id: string;
      language: string;
      code: string;
    }[];
  }[];
};

export type MyLearningProblem = {
  id: string;
  problem_number: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

export type MyLearningDashboard = {
  signedIn: boolean;
  totals: {
    solved: number;
    inProgress: number;
    revisiting: number;
    bookmarked: number;
    notes: number;
  };
  progressByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number>;
  totalProblemsByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number>;
  inProgress: MyLearningProblem[];
  revisiting: MyLearningProblem[];
  bookmarks: MyLearningProblem[];
  recentNotes: {
    content: string;
    updated_at: string;
    problems: MyLearningProblem;
  }[];
};


type SampleProblem = (typeof sampleProblems)[number];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sampleToListItem(problem: SampleProblem): ProblemListItem {
  return {
    id: problem.number,
    problem_number: problem.number,
    title: problem.title,
    slug: slugify(problem.title),
    difficulty: problem.difficulty.toUpperCase() as ProblemListItem["difficulty"],
    is_premium: Boolean(problem.is_premium),
    problem_tags: problem.tags.map((tag) => ({ tags: { name: tag, slug: slugify(tag) } }))
  };
}

function sampleToDetail(problem: SampleProblem): ProblemDetail {
  return {
    id: problem.number,
    problem_number: problem.number,
    title: problem.title,
    slug: slugify(problem.title),
    difficulty: problem.difficulty.toUpperCase() as ProblemDetail["difficulty"],
    is_premium: Boolean(problem.is_premium),
    remark: problem.remark,
    source_link: problem.link,
    problem_texts: {
      description: problem.description,
      examples: problem.examples,
      constraints: problem.constraints
    },
    problem_tags: problem.tags.map((tag) => ({ tags: { name: tag, slug: slugify(tag) } })),
    solution_approaches: problem.solutions.map((solution, index) => ({
      id: `${problem.number}-${index}`,
      title: solution.approach,
      explanation: solution.explanation,
      time_complexity: solution.time_complexity,
      space_complexity: solution.space_complexity,
      sort_order: index,
      code_snippets: Object.entries(solution.code).map(([language, code]) => ({
        id: `${problem.number}-${index}-${language}`,
        language,
        code
      }))
    }))
  };
}

export const getTags = cache(async () => {
  if (!isSupabaseConfigured()) {
    const tags = new Map<string, { name: string; slug: string }>();
    sampleProblems.flatMap((problem) => problem.tags).forEach((tag) => {
      tags.set(slugify(tag), { name: tag, slug: slugify(tag) });
    });
    return Array.from(tags.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get("problems:tags");
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("name, slug").order("name");
  if (error) throw error;

  const result = data ?? [];
  if (redis && result.length) {
    try {
      await redis.set("problems:tags", JSON.stringify(result), "EX", 86400); // 24 hours
    } catch {}
  }

  return result;
});


function normalizePage(value?: string) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export const getProblems = cache(async (filters: { difficulty?: string; tag?: string; q?: string; premium?: string; page?: string }): Promise<ProblemListResult> => {
  const pageSize = 100;
  const page = normalizePage(filters.page);

  if (!isSupabaseConfigured()) {
    const filtered = sampleProblems
      .map(sampleToListItem)
      .filter((problem) => !filters.difficulty || problem.difficulty === filters.difficulty.toUpperCase())
      .filter((problem) => !filters.q || `${problem.problem_number} ${problem.title}`.toLowerCase().includes(filters.q.toLowerCase()))
      .filter((problem) => !filters.tag || problem.problem_tags?.some((tag) => tag.tags.slug === filters.tag))
      .filter((problem) => !filters.premium || filters.premium !== "true" || problem.is_premium === true);

    const from = (page - 1) * pageSize;
    return {
      items: filtered.slice(from, from + pageSize).map((problem) => ({
        ...problem,
        user_status: null,
        is_bookmarked: false
      })),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize))
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = await createClient();
  const cacheKey = `problems:list:raw:${filters.difficulty ?? ""}:${filters.tag ?? ""}:${filters.q ?? ""}:${filters.premium ?? ""}:${page}`;
  const redis = getRedisClient();
  let cachedData: { items: ProblemListItem[]; total: number } | null = null;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) cachedData = JSON.parse(cached);
    } catch {}
  }

  let items: ProblemListItem[] = [];
  let total = 0;

  if (cachedData) {
    items = cachedData.items;
    total = cachedData.total;
  } else {
    let query = supabase
      .from("problems")
      .select(
        filters.tag
          ? "id, problem_number, title, slug, difficulty, is_premium, problem_tags!inner(tags!inner(name, slug))"
          : "id, problem_number, title, slug, difficulty, is_premium, problem_tags(tags(name, slug))",
        { count: "exact" }
      )
      .order("problem_number", { ascending: true })
      .range(from, to);

    if (filters.difficulty) {
      query = query.eq("difficulty", filters.difficulty.toUpperCase());
    }

    if (filters.tag) {
      query = query.eq("problem_tags.tags.slug", filters.tag);
    }

    if (filters.q) {
      query = query.or(`title.ilike.%${filters.q}%,problem_number.ilike.%${filters.q}%`);
    }

    if (filters.premium === "true") {
      query = query.eq("is_premium", true);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    items = (data ?? []) as unknown as ProblemListItem[];
    total = count ?? 0;

    if (redis && items.length) {
      try {
        await redis.set(cacheKey, JSON.stringify({ items, total }), "EX", 3600); // 1 hour
      } catch {}
    }
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && items.length) {
    const { data: progressRows, error: progressError } = await supabase
      .from("user_problem_progress")
      .select("problem_id, status")
      .eq("user_id", user.id)
      .in("problem_id", items.map((problem) => problem.id));

    if (progressError) throw progressError;

    const typedProgressRows = (progressRows ?? []) as { problem_id: string; status: ProgressStatus }[];
    const statusByProblemId = new Map<string, ProgressStatus>(
      typedProgressRows.map((row) => [row.problem_id, row.status])
    );

    for (const problem of items) {
      problem.user_status = statusByProblemId.get(problem.id) ?? null;
    }

    const { data: bookmarkRows, error: bookmarkError } = await supabase
      .from("bookmarks")
      .select("problem_id")
      .eq("user_id", user.id)
      .in("problem_id", items.map((problem) => problem.id));

    if (bookmarkError) throw bookmarkError;

    const typedBookmarkRows = (bookmarkRows ?? []) as { problem_id: string }[];
    const bookmarkedProblemIds = new Set(typedBookmarkRows.map((row) => row.problem_id));
    for (const problem of items) {
      problem.is_bookmarked = bookmarkedProblemIds.has(problem.id);
    }
  }

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
});

let cachedCsvScreenshots: Map<string, { id: string; image_url: string; source_url: string | null; caption: string | null; sort_order: number }[]> | null = null;

async function getLocalCsvScreenshots() {
  if (cachedCsvScreenshots) return cachedCsvScreenshots;

  const map = new Map<string, { id: string; image_url: string; source_url: string | null; caption: string | null; sort_order: number }[]>();
  try {
    const csvPath = path.join(process.cwd(), "leetcode_editorial_screenshots.csv");
    const content = await readFile(csvPath, "utf8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim());

    for (const [index, line] of lines.entries()) {
      if (index === 0 && line.startsWith("problem_number,")) continue;

      const parts = line.split(",");
      if (parts.length < 5) continue;

      const problemNumber = parts[0]?.trim();
      const sourceUrl = parts.at(-1)?.trim();
      const folder = parts.at(-2)?.trim();
      const problemTitle = parts[1]?.trim();
      const screenshotFilename = parts.slice(2, -2).join(",").trim();

      if (!problemNumber || !problemTitle || !folder || !sourceUrl) continue;

      const normNum = String(Number(problemNumber));

      // Build image URL
      const normFilename = screenshotFilename.toLowerCase().endsWith(".png")
        ? screenshotFilename
        : `${problemNumber.padStart(3, "0")}. ${problemTitle}.png`;
      const encodedFolder = encodeURIComponent(folder).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
      const encodedFilename = encodeURIComponent(normFilename).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
      const imageUrl = `https://raw.githubusercontent.com/akhilkammila/leetcode-screenshotter/main/editorial-screenshots/${encodedFolder}/${encodedFilename}`;

      if (!map.has(normNum)) {
        map.set(normNum, []);
      }
      map.get(normNum)!.push({
        id: `${normNum}-${index}`,
        image_url: imageUrl,
        source_url: sourceUrl,
        caption: `LeetCode editorial screenshot for ${problemTitle}`,
        sort_order: index
      });
    }
  } catch (error) {
    console.error("Error parsing local screenshots CSV:", error);
  }

  cachedCsvScreenshots = map;
  return map;
}

export const getProblemBySlug = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) {
    const sample = sampleProblems.find((problem) => slugify(problem.title) === slug);
    if (!sample) throw new Error("Problem not found");
    const detail = sampleToDetail(sample);
    const localScreenshots = await getLocalCsvScreenshots();
    const normNum = String(Number(detail.problem_number));
    detail.editorial_screenshots = localScreenshots.get(normNum) ?? [];
    return detail;
  }

  const cacheKey = `problem:detail:${slug}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problems")
    .select(
      `
        id,
        problem_number,
        title,
        slug,
        difficulty,
        is_premium,
        remark,
        source_link,
        problem_texts(description, examples, constraints),
        problem_tags(tags(name, slug)),
        editorial_screenshots(id, image_url, source_url, caption, sort_order),
        solution_approaches(
          id,
          title,
          explanation,
          time_complexity,
          space_complexity,
          sort_order,
          code_snippets(id, language, code)
        )
      `
    )
    .eq("slug", slug)
    .single();

  if (error) throw error;

  const problem = data as unknown as ProblemDetail;
  problem.solution_approaches = [...(problem.solution_approaches ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  problem.solution_approaches = problem.solution_approaches.map((approach) => ({
    ...approach,
    code_snippets: [...(approach.code_snippets ?? [])].sort((a, b) =>
      a.language.localeCompare(b.language)
    )
  }));

  if (problem.editorial_screenshots) {
    problem.editorial_screenshots = [...problem.editorial_screenshots].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(problem), "EX", 86400); // 24 hours
    } catch {}
  }

  return problem;
});


export const getProblemProgress = cache(async (problemId: string) => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_problem_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("problem_id", problemId)
    .maybeSingle();

  if (error) throw error;
  return (data?.status as ProgressStatus | undefined) ?? null;
});

export const getProblemLearningState = cache(async (problemId: string) => {
  if (!isSupabaseConfigured()) {
    return {
      isBookmarked: false,
      note: null
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isBookmarked: false,
      note: null
    };
  }

  const [bookmarkResult, noteResult] = await Promise.all([
    supabase
      .from("bookmarks")
      .select("problem_id")
      .eq("user_id", user.id)
      .eq("problem_id", problemId)
      .maybeSingle(),
    supabase
      .from("user_notes")
      .select("content")
      .eq("user_id", user.id)
      .eq("problem_id", problemId)
      .maybeSingle()
  ]);

  if (bookmarkResult.error) throw bookmarkResult.error;
  if (noteResult.error) throw noteResult.error;

  return {
    isBookmarked: Boolean(bookmarkResult.data),
    note: (noteResult.data?.content as string | undefined) ?? null
  };
});

export const getMyLearningDashboard = cache(async (): Promise<MyLearningDashboard> => {
  const empty: MyLearningDashboard = {
    signedIn: false,
    totals: {
      solved: 0,
      inProgress: 0,
      revisiting: 0,
      bookmarked: 0,
      notes: 0
    },
    progressByDifficulty: {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    },
    totalProblemsByDifficulty: {
      EASY: sampleProblems.filter((p) => p.difficulty.toUpperCase() === "EASY").length,
      MEDIUM: sampleProblems.filter((p) => p.difficulty.toUpperCase() === "MEDIUM").length,
      HARD: sampleProblems.filter((p) => p.difficulty.toUpperCase() === "HARD").length
    },
    inProgress: [],
    revisiting: [],
    bookmarks: [],
    recentNotes: []
  };

  if (!isSupabaseConfigured()) return empty;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return empty;

  const cacheKey = `user:${user.id}:dashboard`;
  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  const [progressResult, bookmarksResult, notesResult, easyCount, mediumCount, hardCount] = await Promise.all([
    supabase
      .from("user_problem_progress")
      .select("status, last_viewed_at, problems(id, problem_number, title, slug, difficulty)")
      .eq("user_id", user.id)
      .order("last_viewed_at", { ascending: false }),
    supabase
      .from("bookmarks")
      .select("created_at, problems(id, problem_number, title, slug, difficulty)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("user_notes")
      .select("content, updated_at, problems(id, problem_number, title, slug, difficulty)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase.from("problems").select("id", { count: "exact", head: true }).eq("difficulty", "EASY"),
    supabase.from("problems").select("id", { count: "exact", head: true }).eq("difficulty", "MEDIUM"),
    supabase.from("problems").select("id", { count: "exact", head: true }).eq("difficulty", "HARD")
  ]);

  if (progressResult.error) throw progressResult.error;
  if (bookmarksResult.error) throw bookmarksResult.error;
  if (notesResult.error) throw notesResult.error;

  const progressRows = (progressResult.data ?? []) as unknown as {
    status: ProgressStatus;
    problems: MyLearningProblem;
  }[];
  const bookmarkRows = (bookmarksResult.data ?? []) as unknown as {
    problems: MyLearningProblem;
  }[];
  const noteRows = (notesResult.data ?? []) as unknown as {
    content: string;
    updated_at: string;
    problems: MyLearningProblem;
  }[];

  const totals = {
    solved: progressRows.filter((row) => row.status === "SOLVED").length,
    inProgress: progressRows.filter((row) => row.status === "IN_PROGRESS").length,
    revisiting: progressRows.filter((row) => row.status === "REVISITING").length,
    bookmarked: bookmarkRows.length,
    notes: noteRows.length
  };

  const progressByDifficulty = progressRows
    .filter((row) => row.status === "SOLVED")
    .reduce(
      (counts, row) => {
        counts[row.problems.difficulty] += 1;
        return counts;
      },
      { EASY: 0, MEDIUM: 0, HARD: 0 } as Record<"EASY" | "MEDIUM" | "HARD", number>
    );

  const totalProblemsByDifficulty = {
    EASY: easyCount.count ?? 0,
    MEDIUM: mediumCount.count ?? 0,
    HARD: hardCount.count ?? 0
  };

  const dashboardData = {
    signedIn: true,
    totals,
    progressByDifficulty,
    totalProblemsByDifficulty,
    inProgress: progressRows
      .filter((row) => row.status === "IN_PROGRESS")
      .slice(0, 8)
      .map((row) => row.problems),
    revisiting: progressRows
      .filter((row) => row.status === "REVISITING")
      .slice(0, 8)
      .map((row) => row.problems),
    bookmarks: bookmarkRows.map((row) => row.problems),
    recentNotes: noteRows
  };

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(dashboardData), "EX", 7200); // 2 hours
    } catch {}
  }

  return dashboardData;

});


export type DiscussionThread = {
  id: string;
  problem_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    username: string | null;
    avatar_url: string | null;
  };
  replies_count: number;
  upvotes_count: number;
  has_voted: boolean;
};

export type DiscussionReply = {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    username: string | null;
    avatar_url: string | null;
  };
};

export const getDiscussionThreads = async (
  problemId: string,
  currentUserId?: string
): Promise<DiscussionThread[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discussion_threads")
    .select(`
      id,
      problem_id,
      user_id,
      title,
      content,
      created_at,
      updated_at,
      profiles!user_id (
        username,
        avatar_url
      ),
      discussion_replies (id),
      discussion_thread_votes (user_id)
    `)
    .eq("problem_id", problemId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      console.warn("Discussion threads table not found. Please run the SQL migration script: supabase/migrations/002_discussion_schema.sql");
    } else {
      console.error("Error fetching discussion threads:", error.message, "code:", error.code, "details:", error.details);
    }
    return [];
  }

  const rawThreads = (data ?? []) as {
    id: string;
    problem_id: string;
    user_id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    profiles: { username: string | null; avatar_url: string | null } | { username: string | null; avatar_url: string | null }[] | null;
    discussion_replies: { id: string }[] | null;
    discussion_thread_votes: { user_id: string }[] | null;
  }[];

  return rawThreads.map((thread) => {
    const repliesCount = thread.discussion_replies?.length ?? 0;
    const upvotesCount = thread.discussion_thread_votes?.length ?? 0;
    const hasVoted = currentUserId
      ? thread.discussion_thread_votes?.some((v) => v.user_id === currentUserId) ?? false
      : false;

    const authorProfile = Array.isArray(thread.profiles) ? thread.profiles[0] : thread.profiles;

    return {
      id: thread.id,
      problem_id: thread.problem_id,
      user_id: thread.user_id,
      title: thread.title,
      content: thread.content,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      author: {
        username: authorProfile?.username ?? "Anonymous",
        avatar_url: authorProfile?.avatar_url ?? null
      },
      replies_count: repliesCount,
      upvotes_count: upvotesCount,
      has_voted: hasVoted
    };
  });
};

export const getDiscussionReplies = async (
  threadId: string
): Promise<DiscussionReply[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discussion_replies")
    .select(`
      id,
      thread_id,
      user_id,
      content,
      created_at,
      updated_at,
      profiles!user_id (
        username,
        avatar_url
      )
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      console.warn("Discussion replies table not found. Please run the SQL migration script: supabase/migrations/002_discussion_schema.sql");
    } else {
      console.error("Error fetching discussion replies:", error.message, "code:", error.code, "details:", error.details);
    }
    return [];
  }

  const rawReplies = (data ?? []) as {
    id: string;
    thread_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    profiles: { username: string | null; avatar_url: string | null } | { username: string | null; avatar_url: string | null }[] | null;
  }[];

  return rawReplies.map((reply) => {
    const authorProfile = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles;
    return {
      id: reply.id,
      thread_id: reply.thread_id,
      user_id: reply.user_id,
      content: reply.content,
      created_at: reply.created_at,
      updated_at: reply.updated_at,
      author: {
        username: authorProfile?.username ?? "Anonymous",
        avatar_url: authorProfile?.avatar_url ?? null
      }
    };
  });
};

export type StudyPlan = {
  slug: string;
  title: string;
  description: string;
  limit: number;
  tags: string[];
  color: string;
};

export const STUDY_PLANS: Record<string, StudyPlan> = {
  "leetcode-75": {
    slug: "leetcode-75",
    title: "LeetCode 75",
    description: "A structured, highly recommended path covering core data structures, trees, DP, and graphs.",
    limit: 75,
    tags: ["array", "two-pointers", "sliding-window", "hash-table", "stack", "linked-list", "tree", "graph", "binary-search", "dynamic-programming"],
    color: "cyan"
  },
  "top-150": {
    slug: "top-150",
    title: "Top Interview 150",
    description: "The ultimate compilation of classic technical questions asked in major company interviews.",
    limit: 150,
    tags: ["array", "two-pointers", "sliding-window", "hash-table", "stack", "linked-list", "tree", "graph", "binary-search", "dynamic-programming", "backtracking", "divide-and-conquer", "heap", "intervals", "greedy", "math", "bit-manipulation"],
    color: "purple"
  },
  "dp-classics": {
    slug: "dp-classics",
    title: "Dynamic Programming Classics",
    description: "Master bottom-up and top-down DP with selected classical optimization problems.",
    limit: 25,
    tags: ["dynamic-programming"],
    color: "indigo"
  }
};

export type StudyPlanData = {
  plan: StudyPlan;
  problems: ProblemListItem[];
  solvedCount: number;
};

const LEETCODE_75_TITLES = [
  "Merge Strings Alternately",
  "Greatest Common Divisor of Strings",
  "Kids With the Greatest Number of Candies",
  "Can Place Flowers",
  "Reverse Vowels of a String",
  "Reverse Words in a String",
  "Product of Array Except Self",
  "Increasing Triplet Subsequence",
  "String Compression",
  "Move Zeroes",
  "Is Subsequence",
  "Container With Most Water",
  "Max Number of K-Sum Pairs",
  "Maximum Average Subarray I",
  "Maximum Number of Vowels in a Substring of Given Length",
  "Max Consecutive Ones III",
  "Longest Subarray of 1's After Deleting One Element",
  "Find the Highest Altitude",
  "Find Pivot Index",
  "Find the Difference of Two Arrays",
  "Unique Number of Occurrences",
  "Determine if Two Strings Are Close",
  "Equal Row and Column Pairs",
  "Removing Stars From a String",
  "Asteroid Collision",
  "Decode String",
  "Number of Recent Calls",
  "Dota2 Senate",
  "Delete the Middle Node of a Linked List",
  "Odd Even Linked List",
  "Reverse Linked List",
  "Maximum Twin Sum of a Linked List",
  "Maximum Depth of Binary Tree",
  "Leaf-Similar Trees",
  "Count Good Nodes in Binary Tree",
  "Path Sum III",
  "Longest ZigZag Path in a Binary Tree",
  "Lowest Common Ancestor of a Binary Tree",
  "Binary Tree Right Side View",
  "Maximum Level Sum of a Binary Tree",
  "Search in a Binary Search Tree",
  "Delete Node in a BST",
  "Keys and Rooms",
  "Number of Provinces",
  "Reorder Routes to Make All Paths Lead to the City Zero",
  "Evaluate Division",
  "Nearest Exit from Entrance in Maze",
  "Rotting Oranges",
  "Kth Largest Element in an Array",
  "Smallest Number in Infinite Set",
  "Maximum Subsequence Score",
  "Total Cost to Hire K Workers",
  "Guess Number Higher or Lower",
  "Successful Pairs of Spells and Potions",
  "Find Peak Element",
  "Koko Eating Bananas",
  "Letter Combinations of a Phone Number",
  "Combination Sum III",
  "N-th Tribonacci Number",
  "Min Cost Climbing Stairs",
  "House Robber",
  "Domino and Tromino Tiling",
  "Unique Paths",
  "Longest Common Subsequence",
  "Best Time to Buy and Sell Stock with Transaction Fee",
  "Edit Distance",
  "Counting Bits",
  "Single Number",
  "Minimum Flips to Make a OR b Equal to c",
  "Implement Trie (Prefix Tree)",
  "Search Suggestions System",
  "Non-overlapping Intervals",
  "Minimum Number of Arrows to Burst Balloons",
  "Daily Temperatures",
  "Online Stock Span"
];

const TOP_150_TITLES = [
  "Merge Sorted Array",
  "Remove Element",
  "Remove Duplicates from Sorted Array",
  "Remove Duplicates from Sorted Array II",
  "Majority Element",
  "Rotate Array",
  "Best Time to Buy and Sell Stock",
  "Best Time to Buy and Sell Stock II",
  "Jump Game",
  "Jump Game II",
  "H-Index",
  "Insert Delete GetRandom O(1)",
  "Product of Array Except Self",
  "Gas Station",
  "Candy",
  "Trapping Rain Water",
  "Roman to Integer",
  "Integer to Roman",
  "Length of Last Word",
  "Longest Common Prefix",
  "Reverse Words in a String",
  "Zigzag Conversion",
  "Find the Index of the First Occurrence in a String",
  "Text Justification",
  "Valid Palindrome",
  "Is Subsequence",
  "Two Sum II - Input Array Is Sorted",
  "Container With Most Water",
  "3Sum",
  "Minimum Size Subarray Sum",
  "Longest Substring Without Repeating Characters",
  "Substring with Concatenation of All Words",
  "Minimum Window Substring",
  "Valid Sudoku",
  "Spiral Matrix",
  "Rotate Image",
  "Set Matrix Zeroes",
  "Game of Life",
  "Ransom Note",
  "Isomorphic Strings",
  "Word Pattern",
  "Valid Anagram",
  "Group Anagrams",
  "Two Sum",
  "Happy Number",
  "Contains Duplicate II",
  "Longest Consecutive Sequence",
  "Summary Ranges",
  "Merge Intervals",
  "Insert Interval",
  "Minimum Number of Arrows to Burst Balloons",
  "Valid Parentheses",
  "Simplify Path",
  "Min Stack",
  "Evaluate Reverse Polish Notation",
  "Basic Calculator",
  "Linked List Cycle",
  "Add Two Numbers",
  "Merge Two Sorted Lists",
  "Copy List with Random Pointer",
  "Reverse Linked List II",
  "Reverse Nodes in k-Group",
  "Remove Nth Node From End of List",
  "Remove Duplicates from Sorted List II",
  "Rotate List",
  "Partition List",
  "LRU Cache",
  "Maximum Depth of Binary Tree",
  "Same Tree",
  "Invert Binary Tree",
  "Symmetric Tree",
  "Construct Binary Tree from Preorder and Inorder Traversal",
  "Construct Binary Tree from Inorder and Postorder Traversal",
  "Populating Next Right Pointers in Each Node II",
  "Flatten Binary Tree to Linked List",
  "Path Sum",
  "Sum Root to Leaf Numbers",
  "Binary Tree Maximum Path Sum",
  "Binary Search Tree Iterator",
  "Count Complete Tree Nodes",
  "Lowest Common Ancestor of a Binary Tree",
  "Binary Tree Right Side View",
  "Average of Levels in Binary Tree",
  "Binary Tree Level Order Traversal",
  "Binary Tree Zigzag Level Order Traversal",
  "Minimum Absolute Difference in BST",
  "Kth Smallest Element in a BST",
  "Validate Binary Search Tree",
  "Number of Islands",
  "Surrounded Regions",
  "Clone Graph",
  "Evaluate Division",
  "Course Schedule",
  "Course Schedule II",
  "Snakes and Ladders",
  "Minimum Genetic Mutation",
  "Word Ladder",
  "Implement Trie (Prefix Tree)",
  "Design Add and Search Words Data Structure",
  "Word Search II",
  "Letter Combinations of a Phone Number",
  "Combinations",
  "Permutations",
  "Combination Sum",
  "N-Queens II",
  "Generate Parentheses",
  "Word Search",
  "Convert Sorted Array to Binary Search Tree",
  "Sort List",
  "Construct Quad Tree",
  "Merge k Sorted Lists",
  "Maximum Subarray",
  "Maximum Sum Circular Subarray",
  "Search Insert Position",
  "Search a 2D Matrix",
  "Find Peak Element",
  "Search in Rotated Sorted Array",
  "Find First and Last Position of Element in Sorted Array",
  "Find Minimum in Rotated Sorted Array",
  "Median of Two Sorted Arrays",
  "Kth Largest Element in an Array",
  "IPO",
  "Find K Pairs with Smallest Sums",
  "Find Median from Data Stream",
  "Add Binary",
  "Reverse Bits",
  "Number of 1 Bits",
  "Single Number",
  "Single Number II",
  "Bitwise AND of Numbers Range",
  "Palindrome Number",
  "Plus One",
  "Factorial Trailing Zeroes",
  "Sqrt(x)",
  "Pow(x, n)",
  "Max Points on a Line",
  "Climbing Stairs",
  "House Robber",
  "Word Break",
  "Coin Change",
  "Longest Increasing Subsequence",
  "Triangle",
  "Minimum Path Sum",
  "Unique Paths II",
  "Longest Palindromic Substring",
  "Interleaving String",
  "Edit Distance",
  "Best Time to Buy and Sell Stock III",
  "Best Time to Buy and Sell Stock IV",
  "Maximal Square"
];

export async function getStudyPlanData(slug: string): Promise<StudyPlanData | null> {
  const plan = STUDY_PLANS[slug];
  if (!plan) return null;

  if (!isSupabaseConfigured()) {
    let problems = sampleProblems
      .map(sampleToListItem)
      .filter((problem) => {
        if (plan.slug === "leetcode-75") {
          return LEETCODE_75_TITLES.includes(problem.title);
        }
        if (plan.slug === "top-150") {
          return TOP_150_TITLES.includes(problem.title);
        }
        return problem.problem_tags?.some((pt) => plan.tags.includes(pt.tags.slug));
      });

    if (plan.slug === "leetcode-75") {
      problems.sort((a, b) => LEETCODE_75_TITLES.indexOf(a.title) - LEETCODE_75_TITLES.indexOf(b.title));
    } else if (plan.slug === "top-150") {
      problems.sort((a, b) => TOP_150_TITLES.indexOf(a.title) - TOP_150_TITLES.indexOf(b.title));
    } else {
      problems = problems.slice(0, plan.limit);
    }

    return {
      plan,
      problems,
      solvedCount: 0
    };
  }

  const supabase = await createClient();
  
  let query = supabase
    .from("problems")
    .select("id, problem_number, title, slug, difficulty, is_premium, problem_tags(tags(name, slug))");

  if (plan.slug === "leetcode-75") {
    query = query.in("title", LEETCODE_75_TITLES);
  } else if (plan.slug === "top-150") {
    query = query.in("title", TOP_150_TITLES);
  } else {
    query = query
      .in("problem_tags.tags.slug", plan.tags)
      .order("problem_number", { ascending: true })
      .limit(plan.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching study plan problems:", error);
    return null;
  }

  let items = (data ?? []) as unknown as ProblemListItem[];
  
  if (plan.slug === "leetcode-75") {
    items.sort((a, b) => LEETCODE_75_TITLES.indexOf(a.title) - LEETCODE_75_TITLES.indexOf(b.title));
  } else if (plan.slug === "top-150") {
    items.sort((a, b) => TOP_150_TITLES.indexOf(a.title) - TOP_150_TITLES.indexOf(b.title));
  }
  
  let solvedCount = 0;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && items.length) {
    const { data: progressRows, error: progressError } = await supabase
      .from("user_problem_progress")
      .select("problem_id, status")
      .in("problem_id", items.map((item) => item.id));

    if (!progressError && progressRows) {
      const progressMap = new Map(progressRows.map((r) => [r.problem_id, r.status]));
      items = items.map((item) => ({
        ...item,
        user_status: progressMap.get(item.id) ?? "NOT_STARTED"
      }));
      solvedCount = progressRows.filter((r) => r.status === "SOLVED").length;
    }

    const { data: bookmarksRows, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("problem_id")
      .in("problem_id", items.map((item) => item.id));

    if (!bookmarksError && bookmarksRows) {
      const bookmarkedSet = new Set(bookmarksRows.map((r) => r.problem_id));
      items = items.map((item) => ({
        ...item,
        is_bookmarked: bookmarkedSet.has(item.id)
      }));
    }
  }

  return {
    plan,
    problems: items,
    solvedCount
  };
}

