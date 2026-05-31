import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, NotebookText, RotateCcw, Timer, Trophy } from "lucide-react";
import type { MyLearningProblem } from "@/lib/problems";
import { getMyLearningDashboard } from "@/lib/problems";


function ProblemLink({ problem }: { problem: MyLearningProblem }) {
  return (
    <Link className="learning-list-item" href={`/problems/${problem.slug}`}>
      <span>{problem.problem_number}</span>
      <strong>{problem.title}</strong>
      <em className={`difficulty ${problem.difficulty.toLowerCase()}`}>
        {problem.difficulty.toLowerCase()}
      </em>
    </Link>
  );
}

export default async function MyLearningPage() {
  const dashboard = await getMyLearningDashboard();

  if (!dashboard.signedIn) {
    redirect("/");
  }


  return (
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">My Learning</p>
          <h1>Dashboard</h1>
        </div>
        <p>Your personal coding trail</p>
      </section>

      <section className="stat-grid" aria-label="Learning totals">
        <div>
          <Trophy aria-hidden="true" />
          <span>Solved</span>
          <strong>{dashboard.totals.solved}</strong>
        </div>
        <div>
          <Timer aria-hidden="true" />
          <span>In progress</span>
          <strong>{dashboard.totals.inProgress}</strong>
        </div>
        <div>
          <RotateCcw aria-hidden="true" />
          <span>Revisiting</span>
          <strong>{dashboard.totals.revisiting}</strong>
        </div>
        <div>
          <Bookmark aria-hidden="true" />
          <span>Bookmarks</span>
          <strong>{dashboard.totals.bookmarked}</strong>
        </div>
        <div>
          <NotebookText aria-hidden="true" />
          <span>Notes</span>
          <strong>{dashboard.totals.notes}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel progress-panel">
          <h2>Solved By Difficulty</h2>
          <div className="progress-split">
            <div className="progress-circle-wrap">
              <svg width="120" height="120" viewBox="0 0 120 120" className="progress-circle-svg">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="var(--panel-muted)"
                  strokeWidth="8"
                />
                {/* Active circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  strokeDasharray="314.159265"
                  strokeDashoffset={314.159265 - (314.159265 * (dashboard.totalProblemsByDifficulty.EASY + dashboard.totalProblemsByDifficulty.MEDIUM + dashboard.totalProblemsByDifficulty.HARD > 0 ? dashboard.totals.solved / (dashboard.totalProblemsByDifficulty.EASY + dashboard.totalProblemsByDifficulty.MEDIUM + dashboard.totalProblemsByDifficulty.HARD) : 0))}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="circle-main-text">
                  {dashboard.totals.solved}
                </text>
                <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" className="circle-sub-text">
                  Solved
                </text>
              </svg>
            </div>

            <div className="difficulty-list">
              {(["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => {
                const solved = dashboard.progressByDifficulty[difficulty];
                const total = dashboard.totalProblemsByDifficulty[difficulty];
                const percent = total > 0 ? (solved / total) * 100 : 0;

                return (
                  <div key={difficulty} className="difficulty-item">
                    <div className="difficulty-meta">
                      <span className={`difficulty-label ${difficulty.toLowerCase()}`}>
                        {difficulty.toLowerCase()}
                      </span>
                      <span className="difficulty-ratio">
                        <strong>{solved}</strong>
                        <span className="slash">/</span>
                        <span className="total">{total}</span>
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className={`progress-bar-fill ${difficulty.toLowerCase()}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <h2>In Progress</h2>
          <div className="learning-list">
            {dashboard.inProgress.map((problem) => (
              <ProblemLink key={problem.id} problem={problem} />
            ))}
            {!dashboard.inProgress.length ? <p className="empty-inline">No active problems yet.</p> : null}
          </div>
        </article>

        <article className="dashboard-panel">
          <h2>Revisiting</h2>
          <div className="learning-list">
            {dashboard.revisiting.map((problem) => (
              <ProblemLink key={problem.id} problem={problem} />
            ))}
            {!dashboard.revisiting.length ? <p className="empty-inline">No revisiting queue yet.</p> : null}
          </div>
        </article>

        <article className="dashboard-panel">
          <h2>Bookmarks</h2>
          <div className="learning-list">
            {dashboard.bookmarks.map((problem) => (
              <ProblemLink key={problem.id} problem={problem} />
            ))}
            {!dashboard.bookmarks.length ? <p className="empty-inline">No bookmarks yet.</p> : null}
          </div>
        </article>

        <article className="dashboard-panel wide">
          <h2>Recent Notes</h2>
          <div className="note-list">
            {dashboard.recentNotes.map((note) => (
              <Link className="note-list-item" href={`/problems/${note.problems.slug}`} key={`${note.problems.id}-${note.updated_at}`}>
                <span>
                  {note.problems.problem_number} · {note.problems.title}
                </span>
                <p>{note.content}</p>
              </Link>
            ))}
            {!dashboard.recentNotes.length ? <p className="empty-inline">No notes saved yet.</p> : null}
          </div>
        </article>
      </section>
    </main>
  );
}
