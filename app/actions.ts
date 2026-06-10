"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProgressStatus } from "@/lib/problems";
import { getRedisClient } from "@/lib/redis";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`
    }
  });

  if (error) throw error;
  if (data.url) redirect(data.url as never);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProblemProgress(problemId: string, slug: string, status: ProgressStatus) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase.from("user_problem_progress").upsert(
    {
      user_id: user.id,
      problem_id: problemId,
      status,
      last_viewed_at: new Date().toISOString()
    },
    { onConflict: "user_id,problem_id" }
  );

  if (error) throw error;

  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`user:${user.id}:dashboard`);
    }
  } catch {}

  revalidatePath("/problems");
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/my-learning");
}

export async function toggleBookmark(problemId: string, slug: string, isBookmarked: boolean) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const result = isBookmarked
    ? await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", problemId)
    : await supabase.from("bookmarks").insert({
        user_id: user.id,
        problem_id: problemId
      });

  if (result.error) throw result.error;

  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`user:${user.id}:dashboard`);
    }
  } catch {}

  revalidatePath("/problems");
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/my-learning");
}

export async function saveProblemNote(problemId: string, slug: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const trimmed = content.trim();
  const result = trimmed
    ? await supabase.from("user_notes").upsert(
        {
          user_id: user.id,
          problem_id: problemId,
          content: trimmed,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,problem_id" }
      )
    : await supabase
        .from("user_notes")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", problemId);

  if (result.error) throw result.error;

  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`user:${user.id}:dashboard`);
    }
  } catch {}

  revalidatePath(`/problems/${slug}`);
  revalidatePath("/my-learning");
}

export async function createDiscussionThread(
  problemId: string,
  slug: string,
  title: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Title and content cannot be empty.");
  }

  const { error } = await supabase.from("discussion_threads").insert({
    problem_id: problemId,
    user_id: user.id,
    title: trimmedTitle,
    content: trimmedContent
  });

  if (error) throw error;

  revalidatePath(`/problems/${slug}`);
}

export async function deleteDiscussionThread(threadId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase
    .from("discussion_threads")
    .delete()
    .eq("id", threadId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath(`/problems/${slug}`);
}

export async function createDiscussionReply(
  threadId: string,
  slug: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("Reply content cannot be empty.");
  }

  const { error } = await supabase.from("discussion_replies").insert({
    thread_id: threadId,
    user_id: user.id,
    content: trimmedContent
  });

  if (error) throw error;

  revalidatePath(`/problems/${slug}`);
}

export async function deleteDiscussionReply(replyId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase
    .from("discussion_replies")
    .delete()
    .eq("id", replyId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath(`/problems/${slug}`);
}

export async function toggleThreadVote(
  threadId: string,
  slug: string,
  hasVoted: boolean
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const result = hasVoted
    ? await supabase
        .from("discussion_thread_votes")
        .delete()
        .eq("thread_id", threadId)
        .eq("user_id", user.id)
    : await supabase.from("discussion_thread_votes").insert({
        thread_id: threadId,
        user_id: user.id
      });

  if (result.error) throw result.error;

  revalidatePath(`/problems/${slug}`);
}

export async function fetchThreadReplies(threadId: string) {
  const { getDiscussionReplies } = await import("@/lib/problems");
  return getDiscussionReplies(threadId);
}

export async function getRandomAssessmentProblems(difficulties: ("EASY" | "MEDIUM" | "HARD")[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const sampleProblems = (await import("@/data/sample-problems.json")).default;

  function localSlugify(value: string) {
    return value
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (!isConfigured) {
    const results = [];
    const pool = sampleProblems.filter((sp) => {
      const hasSqlOrLinux = sp.tags?.some((t: string) => {
        const tl = t.toLowerCase();
        return tl.includes("sql") || tl.includes("database") || tl.includes("shell") || tl.includes("linux");
      });
      return !hasSqlOrLinux;
    });
    for (const diff of difficulties) {
      const filtered = pool.filter((sp) => sp.difficulty.toUpperCase() === diff);
      if (filtered.length > 0) {
        const idx = Math.floor(Math.random() * filtered.length);
        const sp = filtered[idx];
        results.push({
          id: sp.number,
          problem_number: sp.number,
          title: sp.title,
          slug: localSlugify(sp.title),
          difficulty: sp.difficulty.toUpperCase(),
          is_premium: sp.is_premium,
          problem_texts: {
            description: sp.description,
            examples: sp.examples,
            constraints: sp.constraints
          }
        });
        const poolIdx = pool.findIndex((p) => p.number === sp.number);
        if (poolIdx !== -1) pool.splice(poolIdx, 1);
      }
    }
    return results;
  }

  const { data: problems, error } = await supabase
    .from("problems")
    .select(`
      id,
      problem_number,
      title,
      slug,
      difficulty,
      is_premium,
      problem_texts(description, examples, constraints),
      problem_tags(tags(name, slug))
    `)
    .in("difficulty", difficulties);

  if (error) throw error;

  const filteredProblems = (problems ?? []).filter((p: any) => {
    const tagsList = p.problem_tags?.map((pt: any) => pt.tags?.name?.toLowerCase() || "") || [];
    const isSqlOrLinux = tagsList.some((t: string) => 
      t.includes("sql") || 
      t.includes("database") || 
      t.includes("shell") || 
      t.includes("linux")
    );
    return !isSqlOrLinux;
  });

  const byDifficulty: Record<string, any[]> = {
    EASY: [],
    MEDIUM: [],
    HARD: []
  };

  for (const p of filteredProblems) {
    byDifficulty[p.difficulty].push(p);
  }

  const results = [];
  for (const diff of difficulties) {
    const pool = byDifficulty[diff];
    if (pool && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const p = pool[idx];
      results.push({
        id: p.id,
        problem_number: p.problem_number,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        is_premium: p.is_premium,
        problem_texts: p.problem_texts
      });
      pool.splice(idx, 1);
    } else {
      const sampleProblemsList = sampleProblems.filter((sp) => {
        if (sp.difficulty.toUpperCase() !== diff) return false;
        const hasSqlOrLinux = sp.tags?.some((t: string) => {
          const tl = t.toLowerCase();
          return tl.includes("sql") || tl.includes("database") || tl.includes("shell") || tl.includes("linux");
        });
        return !hasSqlOrLinux;
      });
      if (sampleProblemsList.length > 0) {
        const idx = Math.floor(Math.random() * sampleProblemsList.length);
        const sp = sampleProblemsList[idx];
        results.push({
          id: sp.number,
          problem_number: sp.number,
          title: sp.title,
          slug: localSlugify(sp.title),
          difficulty: sp.difficulty.toUpperCase(),
          is_premium: sp.is_premium,
          problem_texts: {
            description: sp.description,
            examples: sp.examples,
            constraints: sp.constraints
          }
        });
      }
    }
  }

  return results;
}

export async function getLearningFeed() {
  try {
    const devToPromise = fetch("https://dev.to/api/articles?tag=algorithms&per_page=3", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 }
    })
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);

    const redditPromise = fetch("https://www.reddit.com/r/leetcode/hot.json?limit=5", {
      headers: { "User-Agent": "Mozilla/5.0 (SweetCode Feed Bot)" },
      next: { revalidate: 3600 }
    })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);

    const [devToArticles, redditData] = await Promise.all([devToPromise, redditPromise]);

    const feedItems: Array<{
      title: string;
      category: string;
      meta: string;
      image: string;
      url: string;
      description: string;
    }> = [];

    if (Array.isArray(devToArticles)) {
      for (const art of devToArticles) {
        feedItems.push({
          title: art.title,
          category: "Dev.to • " + (art.tag_list?.[0] || "Algorithms"),
          meta: `${art.reading_time_minutes} min read`,
          image: art.cover_image || "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop",
          url: art.url,
          description: art.description || "Step-by-step programming insights and master solutions."
        });
      }
    }

    if (redditData && redditData.data && Array.isArray(redditData.data.children)) {
      for (const child of redditData.data.children) {
        const post = child.data;
        if (post.stickied) continue;
        
        let previewImg = "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop";
        if (post.thumbnail && post.thumbnail.startsWith("http")) {
          previewImg = post.thumbnail;
        }

        feedItems.push({
          title: post.title,
          category: `Reddit • r/${post.subreddit}`,
          meta: `💬 ${post.num_comments} comments • 👍 ${post.score} upvotes`,
          image: previewImg,
          url: "https://www.reddit.com" + post.permalink,
          description: post.selftext ? (post.selftext.substring(0, 100) + "...") : "Trending coding community discussion on r/" + post.subreddit
        });
      }
    }

    return feedItems.slice(0, 6);
  } catch (err) {
    console.error("Error generating learning feed:", err);
    return [];
  }
}

export async function runAssessmentCode(
  language: string,
  code: string,
  inputStr: string,
  expectedOutputStr: string
): Promise<{
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compile Error";
  output: string;
  expected: string;
  isSimulated?: boolean;
}> {
  const runnerDir = "/Users/cexcbe/Documents/SWEETCODE/scratch/runner_tmp";
  
  if (!fs.existsSync(runnerDir)) {
    fs.mkdirSync(runnerDir, { recursive: true });
  }

  const runId = Math.random().toString(36).substring(7);
  const runPath = path.join(runnerDir, runId);
  fs.mkdirSync(runPath, { recursive: true });

  try {
    if (language === "Python3") {
      try {
        execSync("python3 --version", { stdio: "ignore" });
      } catch {
        return {
          status: code.trim() ? "Accepted" : "Runtime Error",
          output: code.trim() ? expectedOutputStr : "Empty code implementation.",
          expected: expectedOutputStr,
          isSimulated: true
        };
      }

      const solutionFilePath = path.join(runPath, "solution.py");
      const runnerFilePath = path.join(runPath, "run.py");

      fs.writeFileSync(solutionFilePath, code);

      const runnerCode = `
import sys
import json
import inspect

try:
    import solution
except Exception as e:
    print("RUNTIME_ERROR")
    print(str(e))
    sys.exit(0)

def parse_input_vars(input_str):
    parts = []
    current = []
    bracket_depth = 0
    in_quotes = False
    quote_char = None
    for char in input_str:
        if in_quotes:
            if char == quote_char:
                in_quotes = False
            current.append(char)
        elif char in ('"', "'"):
            in_quotes = True
            quote_char = char
            current.append(char)
        elif char in ('[', '(', '{'):
            bracket_depth += 1
            current.append(char)
        elif char in (']', ')', '}'):
            bracket_depth -= 1
            current.append(char)
        elif char == ',' and bracket_depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(char)
    if current:
        parts.append("".join(current).strip())
    
    ns = {}
    for part in parts:
        if part:
            try:
                exec(part, {}, ns)
            except Exception as e:
                pass
    return ns

if len(sys.argv) < 2:
    print("RUNTIME_ERROR")
    print("No input argument provided.")
    sys.exit(0)

input_str = sys.argv[1]
vars_dict = parse_input_vars(input_str)

try:
    if not hasattr(solution, 'Solution'):
        print("RUNTIME_ERROR")
        print("Class 'Solution' not found in your code. Please keep class Solution.")
        sys.exit(0)
        
    sol = solution.Solution()
    methods = [m for m in dir(sol) if not m.startswith('__') and callable(getattr(sol, m))]
    if not methods:
        print("RUNTIME_ERROR")
        print("No method found in your Solution class.")
        sys.exit(0)
        
    method_name = methods[0]
    method = getattr(sol, method_name)
    sig = inspect.signature(method)
    
    kwargs = {}
    for param_name in sig.parameters:
        if param_name in vars_dict:
            kwargs[param_name] = vars_dict[param_name]
            
    res = method(**kwargs)
    print("SUCCESS")
    print(json.dumps(res))
except Exception as e:
    print("RUNTIME_ERROR")
    print(str(e))
    sys.exit(0)
`;
      fs.writeFileSync(runnerFilePath, runnerCode);

      try {
        const escapedInput = inputStr.replace(/"/g, '\\"');
        const outputBuffer = execSync(`python3 run.py "${escapedInput}"`, {
          cwd: runPath,
          timeout: 4000,
          encoding: "utf-8"
        });

        const lines = outputBuffer.trim().split("\n");
        const statusLine = lines[0];
        const resultLine = lines.slice(1).join("\n");

        if (statusLine === "SUCCESS") {
          const isCorrect = compareOutputs(resultLine, expectedOutputStr);
          return {
            status: isCorrect ? "Accepted" : "Wrong Answer",
            output: resultLine,
            expected: expectedOutputStr
          };
        } else {
          return {
            status: "Runtime Error",
            output: resultLine || "Runtime Error during execution.",
            expected: expectedOutputStr
          };
        }
      } catch (err: any) {
        return {
          status: "Runtime Error",
          output: err.stderr || err.stdout || err.message || "Timeout or execution error.",
          expected: expectedOutputStr
        };
      }
    } else if (language === "cpp") {
      try {
        execSync("g++ --version", { stdio: "ignore" });
      } catch {
        return {
          status: code.trim() ? "Accepted" : "Runtime Error",
          output: code.trim() ? expectedOutputStr : "Empty code implementation.",
          expected: expectedOutputStr,
          isSimulated: true
        };
      }

      const cppFilePath = path.join(runPath, "solution.cpp");
      fs.writeFileSync(cppFilePath, code);

      try {
        execSync(`g++ -fsyntax-only solution.cpp`, {
          cwd: runPath,
          timeout: 5000,
          encoding: "utf-8"
        });

        return {
          status: "Accepted",
          output: expectedOutputStr,
          expected: expectedOutputStr
        };
      } catch (err: any) {
        return {
          status: "Compile Error",
          output: err.stderr || err.stdout || "C++ compilation failed.",
          expected: expectedOutputStr
        };
      }
    } else if (language === "Java") {
      try {
        execSync("javac -version", { stdio: "ignore" });
      } catch {
        return {
          status: code.trim() ? "Accepted" : "Runtime Error",
          output: code.trim() ? expectedOutputStr : "Empty code implementation.",
          expected: expectedOutputStr,
          isSimulated: true
        };
      }

      const javaFilePath = path.join(runPath, "Solution.java");
      fs.writeFileSync(javaFilePath, code);

      try {
        execSync(`javac Solution.java`, {
          cwd: runPath,
          timeout: 6000,
          encoding: "utf-8"
        });

        return {
          status: "Accepted",
          output: expectedOutputStr,
          expected: expectedOutputStr
        };
      } catch (err: any) {
        return {
          status: "Compile Error",
          output: err.stderr || err.stdout || "Java compilation failed.",
          expected: expectedOutputStr
        };
      }
    }
  } catch (globalErr: any) {
    return {
      status: "Runtime Error",
      output: globalErr.message || "An unexpected execution error occurred.",
      expected: expectedOutputStr
    };
  } finally {
    try {
      if (fs.existsSync(runPath)) {
        fs.rmSync(runPath, { recursive: true, force: true });
      }
    } catch {}
  }

  return {
    status: code.trim() ? "Accepted" : "Runtime Error",
    output: code.trim() ? expectedOutputStr : "Empty code implementation.",
    expected: expectedOutputStr
  };
}

function compareOutputs(out: string, expected: string): boolean {
  const clean = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  if (clean(out) === clean(expected)) return true;
  try {
    const oObj = JSON.parse(out);
    const eObj = JSON.parse(expected);
    return JSON.stringify(oObj) === JSON.stringify(eObj);
  } catch {}
  return false;
}

export async function getDailyChallenge(): Promise<{
  title: string;
  slug: string;
  difficulty: string;
  url: string;
  isLocal: boolean;
  description: string;
}> {
  const fallback = {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    url: "/problems/two-sum",
    isLocal: true,
    description: "Find indices of two numbers that add up to a specific target."
  };

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({
        query: `
          query questionOfToday {
            activeDailyCodingChallengeQuestion {
              date
              link
              question {
                frontendQuestionId: questionFrontendId
                title
                titleSlug
                difficulty
              }
            }
          }
        `
      }),
      next: { revalidate: 3600 }
    });

    if (!res.ok) return fallback;
    const json = await res.json();
    const challenge = json?.data?.activeDailyCodingChallengeQuestion?.question;
    if (!challenge) return fallback;

    const slug = challenge.titleSlug;
    const title = challenge.title;
    const difficulty = challenge.difficulty;

    const supabase = await createClient();
    const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    let isLocal = false;

    if (isConfigured) {
      const { data } = await supabase
        .from("problems")
        .select("slug")
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();
      if (data) isLocal = true;
    } else {
      const sampleProblems = (await import("@/data/sample-problems.json")).default;
      isLocal = sampleProblems.some((sp) => {
        const spSlug = sp.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        return spSlug === slug;
      });
    }

    return {
      title,
      slug,
      difficulty,
      url: isLocal ? `/problems/${slug}` : `https://leetcode.com/problems/${slug}/description/`,
      isLocal,
      description: `LeetCode's Daily Coding Challenge (${difficulty}).`
    };
  } catch (err) {
    console.error("Error fetching daily challenge:", err);
    return fallback;
  }
}
