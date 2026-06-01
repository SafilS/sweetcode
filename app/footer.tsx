import { Mail, Phone, Trophy } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="brand-logo">
            <img src="/images/logo.png" alt="SweetCode Logo" className="footer-logo-img" />
            <span>SweetCode</span>
          </div>
          <p className="footer-tagline">Elevating coding practice into weightless problem solving.</p>
        </div>

        <div className="footer-metadata">
          <div className="footer-meta-col">
            <h4>Developer</h4>
            <p className="developer-name">Mohammed Safil</p>
            <div className="contact-info">
              <a href="mailto:emailtosafil@gmail.com" className="contact-item">
                <Mail size={14} />
                <span>mailtosafil@gmail.com</span>
              </a>
              <a href="tel:9789378657" className="contact-item">
                <Phone size={14} />
                <span>+91 97893 78657</span>
              </a>
            </div>
          </div>

          <div className="footer-meta-col">
            <h4>Social & Profiles</h4>
            <div className="profile-links">
              <a href="https://www.linkedin.com/in/mohammedsafil039/" target="_blank" rel="noreferrer">
                <svg className="social-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                <span>LinkedIn</span>
              </a>
              <a href="https://github.com/SafilS" target="_blank" rel="noreferrer">
                <svg className="social-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <span>GitHub</span>
              </a>
              <a href="https://leetcode.com/u/mohammedsafil/" target="_blank" rel="noreferrer">
                <Trophy size={14} />
                <span>LeetCode</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-disclaimer">
          <p>
            <strong>Disclaimer:</strong> SweetCode is an unofficial, independent educational platform created strictly for learning, study, and interview preparation purposes. It is not affiliated, associated, authorized, endorsed by, or in any way officially connected with LeetCode, Leapcode, or any of their subsidiaries or affiliates. All original LeetCode problems, titles, and trademarks are the exclusive property of their respective owners. Code walkthroughs, stubs, and problem descriptions are provided &quot;as-is&quot; without any warranties of any kind, and we do not guarantee their accuracy, completeness, or correctness. Users should refer to official sources for verified information.
          </p>
        </div>
        <p>&copy; {new Date().getFullYear()} SweetCode. Designed for problem solving.</p>
      </div>
    </footer>
  );
}
