"use client";

import Link from "next/link";
import { ArrowRight, Brain, Calendar, Compass, Flame, GraduationCap } from "lucide-react";

type UserProps = {
  email?: string;
};

export function HomeCurated({ user }: { user: UserProps }) {
  const username = user.email ? user.email.split("@")[0] : "Coder";

  const studyPlans = [
    {
      title: "LeetCode 75",
      description: "A structured, highly recommended path covering core data structures, trees, DP, and graphs.",
      tag: "array",
      icon: Brain,
      count: "75 Problems",
      color: "blue"
    },
    {
      title: "Top Interview 150",
      description: "The ultimate compilation of classic technical questions asked in major company interviews.",
      tag: "hash-table",
      icon: GraduationCap,
      count: "150 Problems",
      color: "gold"
    },
    {
      title: "Dynamic Programming Classics",
      description: "Master bottom-up and top-down DP with selected classical optimization problems.",
      tag: "dynamic-programming", // fallback if none, let's keep DP
      icon: Flame,
      count: "25 Problems",
      color: "purple"
    }
  ];

  const featuredArticles = [
    {
      title: "Demystifying the Sliding Window",
      category: "Algorithms",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop",
      slug: "sliding-window-guide"
    },
    {
      title: "Recursion vs Iteration: When to Memoize",
      category: "Optimization",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop",
      slug: "memoization-tips"
    },
    {
      title: "Essential Graph Algorithms for Interviews",
      category: "Data Structures",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
      slug: "graph-traversals"
    }
  ];

  return (
    <main className="page-shell">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="banner-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Hello, {username} 👋</h1>
          <p>
            Study curated algorithmic paths, review solutions across multiple languages, and build up your private coding knowledge base.
          </p>
        </div>
        <div className="daily-challenge-box">
          <div className="challenge-tag">
            <Calendar size={14} />
            <span>Daily Practice</span>
          </div>
          <h3>Two Sum</h3>
          <p>Find indices of two numbers that add up to a specific target.</p>
          <Link href="/problems/two-sum" className="challenge-btn">
            Solve Challenge
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Study Plans */}
      <section className="study-plans-section">
        <div className="section-header-row">
          <h2>Curated Study Plans</h2>
          <Link href="/problems" className="view-all-link">
            Browse all problems
            <Compass size={16} />
          </Link>
        </div>
        <div className="plans-grid">
          {studyPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.title} className={`plan-card ${plan.color}`}>
                <div className="plan-icon">
                  <Icon size={24} />
                </div>
                <h3>{plan.title}</h3>
                <p>{plan.description}</p>
                <div className="plan-meta">
                  <span>{plan.count}</span>
                  <Link href={`/problems?tag=${plan.tag}`} className="plan-link">
                    Start Path
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Editorials */}
      <section className="editorials-section">
        <h2>Learning Feed & Editorials</h2>
        <div className="editorials-grid">
          {featuredArticles.map((article) => (
            <article key={article.title} className="editorial-card">
              <div className="card-image-wrap">
                <img src={article.image} alt={article.title} />
                <span className="card-badge">{article.category}</span>
              </div>
              <div className="card-content">
                <span className="read-time">{article.readTime}</span>
                <h3>{article.title}</h3>
                <p>Learn core concepts, step-by-step trace guides, and complexity optimization strategies.</p>
                {/* Visual mockup of links since we don't have static blogs */}
                <Link href="/problems" className="article-btn">
                  Explore Related Problems
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
