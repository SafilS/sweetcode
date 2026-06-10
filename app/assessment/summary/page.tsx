"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Timer, 
  BookOpen, 
  Award, 
  RotateCcw, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";

interface AssessmentQuestion {
  id: string;
  problem_number: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  is_premium: boolean;
}

interface AssessmentSession {
  startTime: number;
  durationMs: number;
  questions: AssessmentQuestion[];
  completed: boolean;
  submissions: boolean[];
}

export default function AssessmentSummaryPage() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [durationText, setDurationText] = useState("");
  const [score, setScore] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const stored = localStorage.getItem("sweetcode:assessment:session");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as AssessmentSession;
      setSession(parsed);

      // Calculate time taken
      const endTime = Date.now();
      const elapsedMs = Math.min(endTime - parsed.startTime, parsed.durationMs);
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
      
      const minStr = elapsedMinutes > 0 ? `${elapsedMinutes}m ` : "";
      setDurationText(`${minStr}${elapsedSeconds}s`);

      // Calculate score based on difficulty and submission
      // Easy = 20pts, Medium = 40pts, Hard = 60pts
      let maxScore = 0;
      let userScore = 0;

      parsed.questions.forEach((q, idx) => {
        let pts = 20;
        if (q.difficulty === "MEDIUM") pts = 40;
        if (q.difficulty === "HARD") pts = 60;

        maxScore += pts;
        if (parsed.submissions[idx]) {
          userScore += pts;
        }
      });

      const scorePct = maxScore > 0 ? Math.round((userScore / maxScore) * 100) : 0;
      setScore(scorePct);
    } catch (err) {
      console.error(err);
    }
  }, [mounted]);

  const handleRetake = () => {
    localStorage.removeItem("sweetcode:assessment:session");
  };

  if (!mounted) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="assessment-summary-container">
        <div className="summary-card glass-panel">
          <ShieldAlertIcon />
          <h2>No Active Session Found</h2>
          <p>You haven&apos;t completed any assessments recently.</p>
          <Link href="/assessment" className="primary-button">
            Go to Assessments
          </Link>
        </div>
      </main>
    );
  }

  const solvedCount = session.submissions.filter(Boolean).length;
  const totalCount = session.questions.length;

  return (
    <main className="assessment-summary-container">
      {/* Cosmic details */}
      <div className="glow-orb purple-glow dashboard-orb-1"></div>
      <div className="glow-orb cyan-glow dashboard-orb-2"></div>
      <div className="cosmic-grid"></div>

      <div className="summary-card glass-panel">
        <header className="summary-header">
          <div className="award-icon-badge">
            <Award size={48} />
          </div>
          <h1 className="gradient-text">Assessment Complete!</h1>
          <p className="subtitle">Here is a summary of your mock interview performance.</p>
        </header>

        {/* Score Ring / Large stat */}
        <section className="score-hero">
          <div className="score-circle">
            <span className="score-num">{score}%</span>
            <span className="score-label">Overall Match</span>
          </div>

          <div className="stats-pill-grid">
            <div className="stat-pill">
              <Trophy size={16} />
              <span>Solved <strong>{solvedCount} / {totalCount}</strong></span>
            </div>
            <div className="stat-pill">
              <Timer size={16} />
              <span>Time: <strong>{durationText}</strong></span>
            </div>
          </div>
        </section>

        {/* Problems List */}
        <section className="summary-problems-section">
          <h3>Interview Question Breakdown</h3>
          <div className="summary-table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {session.questions.map((q, idx) => (
                  <tr key={q.id}>
                    <td className="q-title-cell">
                      <strong>Q{idx + 1}:</strong> {q.title}
                    </td>
                    <td>
                      <span className={`difficulty-badge ${q.difficulty.toLowerCase()}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td>
                      {session.submissions[idx] ? (
                        <span className="status-cell success">
                          <CheckCircle2 size={14} />
                          Submitted
                        </span>
                      ) : (
                        <span className="status-cell error">
                          <XCircle size={14} />
                          Skipped/Timed Out
                        </span>
                      )}
                    </td>
                    <td>
                      <Link 
                        href={`/problems/${q.slug}`} 
                        className="view-sol-btn"
                        onClick={handleRetake}
                      >
                        <BookOpen size={12} />
                        Study Solution
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Actions footer */}
        <footer className="summary-actions-footer">
          <Link 
            href="/assessment" 
            className="secondary-button retake-btn"
            onClick={handleRetake}
          >
            <RotateCcw size={16} />
            <span>New Assessment</span>
          </Link>
          <Link href="/problems" className="primary-button">
            <span>Back to Problem Library</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}

function ShieldAlertIcon() {
  return (
    <div className="denied-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-shield-alert"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
  );
}
