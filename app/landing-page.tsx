"use client";

import { ArrowRight, Code2, Layers, NotepadText, Sparkles } from "lucide-react";
import { signInWithGoogle } from "@/app/actions";

export function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-left">
          <div className="badge-glow">
            <Sparkles size={14} />
            <span>Editorial-First Practice</span>
          </div>
          <h1>
            Master Algorithms, <br />
            <span className="gradient-text">Compare Clean Code</span>
          </h1>
          <p>
            An immersive platform for studying algorithm solutions, comparing multilingual code implementations,
            and writing private scratchpad notes. Built for developers who value deep understanding over speed.
          </p>
          <form action={signInWithGoogle}>
            <button className="cta-button" type="submit">
              Get Started with Google
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div className="hero-right">
          {/* HD Unsplash Code Image Container */}
          <div className="hd-image-frame">
            <img
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1600&auto=format&fit=crop"
              alt="High definition coding editor backdrop"
              className="hero-hd-img"
            />
            {/* Overlay CSS-Animated Code Terminal Mockup */}
            <div className="animated-terminal">
              <div className="terminal-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="title">two_sum.py</span>
              </div>
              <div className="terminal-body">
                <span className="line-num">1</span>
                <span className="code-kw">def</span> <span className="code-fn">twoSum</span>(nums: List[int], target: int) -&gt; List[int]:<br />
                <span className="line-num">2</span>
                &nbsp;&nbsp;&nbsp;&nbsp;seen = &#123;&#125;<br />
                <span className="line-num">3</span>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="code-kw">for</span> i, num <span className="code-kw">in</span> <span className="code-fn">enumerate</span>(nums):<br />
                <span className="line-num">4</span>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;diff = target - num<br />
                <span className="line-num">5</span>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-kw">if</span> diff <span className="code-kw">in</span> seen:<br />
                <span className="line-num">6</span>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-kw">return</span> [seen[diff], i]<br />
                <span className="line-num">7</span>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;seen[num] = i
              </div>
              <div className="animated-toast">
                <Sparkles size={14} className="sparkle-toast" />
                <span>Insight saved to Code Scratchpad!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Highlights Section */}
      <section className="landing-features">
        <h2 className="section-title">Designed for Deep Learning</h2>
        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="img-container">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
                alt="Curated roads abstract pattern"
              />
              <div className="icon-overlay">
                <Layers size={24} />
              </div>
            </div>
            <h3>Curated Study Paths</h3>
            <p>Skip the random search. Explore structured roadmaps like Top Interview 75 and Dynamic Programming classics.</p>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="img-container">
              <img
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop"
                alt="Multilingual code blocks comparison screen"
              />
              <div className="icon-overlay">
                <Code2 size={24} />
              </div>
            </div>
            <h3>Multi-Approach Editorials</h3>
            <p>Study various algorithmic solutions for a single problem side-by-side, comparison-ready across languages.</p>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="img-container">
              <img
                src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop"
                alt="Workspace with notebooks representing personal code scratchpad"
              />
              <div className="icon-overlay">
                <NotepadText size={24} />
              </div>
            </div>
            <h3>Private Note Scratchpad</h3>
            <p>Write custom insights or code solutions in your dedicated workspace, persistent for review.</p>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="landing-cta">
        <div className="cta-box">
          <h2>Start Refining Your Coding Skills Today</h2>
          <p>Create your personal profile to track progress, save custom scratchpads, and unlock all curated roadmaps.</p>
          <form action={signInWithGoogle}>
            <button className="cta-button light" type="submit">
              Continue with Google
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
