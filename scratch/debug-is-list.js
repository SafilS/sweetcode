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

  const rawDesc = data.problem_texts.description;
  console.log("Raw Desc length:", rawDesc.length);

  function restoreSuperscripts(text) {
    return text
      .replace(/(\b\d+)\n+(\d+)\b/g, "$1^$2")
      .replace(/(\b[a-zA-Z])\n+(\d+)\b/g, "$1^$2");
  }

  const temp = restoreSuperscripts(rawDesc);
  const blocks = temp.split(/\n{2,}/);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;
    const lines = block.split("\n");
    console.log(`Block ${i}:`);
    for (const line of lines) {
      const isListLine = /^\s*[-*•\d+.]/.test(line);
      const isHeader = line.toLowerCase().startsWith("input:") || line.toLowerCase().startsWith("output:") || line.toLowerCase().startsWith("explanation:");
      console.log(`  Line: ${JSON.stringify(line)} -> isListLine: ${isListLine}, isHeader: ${isHeader}`);
    }
  }
}

main().catch(console.error);
