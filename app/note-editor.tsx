"use client";

import { useRef, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { saveProblemNote } from "@/app/actions";
import dynamic from "next/dynamic";

// Dynamically import the CodeEditor component to avoid hydration issues during SSR
const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

export function NoteEditor({
  problemId,
  slug,
  initialNote,
  signedIn
}: {
  problemId: string;
  slug: string;
  initialNote: string | null;
  signedIn: boolean;
}) {
  const [note, setNote] = useState(initialNote ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"text" | "code">("text");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section>
      <div className="section-heading-row">
        <h2>Private Note</h2>
        {savedAt ? <span>{savedAt}</span> : null}
      </div>

      {signedIn && (
        <div className="editor-tabs">
          <button
            className={editorMode === "text" ? "active" : ""}
            onClick={() => setEditorMode("text")}
            type="button"
          >
            Text Notes
          </button>
          <button
            className={editorMode === "code" ? "active" : ""}
            onClick={() => setEditorMode("code")}
            type="button"
          >
            Code Scratchpad
          </button>
        </div>
      )}

      <form
        className="note-editor"
        ref={formRef}
        action={() => {
          startTransition(async () => {
            await saveProblemNote(problemId, slug, note);
            setSavedAt("Saved");
          });
        }}
      >
        {editorMode === "code" && signedIn ? (
          <div className="code-editor-wrap" data-color-mode="dark">
            <CodeEditor
              disabled={pending}
              language="python"
              onChange={(ev) => {
                setNote(ev.target.value);
                setSavedAt(null);
              }}
              padding={16}
              placeholder="// Write code insights or scratchpad ideas here..."
              style={{
                fontFamily: "SFMono-Regular, Consolas, monospace",
                fontSize: 13,
                backgroundColor: "#121816",
                color: "#f0f6f3",
                borderRadius: 8,
                border: "1px solid #26332f",
                minHeight: 150
              }}
              value={note}
            />
          </div>
        ) : (
          <textarea
            disabled={!signedIn || pending}
            onChange={(event) => {
              setNote(event.target.value);
              setSavedAt(null);
            }}
            placeholder={
              signedIn
                ? "Write the insight you want future-you to remember."
                : "Sign in with Google to save private notes."
            }
            value={note}
          />
        )}
        <button className="primary-button" disabled={!signedIn || pending} type="submit">
          <Save aria-hidden="true" size={16} />
          {pending ? "Saving" : note.trim() ? "Save note" : "Clear note"}
        </button>
      </form>
    </section>
  );
}
