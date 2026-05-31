const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

async function main() {
  const envFile = fs.readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of envFile.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    env[key] = value;
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from("problems")
    .select("id, title, slug, problem_texts(description)")
    .limit(5);

  function cleanParagraphs(text) {
    // First restore superscripts
    let temp = text
      .replace(/(\b\d+)\n+(\d+)\b/g, "$1^$2")
      .replace(/(\b[a-zA-Z])\n+(\d+)\b/g, "$1^$2");

    // Split by double newlines or more
    const blocks = temp.split(/\n{2,}/);
    const cleaned = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      
      const lines = trimmed.split("\n");
      const isList = lines.some(line => /^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line));
      if (isList) {
        return lines.map(line => line.trim()).filter(Boolean).join("\n");
      } else {
        return trimmed.replace(/\n+/g, " ").replace(/\s+/g, " ");
      }
    }).filter(Boolean);

    return cleaned.join("\n\n");
  }

  function parseDescription(description) {
    // 1. Find if there is a "Follow-up" section
    let followUpText = "";
    const followUpMatch = description.match(/Follow-up[\s\S]*$/i);
    if (followUpMatch) {
      followUpText = followUpMatch[0];
    }

    // 2. Truncate before examples or constraints
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

    return {
      mainDescription: cleanParagraphs(mainDescription),
      followUpText: followUpText ? cleanParagraphs(followUpText) : ""
    };
  }

  for (const problem of data) {
    console.log(`\n========================================`);
    console.log(`TITLE: ${problem.title}`);
    console.log(`========================================`);
    const parsed = parseDescription(problem.problem_texts.description);
    console.log("--- MAIN DESCRIPTION ---");
    console.log(parsed.mainDescription);
    if (parsed.followUpText) {
      console.log("--- FOLLOW UP ---");
      console.log(parsed.followUpText);
    }
  }
}

main().catch(console.error);
