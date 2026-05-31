"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Search,
  ThumbsUp,
  Trash2
} from "lucide-react";
import {
  createDiscussionReply,
  createDiscussionThread,
  deleteDiscussionReply,
  deleteDiscussionThread,
  fetchThreadReplies,
  toggleThreadVote
} from "@/app/actions";
import type { DiscussionReply, DiscussionThread } from "@/lib/problems";


function renderMarkdown(text: string) {
  if (!text) return null;
  
  // Split by code blocks fenced with ```
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : "";
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <pre className="comment-code-block" key={index}>
          {lang && <span className="code-lang-tag">{lang}</span>}
          <code>{code.trim()}</code>
        </pre>
      );
    }

    // Split by paragraphs and lines
    const lines = part.split("\n").map((line, lineIdx) => {
      // Split by bold (**text**) and inline code (`code`) tokens
      const tokens = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      const lineElements = tokens.map((token, tokenIdx) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return <strong key={tokenIdx}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith("`") && token.endsWith("`")) {
          return (
            <code className="comment-inline-code" key={tokenIdx}>
              {token.slice(1, -1)}
            </code>
          );
        }
        return token;
      });

      return (
        <span key={lineIdx}>
          {lineElements}
          {lineIdx < part.split("\n").length - 1 && <br />}
        </span>
      );
    });

    return (
      <p className="comment-paragraph" key={index}>
        {lines}
      </p>
    );
  });
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        alt={`${name}'s avatar`}
        className="user-avatar"
        src={url}
      />
    );
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <span className="user-avatar-placeholder" aria-hidden="true">
      {initial}
    </span>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function ProblemDiscussion({
  problemId,
  slug,
  userId,
  initialThreads
}: {
  problemId: string;
  slug: string;
  userId: string | undefined;
  initialThreads: DiscussionThread[];
}) {
  const [threads, setThreads] = useState<DiscussionThread[]>(initialThreads);
  const [prevInitialThreads, setPrevInitialThreads] = useState(initialThreads);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "upvotes">("recent");
  
  // Navigation & Details
  const [viewingThread, setViewingThread] = useState<DiscussionThread | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Forms
  const [newThreadText, setNewThreadText] = useState("");
  const [newReply, setNewReply] = useState("");

  const [pending, startTransition] = useTransition();

  // Sync threads state with initialThreads props during render (avoiding set-state-in-effect)
  if (initialThreads !== prevInitialThreads) {
    setThreads(initialThreads);
    setPrevInitialThreads(initialThreads);
    if (viewingThread) {
      const updated = initialThreads.find((t) => t.id === viewingThread.id);
      setViewingThread(updated || null);
    }
  }

  // Load replies when viewing thread changes
  const threadIdToLoad = viewingThread?.id;
  useEffect(() => {
    if (!threadIdToLoad) return;

    let active = true;
    fetchThreadReplies(threadIdToLoad)
      .then((data) => {
        if (active) setReplies(data);
      })
      .catch((err) => {
        console.error("Failed to load thread replies", err);
      })
      .finally(() => {
        if (active) setLoadingReplies(false);
      });

    return () => {
      active = false;
    };
  }, [threadIdToLoad]);

  // Actions
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newThreadText.trim();
    if (!content) return;

    // Generate a title from the first line or first 60 characters
    const firstLine = content.split("\n")[0].trim();
    const title = firstLine.slice(0, 60) || "New Discussion";

    startTransition(async () => {
      try {
        await createDiscussionThread(problemId, slug, title, content);
        setNewThreadText("");
      } catch (err) {
        console.error("Failed to create thread", err);
      }
    });
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!window.confirm("Are you sure you want to delete this thread?")) return;

    startTransition(async () => {
      try {
        await deleteDiscussionThread(threadId, slug);
        setViewingThread(null);
        setReplies([]);
      } catch (err) {
        console.error("Failed to delete thread", err);
      }
    });
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingThread || !newReply.trim()) return;

    startTransition(async () => {
      try {
        await createDiscussionReply(viewingThread.id, slug, newReply);
        setNewReply("");
        
        // Refresh replies manually for instant response
        const data = await fetchThreadReplies(viewingThread.id);
        setReplies(data);
      } catch (err) {
        console.error("Failed to post reply", err);
      }
    });
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!viewingThread || !window.confirm("Are you sure you want to delete this reply?")) return;

    startTransition(async () => {
      try {
        await deleteDiscussionReply(replyId, slug);
        // Refresh replies
        const data = await fetchThreadReplies(viewingThread.id);
        setReplies(data);
      } catch (err) {
        console.error("Failed to delete reply", err);
      }
    });
  };

  const handleVote = async (thread: DiscussionThread, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    startTransition(async () => {
      try {
        await toggleThreadVote(thread.id, slug, thread.has_voted);
      } catch (err) {
        console.error("Failed to toggle vote", err);
      }
    });
  };

  // Filtering & Sorting
  const filteredThreads = threads
    .filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "upvotes") {
        return b.upvotes_count - a.upvotes_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (viewingThread) {
    return (
      <div className="thread-detail-container">
        <button
          className="back-button-text"
          onClick={() => {
            setViewingThread(null);
            setReplies([]);
          }}
          type="button"
        >
          <ArrowLeft size={16} />
          Back to discussions
        </button>

        <article className="thread-main">
          <header className="thread-header">
            <div className="thread-meta-row">
              <Avatar
                name={viewingThread.author.username ?? "Anonymous"}
                url={viewingThread.author.avatar_url}
              />
              <div>
                <strong className="author-name">
                  {viewingThread.author.username ?? "Anonymous"}
                </strong>
                <span className="post-date">
                  posted {formatDate(viewingThread.created_at)}
                </span>
              </div>
            </div>
            <h3 className="thread-title">{viewingThread.title}</h3>
          </header>

          <div className="thread-body">
            {renderMarkdown(viewingThread.content)}
          </div>

          <footer className="thread-actions">
            <button
              className={`vote-button ${viewingThread.has_voted ? "active" : ""}`}
              disabled={!userId || pending}
              onClick={(e) => handleVote(viewingThread, e)}
              title={userId ? "Upvote this thread" : "Sign in to upvote"}
              type="button"
            >
              <ThumbsUp size={16} />
              <span>{viewingThread.upvotes_count} Upvotes</span>
            </button>

            {userId && viewingThread.user_id === userId && (
              <button
                className="delete-button-text"
                disabled={pending}
                onClick={() => handleDeleteThread(viewingThread.id)}
                type="button"
              >
                <Trash2 size={16} />
                Delete Post
              </button>
            )}
          </footer>
        </article>

        <section className="replies-section">
          <h4>Replies ({replies.length})</h4>

          {loadingReplies ? (
            <div className="loading-spinner">
              <Loader2 className="spinner" size={24} />
              <span>Loading replies...</span>
            </div>
          ) : (
            <div className="replies-list">
              {replies.map((reply) => (
                <article className="reply-card" key={reply.id}>
                  <header className="reply-header">
                    <Avatar
                      name={reply.author.username ?? "Anonymous"}
                      url={reply.author.avatar_url}
                    />
                    <div>
                      <strong>{reply.author.username ?? "Anonymous"}</strong>
                      <span className="post-date">
                        replied {formatDate(reply.created_at)}
                      </span>
                    </div>
                    {userId && reply.user_id === userId && (
                      <button
                        className="delete-reply-btn"
                        disabled={pending}
                        onClick={() => handleDeleteReply(reply.id)}
                        title="Delete reply"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </header>
                  <div className="reply-body">{renderMarkdown(reply.content)}</div>
                </article>
              ))}

              {!replies.length && (
                <p className="empty-inline-note">No replies yet. Be the first to answer!</p>
              )}
            </div>
          )}

          {userId ? (
            <form className="reply-form" onSubmit={handleCreateReply}>
              <h5>Write a reply</h5>
              <div className="textarea-wrapper">
                <textarea
                  disabled={pending}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Share your thoughts or answer... Use ```lang\ncode\n``` for code block syntax."
                  required
                  rows={4}
                  value={newReply}
                />
              </div>
              <div className="form-submit-row">
                <button
                  className="primary-button"
                  disabled={pending || !newReply.trim()}
                  type="submit"
                >
                  {pending ? <Loader2 className="spinner" size={16} /> : "Post Reply"}
                </button>
              </div>
            </form>
          ) : (
            <div className="auth-prompt-card">
              <p>Please log in to participate in the discussion and post replies.</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="discussion-board">
      <header className="discussion-controls">
        <div className="search-sort-group">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={16} />
            <input
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discussion threads..."
              type="text"
              value={search}
            />
          </div>

          <div className="sort-buttons">
            <button
              className={sortBy === "recent" ? "active" : ""}
              onClick={() => setSortBy("recent")}
              type="button"
            >
              Recent
            </button>
            <button
              className={sortBy === "upvotes" ? "active" : ""}
              onClick={() => setSortBy("upvotes")}
              type="button"
            >
              Top Upvoted
            </button>
          </div>
        </div>

      </header>

      <div className="threads-list">
        {filteredThreads.map((thread) => (
          <article
            className="thread-card-item"
            key={thread.id}
            onClick={() => {
              setViewingThread(thread);
              setLoadingReplies(true);
            }}
          >
            <div className="thread-card-left">
              <button
                className={`thread-card-vote-btn ${thread.has_voted ? "active" : ""}`}
                disabled={!userId || pending}
                onClick={(e) => handleVote(thread, e)}
                title={userId ? "Upvote thread" : "Sign in to upvote"}
                type="button"
              >
                <ThumbsUp size={14} />
                <span>{thread.upvotes_count}</span>
              </button>
            </div>

            <div className="thread-card-main">
              <h4 className="thread-card-title">{thread.title}</h4>
              <p className="thread-card-snippet">
                {thread.content.slice(0, 140)}
                {thread.content.length > 140 ? "..." : ""}
              </p>
              
              <footer className="thread-card-footer">
                <div className="thread-card-author-info">
                  <Avatar
                    name={thread.author.username ?? "Anonymous"}
                    url={thread.author.avatar_url}
                  />
                  <span>{thread.author.username ?? "Anonymous"}</span>
                  <span className="dot">·</span>
                  <span>{formatDate(thread.created_at)}</span>
                </div>

                <div className="thread-card-replies-badge">
                  <MessageSquare size={14} />
                  <span>{thread.replies_count}</span>
                </div>
              </footer>
            </div>
          </article>
        ))}

        {!filteredThreads.length && (
          <div className="empty-discussion-state">
            <MessageSquare size={36} />
            <p>No discussion threads match your filter.</p>
            <p className="sub">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {userId ? (
        <form className="new-thread-simple-form" onSubmit={handleCreateThread}>
          <h5>Start a discussion topic</h5>
          <div className="textarea-wrapper">
            <textarea
              disabled={pending}
              onChange={(e) => setNewThreadText(e.target.value)}
              placeholder="Share your thoughts, solution, or ask a question... Use ```lang\ncode\n``` for code block syntax."
              required
              rows={4}
              value={newThreadText}
            />
          </div>
          <div className="form-submit-row">
            <button
              className="primary-button"
              disabled={pending || !newThreadText.trim()}
              type="submit"
            >
              {pending ? <Loader2 className="spinner" size={16} /> : "Post Discussion"}
            </button>
          </div>
        </form>
      ) : (
        <div className="auth-prompt-card">
          <p>Please log in to participate in the discussion forum.</p>
        </div>
      )}
    </div>
  );
}
