import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BookOpen, GraduationCap, LogOut, Search } from "lucide-react";
import { signInWithGoogle, signOut } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/app/theme-toggle";
import "./globals.css";


export const metadata: Metadata = {
  title: "SweetCode",
  description: "A learning-first coding problem library."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  return (
    <html lang="en">
      <head>
        <Script
          id="theme-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('sweetcode:theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `
          }}
        />
      </head>
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            <BookOpen aria-hidden="true" size={22} />
            <span>SweetCode</span>
          </Link>
          <nav className="top-nav" aria-label="Primary">
            <Link href="/problems">
              <Search aria-hidden="true" size={18} />
              Problems
            </Link>
            <Link href="/my-learning">
              <GraduationCap aria-hidden="true" size={18} />
              My Learning
            </Link>
            <ThemeToggle />
            {user ? (
              <form action={signOut}>
                <button className="ghost-button" type="submit">
                  <LogOut aria-hidden="true" size={18} />
                  Sign out
                </button>
              </form>
            ) : (
              <form action={signInWithGoogle}>
                <button
                  className="primary-button"
                  disabled={!isSupabaseConfigured()}
                  title={!isSupabaseConfigured() ? "Add Supabase env vars to enable Google login." : undefined}
                  type="submit"
                >
                  {isSupabaseConfigured() ? "Continue with Google" : "Auth setup pending"}
                </button>
              </form>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
