import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/app/landing-page";
import { HomeCurated } from "@/app/home-curated";
import { Footer } from "@/app/footer";

export default async function HomePage() {
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  return (
    <>
      {!user ? <LandingPage /> : <HomeCurated user={user} />}
      <Footer />
    </>
  );
}
