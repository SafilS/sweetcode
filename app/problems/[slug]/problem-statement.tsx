import React from "react";

function cleanParagraphs(text: string) {
  // First restore superscripts (e.g. 10\n4 -> 10^4, n\n2 -> n^2)
  const temp = text
    .replace(/(\b\d+)\n+(\d+)\b/g, "$1^$2")
    .replace(/(\b[a-zA-Z])\n+(\d+)\b/g, "$1^$2");

  // Split by double newlines or more
  const blocks = temp.split(/\n{2,}/);
  const cleaned = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    
    const lines = trimmed.split("\n");
    // List check: lines starting with bullet markers like -, *, •, or numbers followed by dot/parenthesis
    const isList = lines.some(line => /^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line));
    if (isList) {
      return {
        type: "list" as const,
        lines: lines.map(line => line.trim()).filter(Boolean)
      };
    } else {
      // Normal paragraph: join lines with a space and collapse whitespace
      return {
        type: "paragraph" as const,
        text: trimmed.replace(/\n+/g, " ").replace(/\s+/g, " ")
      };
    }
  }).filter((b): b is NonNullable<typeof b> => b !== null);

  return cleaned;
}

export function ProblemStatement({ description }: { description?: string | null }) {
  if (!description) return null;

  // Extract Follow-up
  let followUpText = "";
  const followUpMatch = description.match(/Follow-up[\s\S]*$/i);
  if (followUpMatch) {
    followUpText = followUpMatch[0];
  }

  // Truncate description before examples or constraints
  const exampleIndex = description.search(/(Example\s*\d+|Example:)/i);
  let mainDescription = description;
  if (exampleIndex !== -1) {
    mainDescription = description.slice(0, exampleIndex);
  } else {
    const constraintsIndex = description.search(/Constraints:/i);
    if (constraintsIndex !== -1) {
      mainDescription = description.slice(0, constraintsIndex);
    }
  }

  const mainBlocks = cleanParagraphs(mainDescription);
  const followUpBlocks = followUpText ? cleanParagraphs(followUpText) : [];

  return (
    <div className="statement-body">
      {mainBlocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index}>
            {block.lines.map((line, i) => (
              <li key={i}>{line.replace(/^[-*•]\s*/, "")}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>{block.text}</p>
        )
      )}
      {followUpBlocks.length > 0 && (
        <div className="follow-up-card">
          <h4 className="follow-up-title">Follow-up</h4>
          {followUpBlocks.map((block, index) =>
            block.type === "list" ? (
              <ul key={index}>
                {block.lines.map((line, i) => (
                  <li key={i}>{line.replace(/^[-*•]\s*/, "")}</li>
                ))}
              </ul>
            ) : (
              <p key={index}>{block.text.replace(/^Follow-up:\s*/i, "")}</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
