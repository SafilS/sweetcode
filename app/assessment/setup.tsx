"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Timer, CheckCircle, ShieldAlert, Sparkles } from "lucide-react";
import { getRandomAssessmentProblems } from "@/app/actions";

type AssessmentType = "2-questions" | "3-questions" | "5-questions";

export function AssessmentSetup() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<AssessmentType>("3-questions");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleStart = async () => {
    if (!agreed) {
      setErrorMsg("You must check the confirmation box before starting the assessment.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      let difficulties: ("EASY" | "MEDIUM" | "HARD")[] = [];
      let durationMs = 0;

      if (selectedOption === "2-questions") {
        // 2 Questions: 1 Easy, 1 Medium or Hard (randomized)
        const secondDiff: "MEDIUM" | "HARD" = Math.random() > 0.5 ? "MEDIUM" : "HARD";
        difficulties = ["EASY", secondDiff];
        durationMs = 45 * 60 * 1000; // 45 mins
      } else if (selectedOption === "3-questions") {
        // 3 Questions: 1 Easy, 1 Medium or Hard, 1 Hard
        const secondDiff: "MEDIUM" | "HARD" = Math.random() > 0.5 ? "MEDIUM" : "HARD";
        difficulties = ["EASY", secondDiff, "HARD"];
        durationMs = 90 * 60 * 1000; // 1.5 hours
      } else {
        // 5 Questions: 1 Easy, 2 Medium, 1 Medium/Hard, 1 Hard
        const fourthDiff: "MEDIUM" | "HARD" = Math.random() > 0.5 ? "MEDIUM" : "HARD";
        difficulties = ["EASY", "MEDIUM", "MEDIUM", fourthDiff, "HARD"];
        durationMs = 120 * 60 * 1000; // 2 hours
      }

      // Fetch randomized questions matching difficulty profile
      const problems = await getRandomAssessmentProblems(difficulties);

      if (!problems || problems.length === 0) {
        throw new Error("Could not fetch interview-friendly questions. Please try again.");
      }

      const startTime = Date.now();
      const sessionData = {
        startTime,
        durationMs,
        questions: problems,
        currentQuestionIndex: 0,
        codes: problems.map(() => ""), // Code snippets for each language
        languages: problems.map(() => "Python3"), // Preferred language for each question
        completed: false,
        submissions: problems.map(() => false) // Progress check
      };

      // Store in localStorage to resist page reloads
      localStorage.setItem("sweetcode:assessment:session", JSON.stringify(sessionData));
      
      // Redirect to timed coding editor session
      router.push("/assessment/session");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to initialize assessment.";
      setErrorMsg(message);
      setLoading(false);
    }
  };

  return (
    <main className="assessment-setup-container">
      {/* Cosmic background details */}
      <div className="glow-orb purple-glow dashboard-orb-1"></div>
      <div className="glow-orb cyan-glow dashboard-orb-2"></div>
      <div className="cosmic-grid"></div>

      <div className="setup-window glass-panel">
        <header className="setup-header">
          <div className="title-glow-badge">
            <Trophy size={14} />
            <span>Online Assessment</span>
          </div>
          <h1 className="gradient-text">Timed Mock Interview</h1>
          <p className="subtitle">Select your difficulty profile, test your speed, and get realistic coding feedback.</p>
        </header>

        {/* Option Cards */}
        <section className="options-grid">
          <div 
            className={`option-card ${selectedOption === "2-questions" ? "active" : ""}`}
            onClick={() => setSelectedOption("2-questions")}
          >
            <div className="option-glow-border"></div>
            <div className="option-header">
              <h3>Speed Drill</h3>
              <span className="duration-badge">
                <Timer size={14} />
                45 mins
              </span>
            </div>
            <p className="option-desc">Perfect for quick assessment of basic algorithm fluency.</p>
            <ul className="option-bullets">
              <li><CheckCircle size={14} className="bullet-icon" /> 2 Random Questions</li>
              <li><CheckCircle size={14} className="bullet-icon" /> 1 Easy + 1 Medium/Hard</li>
            </ul>
          </div>

          <div 
            className={`option-card ${selectedOption === "3-questions" ? "active" : ""}`}
            onClick={() => setSelectedOption("3-questions")}
          >
            <div className="option-glow-border"></div>
            <div className="option-header">
              <div className="recommended-badge-wrap">
                <Sparkles size={12} />
                <span>Recommended</span>
              </div>
              <h3>Standard Interview</h3>
              <span className="duration-badge">
                <Timer size={14} />
                1.5 hours
              </span>
            </div>
            <p className="option-desc">Simulates a standard technical screening session for big-tech companies.</p>
            <ul className="option-bullets">
              <li><CheckCircle size={14} className="bullet-icon" /> 3 Random Questions</li>
              <li><CheckCircle size={14} className="bullet-icon" /> 1 Easy + 1 Med/Hard + 1 Hard</li>
            </ul>
          </div>

          <div 
            className={`option-card ${selectedOption === "5-questions" ? "active" : ""}`}
            onClick={() => setSelectedOption("5-questions")}
          >
            <div className="option-glow-border"></div>
            <div className="option-header">
              <h3>Full Assessment</h3>
              <span className="duration-badge">
                <Timer size={14} />
                2 hours
              </span>
            </div>
            <p className="option-desc">Advanced comprehensive screening covering multiple dynamic programming, tree, and graph algorithms.</p>
            <ul className="option-bullets">
              <li><CheckCircle size={14} className="bullet-icon" /> 5 Random Questions</li>
              <li><CheckCircle size={14} className="bullet-icon" /> 1 Easy + 2 Med + 1 Med/Hard + 1 Hard</li>
            </ul>
          </div>
        </section>

        {/* Confirmation Area */}
        <section className="confirmation-panel">
          {errorMsg && (
            <div className="error-alert">
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="label-text">
              I am ready to start. I understand that the timer will run in real-time and cannot be paused.
            </span>
          </label>

          <button 
            type="button" 
            className={`primary-button start-btn ${loading ? "loading-btn" : ""}`}
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                <span>Preloading Questions...</span>
              </>
            ) : (
              <span>Start Assessment Session</span>
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
