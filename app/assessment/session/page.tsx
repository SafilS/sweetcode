"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Timer, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Terminal, 
  Code2, 
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import { ProblemStatement } from "@/app/problems/[slug]/problem-statement";
import { runAssessmentCode } from "@/app/actions";

// Dynamically import the CodeEditor component to avoid SSR hydration issues
const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

interface ProblemTexts {
  description: string;
  examples: string[];
  constraints: string[];
}

interface AssessmentQuestion {
  id: string;
  problem_number: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  is_premium: boolean;
  problem_texts: ProblemTexts;
}

interface AssessmentSession {
  startTime: number;
  durationMs: number;
  questions: AssessmentQuestion[];
  currentQuestionIndex: number;
  codes: Record<number, Record<string, string>>; // Keep track of code by question index and language
  languages: string[]; // Preferred language for each question index
  completed: boolean;
  submissions: boolean[];
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  Python3: `class Solution:
    def solve(self) -> None:
        # Write your code here
        pass
`,
  Java: `import java.util.*;

class Solution {
    public void solve() {
        // Write your code here
    }
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

class Solution {
public:
    void solve() {
        // Write your code here
    }
};
`
};

export default function AssessmentSessionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isTimeUrgent, setIsTimeUrgent] = useState(false);

  // Editor and runner state
  const [activeLang, setActiveLang] = useState("Python3");
  const [code, setCode] = useState("");
  const [testCaseIndex, setTestCaseIndex] = useState(0);
  const [runInput, setRunInput] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compile Error";
    output: string;
    expected: string;
    isSimulated?: boolean;
  } | null>(null);

  // Resizing state
  const [leftWidth, setLeftWidth] = useState(45); // percentage of width for left pane
  const [editorHeight, setEditorHeight] = useState(60); // percentage of height for editor pane
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  const handleAutoSubmit = () => {
    if (!session) return;
    const finished = {
      ...session,
      completed: true
    };
    localStorage.setItem("sweetcode:assessment:session", JSON.stringify(finished));
    router.push("/assessment/summary");
  };

  // Toggle layout class on body
  useEffect(() => {
    document.body.classList.add("in-assessment-session");
    return () => {
      document.body.classList.remove("in-assessment-session");
    };
  }, []);

  const handleQuit = () => {
    const confirmQuit = window.confirm("Are you sure you want to quit the assessment? Your active progress will be lost.");
    if (confirmQuit) {
      localStorage.removeItem("sweetcode:assessment:session");
      router.push("/assessment");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to quit? Your assessment progress will be lost.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Window drag handlers for resizers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidth) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 20 && newWidth < 80) {
          setLeftWidth(newWidth);
        }
      } else if (isResizingHeight) {
        const workspace = document.querySelector(".assessment-split-workspace");
        if (workspace) {
          const rect = workspace.getBoundingClientRect();
          const relativeY = e.clientY - rect.top;
          const newHeightPercent = (relativeY / rect.height) * 100;
          if (newHeightPercent > 20 && newHeightPercent < 85) {
            setEditorHeight(newHeightPercent);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingWidth(false);
      setIsResizingHeight(false);
    };

    if (isResizingWidth || isResizingHeight) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingWidth, isResizingHeight]);

  const startResizeWidth = (e: React.MouseEvent) => {
    setIsResizingWidth(true);
    e.preventDefault();
  };

  const startResizeHeight = (e: React.MouseEvent) => {
    setIsResizingHeight(true);
    e.preventDefault();
  };

  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem("sweetcode:assessment:session");
    if (!stored) {
      router.push("/assessment");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AssessmentSession;
      
      // If already completed, redirect to summary
      if (parsed.completed) {
        router.push("/assessment/summary");
        return;
      }

      // Check if codes is in new format, else initialize
      if (!parsed.codes || typeof parsed.codes[0] !== "object") {
        parsed.codes = {};
        parsed.questions.forEach((_, idx) => {
          parsed.codes[idx] = {
            Python3: DEFAULT_TEMPLATES.Python3,
            Java: DEFAULT_TEMPLATES.Java,
            cpp: DEFAULT_TEMPLATES.cpp
          };
        });
      }

      setSession(parsed);
      const qIdx = parsed.currentQuestionIndex;
      const lang = parsed.languages[qIdx] ?? "Python3";
      setActiveLang(lang);
      setCode(parsed.codes[qIdx]?.[lang] ?? DEFAULT_TEMPLATES[lang]);
    } catch {
      router.push("/assessment");
    }
  }, [router]);

  // Timer countdown loop
  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - session.startTime;
      const remaining = session.durationMs - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
        return;
      }

      // Format time
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const hStr = hours > 0 ? `${hours}:` : "";
      const mStr = String(minutes).padStart(2, "0");
      const sStr = String(seconds).padStart(2, "0");

      setTimeLeft(`${hStr}${mStr}:${sStr}`);

      // Alert if under 5 minutes remaining
      if (remaining < 5 * 60 * 1000) {
        setIsTimeUrgent(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // Load code template or typed content when question or language changes
  const handleLangChange = (newLang: string) => {
    if (!session) return;
    const qIdx = session.currentQuestionIndex;
    
    // Save current code
    const updatedCodes = { ...session.codes };
    updatedCodes[qIdx] = { ...updatedCodes[qIdx], [activeLang]: code };

    const updatedLangs = [...session.languages];
    updatedLangs[qIdx] = newLang;

    const updated = {
      ...session,
      codes: updatedCodes,
      languages: updatedLangs
    };

    setSession(updated);
    localStorage.setItem("sweetcode:assessment:session", JSON.stringify(updated));

    setActiveLang(newLang);
    setCode(updatedCodes[qIdx]?.[newLang] ?? DEFAULT_TEMPLATES[newLang]);
    setRunResult(null);
  };

  const handleNext = () => {
    if (!session) return;
    const qIdx = session.currentQuestionIndex;

    // Save current code first
    const updatedCodes = { ...session.codes };
    updatedCodes[qIdx] = { ...updatedCodes[qIdx], [activeLang]: code };

    const updatedSubmissions = [...session.submissions];
    updatedSubmissions[qIdx] = true;

    const nextIdx = qIdx + 1;
    const isFinished = nextIdx >= session.questions.length;

    const updated = {
      ...session,
      codes: updatedCodes,
      submissions: updatedSubmissions,
      currentQuestionIndex: isFinished ? qIdx : nextIdx,
      completed: isFinished
    };

    localStorage.setItem("sweetcode:assessment:session", JSON.stringify(updated));

    if (isFinished) {
      router.push("/assessment/summary");
    } else {
      setSession(updated);
      const nextLang = updated.languages[nextIdx] ?? "Python3";
      setActiveLang(nextLang);
      setCode(updated.codes[nextIdx]?.[nextLang] ?? DEFAULT_TEMPLATES[nextLang]);
      setTestCaseIndex(0);
      setRunResult(null);
    }
  };

  if (!mounted || !session) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentQuestionIndex = session.currentQuestionIndex;
  const problem = session.questions[currentQuestionIndex];
  const examples = problem.problem_texts?.examples ?? [];

  // Parse example for test cases
  const parseExample = (exampleText: string) => {
    const lines = exampleText.split("\n");
    let input = "";
    let expected = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("Input:")) {
        input = trimmed.replace("Input:", "").trim();
      } else if (trimmed.startsWith("Output:")) {
        expected = trimmed.replace("Output:", "").trim();
      }
    }
    if (!input && !expected) {
      input = exampleText;
      expected = "Refer to description";
    }
    return { input, expected };
  };

  const parsedExamples = examples.map(parseExample);
  const activeExample = parsedExamples[testCaseIndex] ?? { input: "", expected: "" };

  const handleRunCode = async () => {
    setRunning(true);
    setRunResult(null);

    try {
      const res = await runAssessmentCode(
        activeLang,
        code,
        activeExample.input,
        activeExample.expected
      );
      setRunResult(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected execution error occurred.";
      setRunResult({
        status: "Runtime Error",
        output: message,
        expected: activeExample.expected
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="assessment-session-wrapper">
      {/* Dynamic Top bar */}
      <nav className="session-navbar glass-panel">
        <div className="nav-left">
          <button 
            type="button" 
            onClick={handleQuit} 
            className="session-back-link"
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} />
            <span>Quit</span>
          </button>
          <span className="divider">|</span>
          <h2 className="session-title">Assessment Session</h2>
        </div>

        {/* Tabs for Questions */}
        <div className="nav-center-tabs">
          {session.questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              className={`q-tab-btn ${idx === currentQuestionIndex ? "active" : ""} ${session.submissions[idx] ? "completed" : ""}`}
              onClick={() => {
                // Save current code
                const updatedCodes = { ...session.codes };
                updatedCodes[currentQuestionIndex] = { ...updatedCodes[currentQuestionIndex], [activeLang]: code };
                const updated = {
                  ...session,
                  codes: updatedCodes,
                  currentQuestionIndex: idx
                };
                setSession(updated);
                localStorage.setItem("sweetcode:assessment:session", JSON.stringify(updated));

                const targetLang = updated.languages[idx] ?? "Python3";
                setActiveLang(targetLang);
                setCode(updated.codes[idx]?.[targetLang] ?? DEFAULT_TEMPLATES[targetLang]);
                setTestCaseIndex(0);
                setRunResult(null);
              }}
            >
              Q{idx + 1}
              <span className={`diff-dot ${q.difficulty.toLowerCase()}`}></span>
            </button>
          ))}
        </div>

        <div className={`nav-right-timer ${isTimeUrgent ? "urgent" : ""}`}>
          <Timer size={18} />
          <span className="timer-countdown">{timeLeft || "00:00"}</span>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="assessment-split-workspace" style={{ display: "flex", width: "100%" }}>
        {/* Left Side: Problem Statement */}
        <section className="workspace-left-pane glass-panel" style={{ width: `${leftWidth}%`, flexShrink: 0 }}>
          <div className="pane-header">
            <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty}
            </span>
            <span className="problem-num">Problem {problem.problem_number}</span>
          </div>

          <div className="pane-scroll-body">
            <h1>{problem.title}</h1>
            <div className="problem-description-wrapper">
              <ProblemStatement description={problem.problem_texts?.description} />
            </div>

            {examples.length > 0 && (
              <div className="examples-section">
                <h3>Examples</h3>
                {examples.map((example, idx) => (
                  <pre key={idx} className="example-block">{example}</pre>
                ))}
              </div>
            )}

            {problem.problem_texts?.constraints && problem.problem_texts.constraints.length > 0 && (
              <div className="constraints-section">
                <h3>Constraints</h3>
                <ul>
                  {problem.problem_texts.constraints.map((constraint, idx) => (
                    <li key={idx}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Resizer Handle (Vertical) */}
        <div className="workspace-divider-vertical" onMouseDown={startResizeWidth} />

        {/* Right Side: Code Editor Workspace */}
        <section className="workspace-right-pane" style={{ width: `calc(${100 - leftWidth}% - 6px)`, flexGrow: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Editor Area */}
          <div className="editor-container-pane glass-panel" style={{ height: `${editorHeight}%`, flexGrow: 0, flexShrink: 0 }}>
            <div className="editor-control-header">
              <div className="left-icon">
                <Code2 size={16} />
                <span>Source Code</span>
              </div>
              <div className="right-lang-selector">
                <select 
                  value={activeLang} 
                  onChange={(e) => handleLangChange(e.target.value)}
                >
                  <option value="Python3">Python3</option>
                  <option value="Java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>

            <div className="code-editor-workspace" data-color-mode="dark">
              <CodeEditor
                language={activeLang === "cpp" ? "cpp" : activeLang === "Java" ? "java" : "python"}
                value={code}
                onChange={(ev) => setCode(ev.target.value)}
                padding={16}
                placeholder="// Implement your algorithm here..."
                style={{
                  fontFamily: "SFMono-Regular, Consolas, monospace",
                  fontSize: 13,
                  backgroundColor: "#080913",
                  color: "#f1f5f9",
                  minHeight: "100%",
                  outline: "none",
                  border: "0"
                }}
              />
            </div>
          </div>

          {/* Resizer Handle (Horizontal) */}
          <div className="workspace-divider-horizontal" onMouseDown={startResizeHeight} />

          {/* Test Case Panel */}
          <div className="test-cases-runner-pane glass-panel" style={{ height: `calc(${100 - editorHeight}% - 6px)`, flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <div className="test-cases-header">
              <div className="left-icon">
                <Terminal size={16} />
                <span>Test Cases & Execution</span>
              </div>
            </div>

            {/* Scrollable middle container */}
            <div className="runner-scroll-area" style={{ flexGrow: 1, overflowY: "auto" }}>
              {/* Test Case selectors */}
              {parsedExamples.length > 0 && (
                <div className="test-case-tabs">
                  {parsedExamples.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`test-tab-btn ${testCaseIndex === idx ? "active" : ""}`}
                      onClick={() => {
                        setTestCaseIndex(idx);
                        setRunResult(null);
                      }}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Test Case Inputs */}
              <div className="test-case-io-grid">
                <div className="io-input-block">
                  <label>Input</label>
                  <pre className="static-io-box">{activeExample.input}</pre>
                </div>

                <div className="io-expected-block">
                  <label>Expected Output</label>
                  <pre className="static-io-box expected-box">{activeExample.expected}</pre>
                </div>
              </div>

              {/* Run Results Output */}
              {runResult && (
                <div className={`run-result-log ${
                  runResult.status === "Accepted" 
                    ? "success" 
                    : runResult.status === "Wrong Answer" 
                    ? "wrong-answer" 
                    : "error"
                }`}>
                  <div className="result-header">
                    <span className="result-label">Result:</span>
                    <span className={`result-status-badge ${runResult.status.toLowerCase().replace(" ", "-")}`}>
                      {runResult.status}
                    </span>
                  </div>

                  {runResult.isSimulated && (
                    <div className="simulated-badge">
                      <span>⚠️ Runs simulated (No local compiler found)</span>
                    </div>
                  )}

                  {runResult.status === "Accepted" || runResult.status === "Wrong Answer" ? (
                    <div className="result-details">
                      <div className="detail-row">
                        <span>Your Output:</span>
                        <pre className="code-result">{runResult.output}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="result-details">
                      <p className="error-text">{runResult.output}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Execution Actions footer */}
            <div className="runner-footer-actions">
              <button
                type="button"
                className={`run-code-btn ${running ? "running" : ""}`}
                onClick={handleRunCode}
                disabled={running}
              >
                {running ? (
                  <>
                    <div className="spinner-small"></div>
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="submit-next-btn"
                onClick={handleNext}
              >
                <span>
                  {currentQuestionIndex === session.questions.length - 1 
                    ? "Finish Assessment" 
                    : "Submit & Next"}
                </span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
