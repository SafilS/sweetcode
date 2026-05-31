import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, LockKeyhole } from "lucide-react";
import { BookmarkToggle } from "@/app/bookmark-toggle";
import { NoteEditor } from "@/app/note-editor";
import { ProgressToggle } from "@/app/progress-toggle";
import { LanguageSnippets } from "@/app/problems/[slug]/language-snippets";
import { ProblemStatement } from "@/app/problems/[slug]/problem-statement";
import { createClient } from "@/lib/supabase/server";
import { getProblemBySlug, getProblemLearningState, getProblemProgress, getDiscussionThreads } from "@/lib/problems";
import type { ProblemDetail } from "@/lib/problems";
import { isSupabaseConfigured } from "@/lib/config";
import { ProblemDiscussion } from "@/app/problems/[slug]/discussion";
import { ProblemTabs } from "@/app/problems/[slug]/problem-tabs";


function formatConstraint(text: string) {
  return text
    .replace(/\b10([1-9]\d*)\b/g, "10^$1")
    .replace(/\b2(31|32)\b/g, "2^$1");
}

export default async function ProblemDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;
  if (!user) {
    redirect("/");
  }

  const { slug } = await params;
  const problem = (await getProblemBySlug(slug).catch(() => null)) as ProblemDetail | null;

  if (!problem) notFound();
  const [progressStatus, learningState, initialThreads] = await Promise.all([
    getProblemProgress(problem.id),
    getProblemLearningState(problem.id),
    getDiscussionThreads(problem.id, user.id)
  ]);
  const signedIn = Boolean(user);

  return (
    <main className="problem-detail">
      <aside className="problem-sidebar">
        <Link className="back-link" href="/problems">
          <ArrowLeft aria-hidden="true" size={18} />
          Problems
        </Link>
        <div className="meta-stack">
          <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
            {problem.difficulty.toLowerCase()}
          </span>
          {problem.is_premium ? (
            <span className="premium-badge">
              <LockKeyhole aria-hidden="true" size={14} />
              LeetCode premium
            </span>
          ) : null}
        </div>
        <div className="tag-stack">
          {problem.problem_tags.map(({ tags }) => (
            <span key={tags.slug}>{tags.name}</span>
          ))}
        </div>
        <ProgressToggle
          problemId={problem.id}
          signedIn={signedIn}
          slug={problem.slug}
          status={progressStatus}
        />
        <BookmarkToggle
          isBookmarked={learningState.isBookmarked}
          problemId={problem.id}
          signedIn={signedIn}
          slug={problem.slug}
        />
        {problem.source_link ? (
          <a className="source-link" href={problem.source_link} target="_blank" rel="noreferrer">
            Source
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        ) : null}
      </aside>

      <article className="problem-content">
        <ProblemTabs
          descriptionNode={
            <>
              <section className="statement">
                <p className="eyebrow">Problem {problem.problem_number}</p>
                <h1>{problem.title}</h1>
                <ProblemStatement description={problem.problem_texts?.description} />
              </section>

              <section>
                <h2>Examples</h2>
                <div className="example-list">
                  {(problem.problem_texts?.examples ?? []).map((example, index) => (
                    <pre key={index}>{example}</pre>
                  ))}
                </div>
              </section>

              <section>
                <h2>Constraints</h2>
                <ul className="constraints-list">
                  {(problem.problem_texts?.constraints ?? []).map((constraint) => (
                    <li key={constraint}>{formatConstraint(constraint)}</li>
                  ))}
                </ul>
              </section>

              <NoteEditor
                initialNote={learningState.note}
                problemId={problem.id}
                signedIn={signedIn}
                slug={problem.slug}
              />
            </>
          }
          solutionsNode={
            <div className="solutions-tab-inner">
              <section>
                <h2>Solutions</h2>
                <div className="solution-list">
                  {problem.solution_approaches.map((approach) => (
                    <article className="solution-block" key={approach.id}>
                      <div className="solution-heading">
                        <h3>{approach.title}</h3>
                        <div>
                          {approach.time_complexity ? <span>{approach.time_complexity}</span> : null}
                          {approach.space_complexity ? <span>{approach.space_complexity}</span> : null}
                        </div>
                      </div>
                      {approach.explanation ? <p>{approach.explanation}</p> : null}
                      <LanguageSnippets snippets={approach.code_snippets} />
                    </article>
                  ))}
                  {!problem.solution_approaches.length ? (
                    <p className="empty-state">No solutions have been imported for this problem yet.</p>
                  ) : null}
                </div>
              </section>
            </div>
          }
          discussionNode={
            <div className="discussion-tab-inner">
              <section className="discussion-section">
                <h2>Discussion Forum</h2>
                <ProblemDiscussion
                  initialThreads={initialThreads}
                  problemId={problem.id}
                  slug={problem.slug}
                  userId={user.id}
                />
              </section>
            </div>
          }
        />
      </article>
    </main>
  );
}
