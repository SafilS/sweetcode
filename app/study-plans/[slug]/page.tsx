import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStudyPlanData } from "@/lib/problems";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { StudyPlanTracker } from "./study-plan-tracker";

export default async function StudyPlanPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;
  
  if (!user) {
    redirect("/");
  }

  const { slug } = await params;
  const planData = await getStudyPlanData(slug);

  if (!planData) {
    redirect("/");
  }

  const { plan, problems, solvedCount } = planData;

  return (
    <main className="page-shell study-plan-detail">
      <div className="cosmic-grid"></div>
      <div className={`glow-orb plan-orb-${plan.color}`}></div>

      <section className="page-heading">
        <Link className="back-link" href="/">
          <ArrowLeft aria-hidden="true" size={18} />
          Dashboard
        </Link>
      </section>

      <StudyPlanTracker 
        plan={plan} 
        problems={problems} 
        initialSolvedCount={solvedCount} 
      />
    </main>
  );
}
