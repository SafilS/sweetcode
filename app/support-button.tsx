"use client";

import { useState } from "react";
import { Heart, X, Sparkles } from "lucide-react";

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        className="support-fab-btn"
        onClick={() => setIsOpen(true)}
        title="Support SweetCode"
        type="button"
      >
        <Heart size={18} className="fab-heart-icon" />
        <span className="fab-text">Support SweetCode</span>
      </button>

      {/* Support Popover Modal overlay */}
      {isOpen && (
        <div className="support-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="support-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="support-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              type="button"
            >
              <X size={18} />
            </button>

            <div className="support-modal-header">
              <div className="support-modal-icon-wrap">
                <Heart size={24} />
              </div>
              <h3>Support Our Mission</h3>
            </div>

            <div className="support-modal-body">
              <p>
                SweetCode is a labor of love engineered to keep premium coding education accessible and <strong>100% free</strong> for developers globally.
              </p>
              <p>
                If this platform has helped you prepare for interviews or master problem-solving, consider backing us to keep servers running and database hosting alive.
              </p>

              <div className="donation-tiers">
                {/* Tier 1 */}
                <div className="tier-card">
                  <span className="tier-emoji">☕</span>
                  <div className="tier-info">
                    <h5>Buy a Coffee</h5>
                    <p>$5 — Keeps server runtime alive</p>
                  </div>
                  <a 
                    className="tier-donate-btn" 
                    href="https://u.payu.in/PAYUMN/LJ1yKd4AZNSt"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Back
                  </a>
                </div>

                {/* Tier 2 */}
                <div className="tier-card featured">
                  <span className="tier-emoji">🚀</span>
                  <div className="tier-info">
                    <h5>Sponsor a Track</h5>
                    <p>$15 — Funds database hosting</p>
                  </div>
                  <a 
                    className="tier-donate-btn primary-tier-btn" 
                    href="https://u.payu.in/PAYUMN/LJ1yKd4AZNSt"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Back
                  </a>
                </div>

                {/* Tier 3 */}
                <div className="tier-card">
                  <span className="tier-emoji">💖</span>
                  <div className="tier-info">
                    <h5>Become a Patron</h5>
                    <p>Custom — Monthly cloud infrastructure</p>
                  </div>
                  <a 
                    className="tier-donate-btn" 
                    href="https://u.payu.in/PAYUMN/LJ1yKd4AZNSt"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Back
                  </a>
                </div>
              </div>

              <p className="support-thanks-msg">
                <Sparkles size={13} className="sparkle-thanks-icon" />
                Every backer helps keep SweetCode open. Thank you for your support!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
