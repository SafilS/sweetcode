"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProgressStatus } from "@/lib/problems";
import { getRedisClient } from "@/lib/redis";

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
  } catch (_) {}

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
  } catch (_) {}

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
  } catch (_) {}

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
