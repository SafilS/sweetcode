"use client";

import { useState } from "react";
import { BookOpen, Code2, MessageSquare } from "lucide-react";

interface ProblemTabsProps {
  descriptionNode: React.ReactNode;
  solutionsNode: React.ReactNode;
  discussionNode: React.ReactNode;
}

type TabType = "description" | "solutions" | "discussion";

export function ProblemTabs({
  descriptionNode,
  solutionsNode,
  discussionNode
}: ProblemTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("description");

  const tabs: { type: TabType; label: string; icon: typeof BookOpen }[] = [
    { type: "description", label: "Description", icon: BookOpen },
    { type: "solutions", label: "Solutions", icon: Code2 },
    { type: "discussion", label: "Discussion", icon: MessageSquare }
  ];

  return (
    <div className="problem-tabs-container">
      <nav className="problem-tabs-header" aria-label="Problem navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.type;
          return (
            <button
              key={tab.type}
              className={`tab-button ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(tab.type)}
              role="tab"
              aria-selected={isActive}
              type="button"
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="problem-tabs-content">
        <div className={`tab-panel ${activeTab === "description" ? "active" : ""}`}>
          {descriptionNode}
        </div>
        <div className={`tab-panel ${activeTab === "solutions" ? "active" : ""}`}>
          {solutionsNode}
        </div>
        <div className={`tab-panel ${activeTab === "discussion" ? "active" : ""}`}>
          {discussionNode}
        </div>
      </div>
    </div>
  );
}
