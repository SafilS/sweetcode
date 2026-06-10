"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  History, 
  Compass, 
  Code
} from "lucide-react";

interface UserStat {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  preferred_language: string;
  created_at: string;
  solved: number;
  inProgress: number;
}

interface ActivityNote {
  username: string;
  problem_title: string;
  updated_at: string;
}

interface ActivityThread {
  id: string;
  title: string;
  username: string;
  created_at: string;
}

interface DashboardClientProps {
  stats: {
    totalUsers: number;
    totalSolved: number;
    totalNotes: number;
    totalThreads: number;
  };
  users: UserStat[];
  recentNotes: ActivityNote[];
  recentThreads: ActivityThread[];
  isLocalMock?: boolean;
}

export function DashboardClient({
  stats,
  users,
  recentNotes,
  recentThreads,
  isLocalMock = false
}: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      
      return "just now";
    } catch {
      return dateString;
    }
  };

  return (
    <main className="admin-dashboard-container">
      {/* Glow Orbs for Space Theme Aesthetics */}
      <div className="glow-orb purple-glow dashboard-orb-1"></div>
      <div className="glow-orb cyan-glow dashboard-orb-2"></div>
      <div className="cosmic-grid"></div>

      {/* Top Header */}
      <header className="admin-header glass-panel">
        <div className="admin-header-title">
          <div className="title-glow-badge">
            <Sparkles size={16} />
            <span>Console</span>
          </div>
          <h1 className="gradient-text">Admin Command Center</h1>
          <p className="subtitle">Monitor system activity, user growth, and problem metrics</p>
        </div>

        {isLocalMock && (
          <div className="mock-badge">
            <ShieldAlert size={16} />
            <span>Mock Database Preview</span>
          </div>
        )}
      </header>

      {/* Metric Cards Grid */}
      <section className="stats-cards-grid">
        <div className="stat-metric-card glass-panel">
          <div className="card-inner">
            <div className="metric-icon-box cyan-metric">
              <Users size={24} />
            </div>
            <div className="metric-info">
              <h3>{stats.totalUsers}</h3>
              <p>Total Registered Users</p>
            </div>
          </div>
          <div className="card-shine cyan-shine"></div>
        </div>

        <div className="stat-metric-card glass-panel">
          <div className="card-inner">
            <div className="metric-icon-box purple-metric">
              <CheckCircle2 size={24} />
            </div>
            <div className="metric-info">
              <h3>{stats.totalSolved}</h3>
              <p>Problems Solved</p>
            </div>
          </div>
          <div className="card-shine purple-shine"></div>
        </div>

        <div className="stat-metric-card glass-panel">
          <div className="card-inner">
            <div className="metric-icon-box gold-metric">
              <FileText size={24} />
            </div>
            <div className="metric-info">
              <h3>{stats.totalNotes}</h3>
              <p>Notes Maintained</p>
            </div>
          </div>
          <div className="card-shine gold-shine"></div>
        </div>

        <div className="stat-metric-card glass-panel">
          <div className="card-inner">
            <div className="metric-icon-box green-metric">
              <MessageSquare size={24} />
            </div>
            <div className="metric-info">
              <h3>{stats.totalThreads}</h3>
              <p>Forum Threads Posted</p>
            </div>
          </div>
          <div className="card-shine green-shine"></div>
        </div>
      </section>

      {/* Dashboard Two-Column Grid */}
      <div className="admin-workspace-grid">
        {/* Left Column - User Table */}
        <section className="admin-left-panel glass-panel">
          <div className="panel-header">
            <div>
              <h2>User Directory</h2>
              <p className="panel-desc">All registered coders and progress metrics</p>
            </div>
            
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="user-table-wrapper">
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Preferred Language</th>
                  <th>Solved Count</th>
                  <th>In Progress</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="user-row-hover">
                      <td>
                        <div className="table-user-cell">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt={user.username} className="user-avatar" />
                          ) : (
                            <div className="user-avatar-placeholder">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="user-meta-cell">
                            <span className="user-username">{user.username}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="language-badge">
                          <Code size={12} />
                          {user.preferred_language}
                        </span>
                      </td>
                      <td>
                        <span className="progress-badge solved-badge">
                          {user.solved} solved
                        </span>
                      </td>
                      <td>
                        <span className="progress-badge progress-badge-in">
                          {user.inProgress} ongoing
                        </span>
                      </td>
                      <td className="table-date">{formatDate(user.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="table-empty-state">
                      <Compass size={24} />
                      <p>No matching user profiles found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column - Live feeds */}
        <aside className="admin-right-panel">
          {/* Recent Forums activity */}
          <div className="activity-panel glass-panel">
            <div className="panel-header-simple">
              <History size={18} className="panel-icon-indigo" />
              <div>
                <h3>Recent Forum Activity</h3>
                <p>Newest community threads and posts</p>
              </div>
            </div>

            <div className="activity-timeline">
              {recentThreads.length > 0 ? (
                recentThreads.map((thread) => (
                  <div key={thread.id} className="timeline-item">
                    <div className="timeline-line"></div>
                    <div className="timeline-node"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-user">@{thread.username}</span>
                        <span className="timeline-time">{formatTimeAgo(thread.created_at)}</span>
                      </div>
                      <Link href={`/problems`} className="timeline-title-link">
                        {thread.title}
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-activity">No recent forum activity recorded.</p>
              )}
            </div>
          </div>

          {/* Recent Notes updates */}
          <div className="activity-panel glass-panel">
            <div className="panel-header-simple">
              <FileText size={18} className="panel-icon-gold" />
              <div>
                <h3>Recent Notes Updated</h3>
                <p>Latest notes saved by users on problems</p>
              </div>
            </div>

            <div className="activity-timeline">
              {recentNotes.length > 0 ? (
                recentNotes.map((note, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-line"></div>
                    <div className="timeline-node note-node"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-user">@{note.username}</span>
                        <span className="timeline-time">{formatTimeAgo(note.updated_at)}</span>
                      </div>
                      <p className="timeline-text">
                        Saved notes on <strong>{note.problem_title}</strong>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-activity">No recent notes updates recorded.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
