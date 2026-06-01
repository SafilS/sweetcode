import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, GraduationCap, LogOut, Search } from "lucide-react";
import { signInWithGoogle, signOut } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/app/theme-toggle";
import { SupportButton } from "@/app/support-button";
import "./globals.css";


export const metadata: Metadata = {
  title: "SweetCode",
  description: "A learning-first coding problem library.",
  icons: {
    icon: "/images/logo.png",
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script src="/theme.js" />
      </head>
      <body>
        <div className="space-bg-decor"></div>
        <header className="site-header">
          <Link className="brand" href="/">
            <div className="brand-glow"></div>
            <img src="/images/logo.png" alt="SweetCode Logo" className="brand-logo-img" />
            <span>SweetCode</span>
          </Link>
          <nav className="top-nav" aria-label="Primary">
            {user && (
              <>
                <Link href="/problems">
                  <Search aria-hidden="true" size={18} />
                  Problems
                </Link>
                <Link href="/my-learning">
                  <GraduationCap aria-hidden="true" size={18} />
                  My Learning
                </Link>
              </>
            )}
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
        
        <div className="layout-content">
          {children}
        </div>
        <SupportButton />
      </body>
    </html>
  );
}
