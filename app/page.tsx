import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/app/landing-page";
import { HomeCurated } from "@/app/home-curated";

export default async function HomePage() {
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  if (!user) {
    return <LandingPage />;
  }

  return <HomeCurated user={user} />;
}
