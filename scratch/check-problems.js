const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

async function main() {
  // Read env variables manually
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

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Supabase URL:", supabaseUrl);
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in env file");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("problems")
    .select("id, title, slug, problem_texts(description)")
    .limit(3);

  if (error) {
    console.error("Error fetching problems:", error);
    return;
  }

  console.log("Fetched sample problems:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
