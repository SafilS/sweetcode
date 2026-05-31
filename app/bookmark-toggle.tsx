"use client";

import { useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleBookmark } from "@/app/actions";

export function BookmarkToggle({
  problemId,
  slug,
  isBookmarked,
  signedIn
}: {
  problemId: string;
  slug: string;
  isBookmarked: boolean;
  signedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      aria-pressed={isBookmarked}
      className={`bookmark-button ${isBookmarked ? "active" : ""}`}
      disabled={pending || !signedIn}
      onClick={() => startTransition(() => toggleBookmark(problemId, slug, isBookmarked))}
      title={signedIn ? "Toggle bookmark" : "Sign in with Google to bookmark problems."}
      type="button"
    >
      <Bookmark aria-hidden="true" size={18} />
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
