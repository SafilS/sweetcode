import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Resetting welcome_email_sent flag for all profiles...");
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ welcome_email_sent: false })
    .filter("welcome_email_sent", "eq", true);

  if (error) {
    console.error("Error resetting profiles:", error);
  } else {
    console.log("Successfully reset welcome_email_sent to false for previously flagged profiles.");
  }
}

main();
