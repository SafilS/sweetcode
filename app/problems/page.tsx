import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Filter, LockKeyhole, Search } from "lucide-react";
import type { ProgressStatus } from "@/lib/problems";
import { getProblems, getTags } from "@/lib/problems";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";


const difficulties = ["Easy", "Medium", "Hard"];
const statusLabels: Record<ProgressStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SOLVED: "Solved",
  REVISITING: "Revisiting"
};

function pageHref(params: { difficulty?: string; tag?: string; q?: string; page?: string }, page: number) {
  const nextParams = new URLSearchParams();
  if (params.q) nextParams.set("q", params.q);
  if (params.difficulty) nextParams.set("difficulty", params.difficulty);
  if (params.tag) nextParams.set("tag", params.tag);
  if (page > 1) nextParams.set("page", String(page));
  const query = nextParams.toString();
  return query ? `/problems?${query}` : "/problems";
}

export default async function ProblemsPage({
  searchParams
}: {
  searchParams: Promise<{ difficulty?: string; tag?: string; q?: string; page?: string }>;
}) {
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;
  if (!user) {
    redirect("/");
  }

  const params = await searchParams;

  const [problemPage, tags] = await Promise.all([getProblems(params), getTags()]);
  const { items: problems, page, total, totalPages } = problemPage;
  const firstVisible = total === 0 ? 0 : (page - 1) * problemPage.pageSize + 1;
  const lastVisible = Math.min(page * problemPage.pageSize, total);

  return (
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Problems</h1>
        </div>
        <p>
          {firstVisible}-{lastVisible} of {total} problems
        </p>
      </section>

      <form className="filters">
        <label className="search-field">
          <Search aria-hidden="true" size={18} />
          <input name="q" placeholder="Search title or number" defaultValue={params.q ?? ""} />
        </label>
        <label>
          <Filter aria-hidden="true" size={18} />
          <select name="difficulty" defaultValue={params.difficulty ?? ""}>
            <option value="">All difficulties</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Filter aria-hidden="true" size={18} />
          <select name="tag" defaultValue={params.tag ?? ""}>
            <option value="">All tags</option>
            {tags.map((tag: { name: string; slug: string }) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">
          Apply
        </button>
      </form>

      <section className="problem-list" aria-label="Problems">
        {problems.map((problem) => (
          <Link className="problem-row" href={`/problems/${problem.slug}`} key={problem.id}>
            <span className="problem-number">{problem.problem_number}</span>
            <span className="problem-title">{problem.title}</span>
            <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty.toLowerCase()}
            </span>
            {problem.is_premium ? (
              <span className="premium-badge">
                <LockKeyhole aria-hidden="true" size={14} />
                Premium
              </span>
            ) : (
              <span />
            )}
            <span className="row-learning-badges">
              {problem.is_bookmarked ? (
                <span className="bookmark-badge" title="Bookmarked">
                  <Bookmark aria-hidden="true" size={14} />
                </span>
              ) : null}
              {problem.user_status && problem.user_status !== "NOT_STARTED" ? (
                <span className={`status-badge ${problem.user_status.toLowerCase()}`}>
                  {statusLabels[problem.user_status]}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
        {!problems.length ? <p className="empty-state">No problems match these filters.</p> : null}
      </section>

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Problem pages">
          {page > 1 ? (
            <Link className="ghost-button" href={pageHref(params, page - 1)}>
              Previous
            </Link>
          ) : (
            <span className="ghost-button disabled">Previous</span>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link className="ghost-button" href={pageHref(params, page + 1)}>
              Next
            </Link>
          ) : (
            <span className="ghost-button disabled">Next</span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
