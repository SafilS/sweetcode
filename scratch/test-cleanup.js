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
    .eq("slug", "two-sum")
    .single();

  if (error) {
    console.error(error);
    return;
  }

  const rawDesc = data.problem_texts.description;
  console.log("--- RAW DESCRIPTION ---");
  console.log(JSON.stringify(rawDesc));

  // Let's test a restoration function
  function restoreSuperscripts(text) {
    // Replace digits/variables followed by newline and then digit (e.g. 10\n4 or n\n2)
    // with superscript notation
    return text
      .replace(/(\b\d+)\n+(\d+)\b/g, "$1^$2")
      .replace(/(\b[a-zA-Z])\n+(\d+)\b/g, "$1^$2");
  }

  const restored = restoreSuperscripts(rawDesc);
  console.log("\n--- RESTORED SUPERSCRIPTS ---");
  console.log(JSON.stringify(restored));

  // Now let's split by double newlines and clean paragraph blocks
  function cleanDescription(text) {
    const temp = restoreSuperscripts(text);
    const blocks = temp.split(/\n{2,}/);
    const cleaned = blocks.map(block => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return "";
      
      // Check if block is a list or example/constraint block
      const lines = trimmedBlock.split("\n");
      const isList = lines.some(line => /^\s*[-*•\d+.]/.test(line) || line.toLowerCase().startsWith("input:") || line.toLowerCase().startsWith("output:") || line.toLowerCase().startsWith("explanation:"));
      
      if (isList) {
        // Keep separate lines but clean individual lines
        return lines.map(line => line.trim()).filter(Boolean).join("\n");
      } else {
        // Join lines in a paragraph with a space and collapse whitespace
        return trimmedBlock.replace(/\n+/g, " ").replace(/\s+/g, " ");
      }
    }).filter(Boolean);

    return cleaned.join("\n\n");
  }

  const cleaned = cleanDescription(rawDesc);
  console.log("\n--- CLEANED DESCRIPTION ---");
  console.log(cleaned);
}

main().catch(console.error);
