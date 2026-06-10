import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { DashboardClient } from "@/app/admin/dashboard-client";

export default async function AdminPage() {
  const isConfigured = isSupabaseConfigured();

  // If Supabase is configured, check user authentication and email
  let user = null;
  if (isConfigured) {
    try {
      const client = await createClient();
      const { data } = await client.auth.getUser();
      user = data.user;
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  } else {
    // If not configured, we're in mock mode. We simulate that we are logged in as admin.
    user = { email: "mohammedsafil039@gmail.com" };
  }

  // Enforce access control
  if (!user || user.email !== "mohammedsafil039@gmail.com") {
    return (
      <main className="admin-page-denied">
        <div className="denied-card glass-panel">
          <div className="denied-icon">
            <ShieldAlert size={48} />
          </div>
          <h2>Access Denied</h2>
          <p>
            You do not have administrative permissions to view this page. Access is restricted to authorized accounts only.
          </p>
          <Link href="/" className="primary-button">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  // Load stats and user lists
  if (!isConfigured) {
    // Fallback to local mock data
    const mockStats = {
      totalUsers: 4,
      totalSolved: 280,
      totalNotes: 3,
      totalThreads: 2,
    };

    const mockUsers = [
      {
        id: "1",
        email: "mohammedsafil039@gmail.com",
        username: "mohammedsafil039",
        avatar_url: null,
        preferred_language: "Python3",
        created_at: "2026-01-10T12:00:00Z",
        solved: 75,
        inProgress: 12,
      },
      {
        id: "2",
        email: "alice_coder@gmail.com",
        username: "alice_coder",
        avatar_url: null,
        preferred_language: "TypeScript",
        created_at: "2026-02-14T08:30:00Z",
        solved: 142,
        inProgress: 4,
      },
      {
        id: "3",
        email: "bob_dev@gmail.com",
        username: "bob_dev",
        avatar_url: null,
        preferred_language: "Java",
        created_at: "2026-03-01T15:45:00Z",
        solved: 45,
        inProgress: 18,
      },
      {
        id: "4",
        email: "charlie_leet@gmail.com",
        username: "charlie_leet",
        avatar_url: null,
        preferred_language: "C++",
        created_at: "2026-05-20T10:15:00Z",
        solved: 18,
        inProgress: 2,
      },
    ];

    const mockRecentNotes = [
      {
        username: "alice_coder",
        problem_title: "Two Sum",
        updated_at: "2026-06-10T17:55:00.000Z",
      },
      {
        username: "bob_dev",
        problem_title: "Longest Palindromic Substring",
        updated_at: "2026-06-10T17:00:00.000Z",
      },
      {
        username: "charlie_leet",
        problem_title: "Merge Intervals",
        updated_at: "2026-06-10T15:00:00.000Z",
      },
    ];

    const mockRecentThreads = [
      {
        id: "thread-1",
        title: "Optimizing Two Sum with Bitwise XOR?",
        username: "alice_coder",
        created_at: "2026-06-10T17:50:00.000Z",
      },
      {
        id: "thread-2",
        title: "Welcome to SweetCode discussion group!",
        username: "mohammedsafil039",
        created_at: "2026-06-09T18:00:00.000Z",
      },
    ];

    return (
      <DashboardClient
        stats={mockStats}
        users={mockUsers}
        recentNotes={mockRecentNotes}
        recentThreads={mockRecentThreads}
        isLocalMock={true}
      />
    );
  }

  // Load real data from Supabase using Service Role Key
  interface ProfileRow {
    user_id: string;
    username: string | null;
    avatar_url: string | null;
    preferred_language: string;
  }

  interface ProgressRow {
    user_id: string;
    status: string;
  }

  interface NoteRow {
    user_id: string;
    problem_id: string;
    updated_at: string;
  }

  interface ThreadRow {
    id: string;
    title: string;
    created_at: string;
    user_id: string;
  }

  interface ProblemRow {
    id: string;
    title: string;
  }

  let stats;
  let usersList;
  let recentNotesMapped;
  let recentThreadsMapped;
  let loadError = false;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminClient = createAdminClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Run queries in parallel
    const [
      authUsersResult,
      profilesResult,
      progressResult,
      notesCountResult,
      threadsCountResult,
      notesResult,
      threadsResult,
      problemsResult,
    ] = await Promise.all([
      adminClient.auth.admin.listUsers(),
      adminClient.from("profiles").select("user_id, username, avatar_url, preferred_language"),
      adminClient.from("user_problem_progress").select("user_id, status"),
      adminClient.from("user_notes").select("user_id, problem_id, updated_at"),
      adminClient.from("discussion_threads").select("id, title, created_at, user_id"),
      adminClient.from("user_notes").select("user_id, problem_id, updated_at").order("updated_at", { ascending: false }).limit(5),
      adminClient.from("discussion_threads").select("id, title, created_at, user_id").order("created_at", { ascending: false }).limit(5),
      adminClient.from("problems").select("id, title"),
    ]);

    if (authUsersResult.error) throw authUsersResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const authUsers = authUsersResult.data.users;
    const profiles = (profilesResult.data ?? []) as unknown as ProfileRow[];
    const progressRows = (progressResult.data ?? []) as unknown as ProgressRow[];
    const notesCountData = (notesCountResult.data ?? []) as unknown as NoteRow[];
    const threadsCountData = (threadsCountResult.data ?? []) as unknown as ThreadRow[];
    const notes = (notesResult.data ?? []) as unknown as NoteRow[];
    const threads = (threadsResult.data ?? []) as unknown as ThreadRow[];
    const problems = (problemsResult.data ?? []) as unknown as ProblemRow[];

    const totalUsers = authUsers.length;
    const totalSolved = progressRows.filter((r) => r.status === "SOLVED").length;
    const totalNotes = notesCountData.length;
    const totalThreads = threadsCountData.length;

    // Combine profile & progress metrics for all users
    usersList = authUsers.map((u) => {
      const profile = profiles.find((p) => p.user_id === u.id);
      const userProgress = progressRows.filter((pr) => pr.user_id === u.id);
      const solved = userProgress.filter((pr) => pr.status === "SOLVED").length;
      const inProgress = userProgress.filter((pr) => pr.status === "IN_PROGRESS").length;

      return {
        id: u.id,
        email: u.email ?? "no-email@supabase.com",
        username: profile?.username ?? "Anonymous",
        avatar_url: profile?.avatar_url ?? null,
        preferred_language: profile?.preferred_language ?? "Python3",
        created_at: u.created_at,
        solved,
        inProgress,
      };
    });

    // Map recent notes to include usernames & problem titles in memory safely
    recentNotesMapped = notes.map((note) => {
      const profile = profiles.find((p) => p.user_id === note.user_id);
      const problem = problems.find((p) => p.id === note.problem_id);
      return {
        username: profile?.username ?? "Anonymous",
        problem_title: problem?.title ?? "Unknown Problem",
        updated_at: note.updated_at,
      };
    });

    // Map recent forum threads to include usernames in memory safely
    recentThreadsMapped = threads.map((thread) => {
      const profile = profiles.find((p) => p.user_id === thread.user_id);
      return {
        id: thread.id,
        title: thread.title,
        username: profile?.username ?? "Anonymous",
        created_at: thread.created_at,
      };
    });

    stats = {
      totalUsers,
      totalSolved,
      totalNotes,
      totalThreads,
    };
  } catch (error) {
    console.error("Admin dashboard data load failed:", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <main className="admin-page-denied">
        <div className="denied-card glass-panel">
          <div className="denied-icon">
            <ShieldAlert size={48} />
          </div>
          <h2>Database Load Error</h2>
          <p>
            An error occurred while fetching admin dashboard metrics. Please check that Supabase credentials and database schemas are fully configured.
          </p>
          <Link href="/" className="primary-button">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <DashboardClient
      stats={stats!}
      users={usersList!}
      recentNotes={recentNotesMapped!}
      recentThreads={recentThreadsMapped!}
      isLocalMock={false}
    />
  );
}
