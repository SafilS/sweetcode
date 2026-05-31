import { cache } from "react";
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
    } catch (_) {}
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("name, slug").order("name");
  if (error) throw error;

  const result = data ?? [];
  if (redis && result.length) {
    try {
      await redis.set("problems:tags", JSON.stringify(result), "EX", 86400); // 24 hours
    } catch (_) {}
  }

  return result;
});


function normalizePage(value?: string) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export const getProblems = cache(async (filters: { difficulty?: string; tag?: string; q?: string; page?: string }): Promise<ProblemListResult> => {
  const pageSize = 100;
  const page = normalizePage(filters.page);

  if (!isSupabaseConfigured()) {
    const filtered = sampleProblems
      .map(sampleToListItem)
      .filter((problem) => !filters.difficulty || problem.difficulty === filters.difficulty.toUpperCase())
      .filter((problem) => !filters.q || `${problem.problem_number} ${problem.title}`.toLowerCase().includes(filters.q.toLowerCase()))
      .filter((problem) => !filters.tag || problem.problem_tags?.some((tag) => tag.tags.slug === filters.tag));

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
  const cacheKey = `problems:list:raw:${filters.difficulty ?? ""}:${filters.tag ?? ""}:${filters.q ?? ""}:${page}`;
  const redis = getRedisClient();
  let cachedData: { items: ProblemListItem[]; total: number } | null = null;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) cachedData = JSON.parse(cached);
    } catch (_) {}
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

    const { data, error, count } = await query;
    if (error) throw error;

    items = (data ?? []) as unknown as ProblemListItem[];
    total = count ?? 0;

    if (redis && items.length) {
      try {
        await redis.set(cacheKey, JSON.stringify({ items, total }), "EX", 3600); // 1 hour
      } catch (_) {}
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

export const getProblemBySlug = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) {
    const sample = sampleProblems.find((problem) => slugify(problem.title) === slug);
    if (!sample) throw new Error("Problem not found");
    return sampleToDetail(sample);
  }

  const cacheKey = `problem:detail:${slug}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
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

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(problem), "EX", 86400); // 24 hours
    } catch (_) {}
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
    } catch (_) {}
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
    } catch (_) {}
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

