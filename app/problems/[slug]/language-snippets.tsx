"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import Prism from "prismjs";

// Import Prism language components
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-typescript";

type Snippet = {
  id: string;
  language: string;
  code: string;
};

const preferredOrder = [
  "Python3",
  "Java",
  "C++",
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust"
];

function firstLanguage(snippets: Snippet[]) {
  return preferredOrder.find((language) => snippets.some((snippet) => snippet.language === language))
    ?? snippets[0]?.language
    ?? "";
}

function getLanguageGrammar(lang: string) {
  const normalized = lang.toLowerCase();
  if (normalized.startsWith("python")) return { grammar: Prism.languages.python, name: "python" };
  if (normalized === "java") return { grammar: Prism.languages.java, name: "java" };
  if (normalized === "c++" || normalized === "cpp") return { grammar: Prism.languages.cpp, name: "cpp" };
  if (normalized === "c") return { grammar: Prism.languages.c, name: "c" };
  if (normalized === "c#") return { grammar: Prism.languages.csharp, name: "csharp" };
  if (normalized === "typescript" || normalized === "ts") return { grammar: Prism.languages.typescript, name: "typescript" };
  if (normalized === "javascript" || normalized === "js") return { grammar: Prism.languages.javascript, name: "javascript" };
  if (normalized === "go") return { grammar: Prism.languages.go, name: "go" };
  if (normalized === "rust") return { grammar: Prism.languages.rust, name: "rust" };
  return { grammar: Prism.languages.clike, name: "clike" };
}

export function LanguageSnippets({ snippets }: { snippets: Snippet[] }) {
  const [selectedLanguage, setSelectedLanguage] = useState(() => firstLanguage(snippets));
  const [copied, setCopied] = useState(false);
  const selectedSnippet = useMemo(
    () => snippets.find((snippet) => snippet.language === selectedLanguage) ?? snippets[0],
    [selectedLanguage, snippets]
  );

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("sweetcode:preferred-language");
    if (storedLanguage && snippets.some((snippet) => snippet.language === storedLanguage)) {
      setTimeout(() => setSelectedLanguage(storedLanguage), 0);
    }
  }, [snippets]);

  const highlightedHtml = useMemo(() => {
    if (!selectedSnippet) return "";
    const { grammar, name } = getLanguageGrammar(selectedSnippet.language);
    if (grammar) {
      try {
        return Prism.highlight(selectedSnippet.code, grammar, name);
      } catch (err) {
        console.error("Prism highlighting error:", err);
      }
    }
    return selectedSnippet.code;
  }, [selectedSnippet]);

  function selectLanguage(language: string) {
    setSelectedLanguage(language);
    window.localStorage.setItem("sweetcode:preferred-language", language);
    setCopied(false);
  }

  async function copyCode() {
    await window.navigator.clipboard.writeText(selectedSnippet.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!snippets.length || !selectedSnippet) {
    return null;
  }

  return (
    <div className="snippet-tabs">
      <div className="language-tabs" aria-label="Solution languages">
        {snippets.map((snippet) => (
          <button
            aria-pressed={snippet.language === selectedSnippet.language}
            className={snippet.language === selectedSnippet.language ? "active" : ""}
            key={snippet.id}
            onClick={() => selectLanguage(snippet.language)}
            type="button"
          >
            <Code2 aria-hidden="true" size={14} />
            {snippet.language}
          </button>
        ))}
      </div>
      <div className="code-toolbar">
        <span>{selectedSnippet.language}</span>
        <button onClick={copyCode} type="button">
          {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
}
