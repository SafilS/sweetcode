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
    .select("id, title, slug, problem_texts(constraints)");

  if (error) {
    console.error(error);
    return;
  }

  console.log("Searching for constraints with powers like 104, 105, 109, 231...");
  for (const item of data) {
    const constraints = item.problem_texts?.constraints || [];
    for (const c of constraints) {
      if (c.includes("104") || c.includes("105") || c.includes("109") || c.includes("231") || c.includes("232")) {
        console.log(`- [${item.title}] Constraint: "${c}"`);
      }
    }
  }
}

main().catch(console.error);
