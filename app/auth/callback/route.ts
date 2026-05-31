import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.session?.user;

    if (user && user.email) {
      // Check if welcome email has been sent yet
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, username, welcome_email_sent")
        .eq("user_id", user.id)
        .single();

      if (profile && !profile.welcome_email_sent) {
        // Set welcome_email_sent to true first to avoid race conditions
        await supabase
          .from("profiles")
          .update({ welcome_email_sent: true })
          .eq("user_id", user.id);

        const { sendWelcomeEmail } = await import("@/lib/email");
        sendWelcomeEmail(user.email, profile.username || "Coder").catch((err) => {
          console.error("Welcome email send failure:", err);
        });
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
