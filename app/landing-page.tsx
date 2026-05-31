"use client";

import { ArrowRight, Code2, Layers, NotepadText, Sparkles, Cpu } from "lucide-react";
import { signInWithGoogle } from "@/app/actions";

export function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* Decorative Orbs & Grid lines */}
      <div className="cosmic-grid"></div>
      <div className="glow-orb purple-glow"></div>
      <div className="glow-orb cyan-glow"></div>
      
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-left">
          <div className="badge-glow">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Editorial-First Premium Practice</span>
          </div>
          <h1>
            Master Algorithms, <br />
            <span className="gradient-text">Defy Gravity.</span>
          </h1>
          <p>
            Gain access to premium LeetCode questions and side-by-side multilingual solutions for free—no LeetCode Premium required. 
            Compare implementations, write private scratchpad notes, and prepare effectively for interviews.
          </p>
          <form action={signInWithGoogle}>
            <button className="cta-button" type="submit">
              Get Started with Google
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div className="hero-right">
          {/* 3D Cosmic Frame */}
          <div className="hd-image-frame">
            <div className="cosmic-ring"></div>
            <img
              src="/images/antigravity_hero.png"
              alt="Futuristic Antigravity terminal representation"
              className="hero-hd-img"
            />
          </div>
        </div>
      </section>

      {/* Grid Highlights Section */}
      <section className="landing-features">
        <div className="section-title-wrap">
          <p className="eyebrow text-center">Core Platform Features</p>
          <h2 className="section-title">Master the Art of Problem Solving</h2>
        </div>
        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="img-container">
              <img
                src="/images/pathway_feature.png"
                alt="Curated pathways winding through nebulae space"
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
                src="/images/editorials_feature.png"
                alt="Code comparison layout showing different tabs"
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
                src="/images/scratchpad_feature.png"
                alt="3D interactive notepad"
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

      {/* Premium Statistics or Badges showcasing Leetcode Premium Questions */}
      <section className="premium-showcase-section">
        <div className="premium-showcase-card">
          <div className="premium-glow-bg"></div>
          
          <div className="premium-left-col">
            <div className="badge-glow premium-accent-badge">
              <Cpu size={14} />
              <span>Democratizing Tech Prep</span>
            </div>
            <h2>Break the LeetCode Paywall for Free</h2>
            <p className="premium-problem-statement">
              <strong>The Challenge:</strong> Preparing for technical interviews often requires paid subscriptions to access advanced coding patterns—a cost that can be difficult to afford for students and developers on a tight budget.
            </p>
            <p className="premium-solution-statement">
              <strong>Our Mission:</strong> SweetCode acts as a free, open companion. We provide accessible paths to premium-tier questions, structured study tracks, and optimal multi-language solutions to help every developer learn without financial limits.
            </p>
          </div>

          <div className="premium-right-col">
            <div className="value-benefit-card">
              <div className="benefit-icon-wrapper">👑</div>
              <div className="benefit-text">
                <h4>Free Premium Access</h4>
                <p>Unlock the high-frequency interview questions that other platforms hide behind paywalls.</p>
              </div>
            </div>
            <div className="value-benefit-card">
              <div className="benefit-icon-wrapper">🌐</div>
              <div className="benefit-text">
                <h4>Multilingual Code Solutions</h4>
                <p>Compare optimal, clean implementations in Python, Java, C++, and Go side-by-side.</p>
              </div>
            </div>
            <div className="value-benefit-card">
              <div className="benefit-icon-wrapper">⚡</div>
              <div className="benefit-text">
                <h4>Zero-Friction Interface</h4>
                <p>Enjoy a high-performance, ad-free environment engineered for focus and problem-solving.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="landing-cta">
        <div className="cta-box">
          <div className="cta-glow-effect"></div>
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
