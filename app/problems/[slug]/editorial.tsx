"use client";

import { useState } from "react";
import { Eye, EyeOff, Maximize2, ExternalLink, Sparkles, AlertCircle } from "lucide-react";

interface EditorialScreenshot {
  id: string;
  image_url: string;
  source_url: string | null;
  caption: string | null;
  sort_order: number;
}

interface ProblemEditorialProps {
  screenshots?: EditorialScreenshot[];
  problemTitle: string;
  problemSlug: string;
}

export function ProblemEditorial({ screenshots = [], problemTitle, problemSlug }: ProblemEditorialProps) {
  const [invertColors, setInvertColors] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<"fit" | "large" | "original">("fit");
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  if (!screenshots || screenshots.length === 0) {
    return (
      <div className="empty-editorial-state glass-panel">
        <div className="empty-editorial-icon">
          <AlertCircle size={32} />
        </div>
        <h3>No Editorial Screenshots Available</h3>
        <p>
          We couldn&apos;t find official editorial screenshots for <strong>{problemTitle}</strong>. 
          Please check the community solutions tab for detailed code walk-throughs and approaches!
        </p>
      </div>
    );
  }

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  const getZoomClass = () => {
    switch (zoomLevel) {
      case "large":
        return "zoom-large";
      case "original":
        return "zoom-original";
      default:
        return "zoom-fit";
    }
  };

  return (
    <div className="problem-editorial-container">
      {/* Control Panel */}
      <div className="editorial-control-panel glass-panel">
        <div className="panel-title-section">
          <div className="icon-badge">
            <Sparkles size={16} />
          </div>
          <div>
            <h4>Official LeetCode Editorial</h4>
            <p className="subtext">Screenshots of step-by-step editorial explanations</p>
          </div>
        </div>

        <div className="panel-actions">
          {/* Invert Colors (Dark Mode Toggle) */}
          <button
            type="button"
            className={`control-btn ${invertColors ? "active" : ""}`}
            onClick={() => setInvertColors(!invertColors)}
            title="Toggle color inversion (useful for reading white screenshots in dark mode)"
          >
            {invertColors ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{invertColors ? "Original Colors" : "Invert (Dark Mode)"}</span>
          </button>

          {/* Zoom Level Selectors */}
          <div className="zoom-control-group">
            <button
              type="button"
              className={`zoom-btn ${zoomLevel === "fit" ? "active" : ""}`}
              onClick={() => setZoomLevel("fit")}
              title="Fit to panel width"
            >
              Fit
            </button>
            <button
              type="button"
              className={`zoom-btn ${zoomLevel === "large" ? "active" : ""}`}
              onClick={() => setZoomLevel("large")}
              title="Zoom to 150%"
            >
              1.5x
            </button>
            <button
              type="button"
              className={`zoom-btn ${zoomLevel === "original" ? "active" : ""}`}
              onClick={() => setZoomLevel("original")}
              title="Show original resolution (scrollable)"
            >
              <Maximize2 size={14} />
              Original
            </button>
          </div>

          {/* Source Link */}
          <a
            href={`https://leetcode.com/problems/${problemSlug}/editorial/`}
            target="_blank"
            rel="noopener noreferrer"
            className="control-btn-link"
            title="View official LeetCode editorial page"
          >
            <ExternalLink size={16} />
            <span>LeetCode Editorial</span>
          </a>
        </div>
      </div>

      {/* Screenshot Container */}
      <div className="editorial-screenshots-view">
        {screenshots.map((screenshot) => (
          <div key={screenshot.id} className="screenshot-card glass-panel">
            {screenshot.caption && (
              <div className="screenshot-caption">
                <span>{screenshot.caption}</span>
              </div>
            )}
            
            <div className={`screenshot-wrapper ${getZoomClass()}`}>
              {!loadedImages[screenshot.id] && (
                <div className="screenshot-skeleton-loading">
                  <div className="pulse-loader"></div>
                  <span>Loading screenshot...</span>
                </div>
              )}
              
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot.image_url}
                alt={screenshot.caption || `Editorial screenshot for ${problemTitle}`}
                className={`editorial-img ${invertColors ? "inverted-img" : ""} ${loadedImages[screenshot.id] ? "loaded" : ""}`}
                onLoad={() => handleImageLoad(screenshot.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
