"use client";

import Link from "next/link";
import { ArrowRight, Brain, Calendar, Compass, Flame, GraduationCap } from "lucide-react";
import { getLearningFeed, getDailyChallenge } from "@/app/actions";
import { useEffect, useState } from "react";

type UserProps = {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    given_name?: string;
    user_name?: string;
  };
};

export function HomeCurated({ user }: { user: UserProps }) {
  const nameFromMetadata = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.user_metadata?.given_name || 
                           user.user_metadata?.user_name;
  const username = nameFromMetadata || (user.email ? user.email.split("@")[0] : "Coder");

  const studyPlans = [
    {
      title: "LeetCode 75",
      description: "A structured, highly recommended path covering core data structures, trees, DP, and graphs.",
      slug: "leetcode-75",
      icon: Brain,
      count: "75 Problems",
      color: "cyan"
    },
    {
      title: "Top Interview 150",
      description: "The ultimate compilation of classic technical questions asked in major company interviews.",
      slug: "top-150",
      icon: GraduationCap,
      count: "150 Problems",
      color: "purple"
    },
    {
      title: "Dynamic Programming Classics",
      description: "Master bottom-up and top-down DP with selected classical optimization problems.",
      slug: "dp-classics",
      icon: Flame,
      count: "25 Problems",
      color: "indigo"
    }
  ];

  const featuredArticles = [
    {
      title: "Demystifying the Sliding Window",
      category: "Algorithms",
      meta: "6 min read",
      image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop",
      url: "/problems",
      description: "Learn core concepts, step-by-step trace guides, and complexity optimization strategies."
    },
    {
      title: "Recursion vs Iteration: When to Memoize",
      category: "Optimization",
      meta: "8 min read",
      image: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop",
      url: "/problems",
      description: "Learn core concepts, step-by-step trace guides, and complexity optimization strategies."
    },
    {
      title: "Essential Graph Algorithms for Interviews",
      category: "Data Structures",
      meta: "10 min read",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
      url: "/problems",
      description: "Learn core concepts, step-by-step trace guides, and complexity optimization strategies."
    }
  ];

  const [articles, setArticles] = useState<any[]>(featuredArticles);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [dailyChallenge, setDailyChallenge] = useState<any>({
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    url: "/problems/two-sum",
    isLocal: true,
    description: "Find indices of two numbers that add up to a specific target."
  });

  useEffect(() => {
    async function loadFeedAndDaily() {
      try {
        const [dynamicFeed, daily] = await Promise.all([
          getLearningFeed(),
          getDailyChallenge()
        ]);
        if (dynamicFeed && dynamicFeed.length > 0) {
          setArticles(dynamicFeed);
        }
        if (daily) {
          setDailyChallenge(daily);
        }
      } catch (err) {
        console.error("Failed to load dynamic feeds:", err);
      } finally {
        setLoadingFeed(false);
      }
    }
    loadFeedAndDaily();
  }, []);

  return (
    <main className="page-shell curated-dashboard">
      <div className="cosmic-grid"></div>
      <div className="glow-orb dashboard-orb-1"></div>
      <div className="glow-orb dashboard-orb-2"></div>

      {/* Welcome Banner */}
      <section className="welcome-banner glass-panel">
        <div className="banner-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Hello, {username} 👋</h1>
          <p>
            Get full access to premium LeetCode questions and side-by-side multilingual solutions for free—no LeetCode Premium subscription required.
          </p>
        </div>
        <div className="daily-challenge-box">
          <div className="challenge-tag">
            <Calendar size={14} />
            <span>Daily Practice</span>
          </div>
          <h3>{dailyChallenge.title}</h3>
          <p>{dailyChallenge.description}</p>
          {dailyChallenge.isLocal ? (
            <Link href={dailyChallenge.url} className="challenge-btn">
              Solve Challenge
              <ArrowRight size={16} />
            </Link>
          ) : (
            <a 
              href={dailyChallenge.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="challenge-btn"
            >
              Solve on LeetCode
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      </section>

      {/* Study Plans */}
      <section className="study-plans-section">
        <div className="section-header-row">
          <div>
            <p className="eyebrow">Curated Paths</p>
            <h2>Study Plans</h2>
          </div>
          <Link href="/problems" className="view-all-link">
            Browse all problems
            <Compass size={16} />
          </Link>
        </div>
        <div className="plans-grid">
          {studyPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.title} className={`plan-card ${plan.color} glass-panel`}>
                <div className="plan-glow-border"></div>
                <div className="plan-icon-container">
                  <Icon size={22} className="plan-icon" />
                </div>
                <h3>{plan.title}</h3>
                <p>{plan.description}</p>
                <div className="plan-meta">
                  <span>{plan.count}</span>
                  <Link href={`/study-plans/${plan.slug}`} className="plan-link">
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
        <div className="section-header-row">
          <div>
            <p className="eyebrow">Insights & Guides</p>
            <h2>Learning Feed</h2>
          </div>
        </div>
        <div className="editorials-grid">
          {articles.map((article) => (
            <article key={article.title} className="editorial-card glass-panel">
              <div className="card-image-wrap">
                <img src={article.image} alt={article.title} />
                <span className="card-badge">{article.category}</span>
              </div>
              <div className="card-content">
                <span className="read-time">{article.meta}</span>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                {article.url.startsWith("http") ? (
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="article-btn"
                  >
                    Read Article
                    <ArrowRight size={14} />
                  </a>
                ) : (
                  <Link href={article.url} className="article-btn">
                    Explore Problems
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
