import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { AssessmentSetup } from "@/app/assessment/setup";

export default async function AssessmentLandingPage() {
  const isConfigured = isSupabaseConfigured();
  let user = null;

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Offline fallback
    }
  } else {
    // Local mock environment
    user = { email: "mohammedsafil039@gmail.com" };
  }

  if (!user) {
    redirect("/");
  }

  return <AssessmentSetup />;
}
