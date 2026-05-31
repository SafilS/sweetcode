"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, FileText } from "lucide-react";
import type { ProblemListItem } from "@/lib/problems";
import { updateProblemProgress } from "@/app/actions";

type PlannedProblemItem = {
  id: string;
  problem_number: string;
  title: string;
  slug: string;
  difficulty: string;
  is_premium: boolean;
  solved: boolean;
  category: string;
  index: number;
  isStub?: boolean;
  problem_tags?: { tags: { name: string; slug: string } }[];
};

type StudyPlanTrackerProps = {
  plan: {
    slug: string;
    title: string;
    description: string;
    color: string;
    limit: number;
  };
  problems: ProblemListItem[];
  initialSolvedCount: number;
};

const LEETCODE_75_TITLES = [
  "Merge Strings Alternately",
  "Greatest Common Divisor of Strings",
  "Kids With the Greatest Number of Candies",
  "Can Place Flowers",
  "Reverse Vowels of a String",
  "Reverse Words in a String",
  "Product of Array Except Self",
  "Increasing Triplet Subsequence",
  "String Compression",
  "Move Zeroes",
  "Is Subsequence",
  "Container With Most Water",
  "Max Number of K-Sum Pairs",
  "Maximum Average Subarray I",
  "Maximum Number of Vowels in a Substring of Given Length",
  "Max Consecutive Ones III",
  "Longest Subarray of 1's After Deleting One Element",
  "Find the Highest Altitude",
  "Find Pivot Index",
  "Find the Difference of Two Arrays",
  "Unique Number of Occurrences",
  "Determine if Two Strings Are Close",
  "Equal Row and Column Pairs",
  "Removing Stars From a String",
  "Asteroid Collision",
  "Decode String",
  "Number of Recent Calls",
  "Dota2 Senate",
  "Delete the Middle Node of a Linked List",
  "Odd Even Linked List",
  "Reverse Linked List",
  "Maximum Twin Sum of a Linked List",
  "Maximum Depth of Binary Tree",
  "Leaf-Similar Trees",
  "Count Good Nodes in Binary Tree",
  "Path Sum III",
  "Longest ZigZag Path in a Binary Tree",
  "Lowest Common Ancestor of a Binary Tree",
  "Binary Tree Right Side View",
  "Maximum Level Sum of a Binary Tree",
  "Search in a Binary Search Tree",
  "Delete Node in a BST",
  "Keys and Rooms",
  "Number of Provinces",
  "Reorder Routes to Make All Paths Lead to the City Zero",
  "Evaluate Division",
  "Nearest Exit from Entrance in Maze",
  "Rotting Oranges",
  "Kth Largest Element in an Array",
  "Smallest Number in Infinite Set",
  "Maximum Subsequence Score",
  "Total Cost to Hire K Workers",
  "Guess Number Higher or Lower",
  "Successful Pairs of Spells and Potions",
  "Find Peak Element",
  "Koko Eating Bananas",
  "Letter Combinations of a Phone Number",
  "Combination Sum III",
  "N-th Tribonacci Number",
  "Min Cost Climbing Stairs",
  "House Robber",
  "Domino and Tromino Tiling",
  "Unique Paths",
  "Longest Common Subsequence",
  "Best Time to Buy and Sell Stock with Transaction Fee",
  "Edit Distance",
  "Counting Bits",
  "Single Number",
  "Minimum Flips to Make a OR b Equal to c",
  "Implement Trie (Prefix Tree)",
  "Search Suggestions System",
  "Non-overlapping Intervals",
  "Minimum Number of Arrows to Burst Balloons",
  "Daily Temperatures",
  "Online Stock Span"
];

const LEETCODE_75_TOPICS = [
  { name: "Array / String", start: 0, end: 8 },
  { name: "Two Pointers", start: 9, end: 12 },
  { name: "Sliding Window", start: 13, end: 16 },
  { name: "Prefix Sum", start: 17, end: 18 },
  { name: "Hash Map / Hash Set", start: 19, end: 22 },
  { name: "Stack", start: 23, end: 25 },
  { name: "Queue", start: 26, end: 27 },
  { name: "Linked List", start: 28, end: 31 },
  { name: "Binary Tree – DFS", start: 32, end: 37 },
  { name: "Binary Tree – BFS", start: 38, end: 39 },
  { name: "Binary Search Tree", start: 40, end: 41 },
  { name: "Graphs – DFS", start: 42, end: 45 },
  { name: "Graphs – BFS", start: 46, end: 47 },
  { name: "Heap / Priority Queue", start: 48, end: 51 },
  { name: "Binary Search", start: 52, end: 55 },
  { name: "Backtracking", start: 56, end: 57 },
  { name: "Dynamic Programming – 1D", start: 58, end: 61 },
  { name: "Dynamic Programming – Multidimensional", start: 62, end: 65 },
  { name: "Bit Manipulation", start: 66, end: 68 },
  { name: "Trie", start: 69, end: 70 },
  { name: "Intervals", start: 71, end: 72 },
  { name: "Monotonic Stack", start: 73, end: 74 }
];

const TOP_150_TITLES = [
  "Merge Sorted Array",
  "Remove Element",
  "Remove Duplicates from Sorted Array",
  "Remove Duplicates from Sorted Array II",
  "Majority Element",
  "Rotate Array",
  "Best Time to Buy and Sell Stock",
  "Best Time to Buy and Sell Stock II",
  "Jump Game",
  "Jump Game II",
  "H-Index",
  "Insert Delete GetRandom O(1)",
  "Product of Array Except Self",
  "Gas Station",
  "Candy",
  "Trapping Rain Water",
  "Roman to Integer",
  "Integer to Roman",
  "Length of Last Word",
  "Longest Common Prefix",
  "Reverse Words in a String",
  "Zigzag Conversion",
  "Find the Index of the First Occurrence in a String",
  "Text Justification",
  "Valid Palindrome",
  "Is Subsequence",
  "Two Sum II - Input Array Is Sorted",
  "Container With Most Water",
  "3Sum",
  "Minimum Size Subarray Sum",
  "Longest Substring Without Repeating Characters",
  "Substring with Concatenation of All Words",
  "Minimum Window Substring",
  "Valid Sudoku",
  "Spiral Matrix",
  "Rotate Image",
  "Set Matrix Zeroes",
  "Game of Life",
  "Ransom Note",
  "Isomorphic Strings",
  "Word Pattern",
  "Valid Anagram",
  "Group Anagrams",
  "Two Sum",
  "Happy Number",
  "Contains Duplicate II",
  "Longest Consecutive Sequence",
  "Summary Ranges",
  "Merge Intervals",
  "Insert Interval",
  "Minimum Number of Arrows to Burst Balloons",
  "Valid Parentheses",
  "Simplify Path",
  "Min Stack",
  "Evaluate Reverse Polish Notation",
  "Basic Calculator",
  "Linked List Cycle",
  "Add Two Numbers",
  "Merge Two Sorted Lists",
  "Copy List with Random Pointer",
  "Reverse Linked List II",
  "Reverse Nodes in k-Group",
  "Remove Nth Node From End of List",
  "Remove Duplicates from Sorted List II",
  "Rotate List",
  "Partition List",
  "LRU Cache",
  "Maximum Depth of Binary Tree",
  "Same Tree",
  "Invert Binary Tree",
  "Symmetric Tree",
  "Construct Binary Tree from Preorder and Inorder Traversal",
  "Construct Binary Tree from Inorder and Postorder Traversal",
  "Populating Next Right Pointers in Each Node II",
  "Flatten Binary Tree to Linked List",
  "Path Sum",
  "Sum Root to Leaf Numbers",
  "Binary Tree Maximum Path Sum",
  "Binary Search Tree Iterator",
  "Count Complete Tree Nodes",
  "Lowest Common Ancestor of a Binary Tree",
  "Binary Tree Right Side View",
  "Average of Levels in Binary Tree",
  "Binary Tree Level Order Traversal",
  "Binary Tree Zigzag Level Order Traversal",
  "Minimum Absolute Difference in BST",
  "Kth Smallest Element in a BST",
  "Validate Binary Search Tree",
  "Number of Islands",
  "Surrounded Regions",
  "Clone Graph",
  "Evaluate Division",
  "Course Schedule",
  "Course Schedule II",
  "Snakes and Ladders",
  "Minimum Genetic Mutation",
  "Word Ladder",
  "Implement Trie (Prefix Tree)",
  "Design Add and Search Words Data Structure",
  "Word Search II",
  "Letter Combinations of a Phone Number",
  "Combinations",
  "Permutations",
  "Combination Sum",
  "N-Queens II",
  "Generate Parentheses",
  "Word Search",
  "Convert Sorted Array to Binary Search Tree",
  "Sort List",
  "Construct Quad Tree",
  "Merge k Sorted Lists",
  "Maximum Subarray",
  "Maximum Sum Circular Subarray",
  "Search Insert Position",
  "Search a 2D Matrix",
  "Find Peak Element",
  "Search in Rotated Sorted Array",
  "Find First and Last Position of Element in Sorted Array",
  "Find Minimum in Rotated Sorted Array",
  "Median of Two Sorted Arrays",
  "Kth Largest Element in an Array",
  "IPO",
  "Find K Pairs with Smallest Sums",
  "Find Median from Data Stream",
  "Add Binary",
  "Reverse Bits",
  "Number of 1 Bits",
  "Single Number",
  "Single Number II",
  "Bitwise AND of Numbers Range",
  "Palindrome Number",
  "Plus One",
  "Factorial Trailing Zeroes",
  "Sqrt(x)",
  "Pow(x, n)",
  "Max Points on a Line",
  "Climbing Stairs",
  "House Robber",
  "Word Break",
  "Coin Change",
  "Longest Increasing Subsequence",
  "Triangle",
  "Minimum Path Sum",
  "Unique Paths II",
  "Longest Palindromic Substring",
  "Interleaving String",
  "Edit Distance",
  "Best Time to Buy and Sell Stock III",
  "Best Time to Buy and Sell Stock IV",
  "Maximal Square"
];

const TOP_150_TOPICS = [
  { name: "Array / String", start: 0, end: 23 },
  { name: "Two Pointers", start: 24, end: 28 },
  { name: "Sliding Window", start: 29, end: 32 },
  { name: "Matrix", start: 33, end: 37 },
  { name: "Hashmap", start: 38, end: 46 },
  { name: "Intervals", start: 47, end: 50 },
  { name: "Stack", start: 51, end: 55 },
  { name: "Linked List", start: 56, end: 66 },
  { name: "Binary Tree General", start: 67, end: 80 },
  { name: "Binary Tree BFS", start: 81, end: 84 },
  { name: "Binary Search Tree", start: 85, end: 87 },
  { name: "Graph General", start: 88, end: 93 },
  { name: "Graph BFS", start: 94, end: 96 },
  { name: "Trie", start: 97, end: 99 },
  { name: "Backtracking", start: 100, end: 106 },
  { name: "Divide & Conquer", start: 107, end: 110 },
  { name: "Kadane's Algorithm", start: 111, end: 112 },
  { name: "Binary Search", start: 113, end: 119 },
  { name: "Heap", start: 120, end: 123 },
  { name: "Bit Manipulation", start: 124, end: 129 },
  { name: "Math", start: 130, end: 135 },
  { name: "1D DP", start: 136, end: 140 },
  { name: "Multidimensional DP", start: 141, end: 149 }
];

const TOP_150_DIFFICULTIES = [
  "Easy", "Easy", "Easy", "Medium", "Easy", "Medium", "Easy", "Medium", "Medium", "Medium", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Easy", "Medium", "Easy", "Easy", "Medium", "Medium", "Easy", "Hard",
  "Easy", "Easy", "Medium", "Medium", "Medium",
  "Medium", "Medium", "Hard", "Hard",
  "Medium", "Medium", "Medium", "Medium", "Medium",
  "Easy", "Easy", "Easy", "Easy", "Medium", "Easy", "Easy", "Easy", "Medium",
  "Easy", "Medium", "Medium", "Medium",
  "Easy", "Medium", "Medium", "Medium", "Hard",
  "Easy", "Medium", "Easy", "Medium", "Medium", "Hard", "Medium", "Medium", "Medium", "Medium", "Medium",
  "Easy", "Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Easy", "Medium", "Hard", "Medium", "Easy", "Medium",
  "Medium", "Easy", "Medium", "Medium",
  "Easy", "Medium", "Medium",
  "Medium", "Medium", "Medium", "Medium", "Medium", "Medium",
  "Medium", "Medium", "Hard",
  "Medium", "Medium", "Hard",
  "Medium", "Medium", "Medium", "Medium", "Hard", "Medium", "Medium",
  "Easy", "Medium", "Medium", "Hard",
  "Medium", "Medium",
  "Easy", "Medium", "Medium", "Medium", "Medium", "Medium", "Hard",
  "Medium", "Hard", "Medium", "Hard",
  "Easy", "Easy", "Easy", "Easy", "Medium", "Medium",
  "Easy", "Easy", "Medium", "Easy", "Medium", "Hard",
  "Easy", "Medium", "Medium", "Medium", "Medium",
  "Medium", "Medium", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Medium"
];

export function StudyPlanTracker({ plan, problems: initialProblems, initialSolvedCount }: StudyPlanTrackerProps) {
  const [problems, setProblems] = useState(
    initialProblems.map((p) => ({
      ...p,
      solved: p.user_status === "SOLVED"
    }))
  );
  const [solvedCount, setSolvedCount] = useState(initialSolvedCount);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [showTags, setShowTags] = useState(false);

  const isTop150 = plan.slug === "top-150";
  const totalCount = isTop150 ? 150 : 75;
  const percentComplete = Math.round((solvedCount / totalCount) * 100);

  async function handleToggleSolved(problemId: string, slug: string, currentSolved: boolean) {
    // 1. Optimistic Update
    setProblems((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, solved: !currentSolved } : p))
    );
    setSolvedCount((c) => (currentSolved ? c - 1 : c + 1));
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(problemId);
      return next;
    });

    try {
      // 2. Call Server Action
      const targetStatus = currentSolved ? "NOT_STARTED" : "SOLVED";
      await updateProblemProgress(problemId, slug, targetStatus);
    } catch (err) {
      // 3. Rollback on failure
      console.error("Failed to update status:", err);
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, solved: currentSolved } : p))
      );
      setSolvedCount((c) => (currentSolved ? c + 1 : c - 1));
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(problemId);
        return next;
      });
    }
  }

  const getFullList = (): PlannedProblemItem[] => {
    const titles = isTop150 ? TOP_150_TITLES : LEETCODE_75_TITLES;
    const topics = isTop150 ? TOP_150_TOPICS : LEETCODE_75_TOPICS;

    // Create map of existing problems on title
    const existingMap = new Map(problems.map((p) => [p.title.toLowerCase(), p]));

    return titles.map((title, index) => {
      const existing = existingMap.get(title.toLowerCase());
      
      const topicObj = topics.find((t) => index >= t.start && index <= t.end);
      const category = topicObj ? topicObj.name : "Other Problems";

      // Deduce difficulty
      let difficulty: string = "Medium";
      if (isTop150) {
        difficulty = TOP_150_DIFFICULTIES[index] || "Medium";
      } else {
        // Deduce difficulty statically for LeetCode 75 items
        if (
          index <= 4 || 
          index === 9 || 
          index === 10 || 
          index === 13 || 
          index === 17 || 
          index === 18 || 
          index === 19 || 
          index === 20 || 
          index === 26 || 
          index === 30 || 
          index === 32 || 
          index === 33 || 
          index === 40 || 
          index === 52 || 
          index === 58 || 
          index === 59 || 
          index === 66 || 
          index === 67
        ) {
          difficulty = "Easy";
        } else if (index === 65) {
          difficulty = "Hard";
        }
      }

      if (existing) {
        return {
          ...existing,
          difficulty: existing.difficulty || difficulty,
          solved: existing.solved,
          category,
          index,
          problem_tags: existing.problem_tags || []
        };
      }

      // Fallback placeholder item if database doesn't have it (should be populated by seed, but good failsafe)
      const stubSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return {
        id: `stub-${index}`,
        problem_number: String(index + 1),
        title,
        slug: stubSlug,
        difficulty,
        is_premium: false,
        solved: false,
        category,
        index,
        isStub: true,
        problem_tags: []
      };
    });
  };

  const fullList: PlannedProblemItem[] = getFullList();

  // Group by Category
  const grouped: Record<string, typeof fullList> = {};
  const activeTopics = isTop150 ? TOP_150_TOPICS : LEETCODE_75_TOPICS;
  activeTopics.forEach((t) => {
    grouped[t.name] = [];
  });

  fullList.forEach((item) => {
    if (grouped[item.category]) {
      grouped[item.category].push(item);
    }
  });

  const categories = Object.entries(grouped).filter(([_, items]) => items.length > 0);

  return (
    <div className="study-plan-container">
      {/* Target Premium Header Card */}
      <section className="lc75-header-card glass-panel">
        <div className="header-flex">
          {/* Target Bullseye SVG Logo */}
          <div className="header-logo-container">
            <svg viewBox="0 0 120 120" className="plan-header-svg" width="120" height="120">
              <circle cx="60" cy="60" r="50" stroke="var(--accent)" strokeWidth="5" fill="none" opacity="0.12" />
              <circle cx="60" cy="60" r="40" stroke="var(--accent)" strokeWidth="5" fill="none" opacity="0.25" />
              <circle cx="60" cy="60" r="30" stroke="var(--accent)" strokeWidth="5" fill="none" opacity="0.45" />
              <circle cx="60" cy="60" r="20" stroke="var(--accent)" strokeWidth="5" fill="none" opacity="0.7" />
              <circle cx="60" cy="60" r="8" fill="var(--accent)" />
              <circle cx="60" cy="60" r="3" fill="#ffffff" />
              {/* 3D Arrow pointer clicking the center */}
              <path d="M 94,94 L 66,66 L 65,74 L 62,62 L 74,65 L 66,66 Z" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="header-content">
            <div className="plan-header-badge-row">
              <span className="badge-subtitle">🧭 Ace Coding Interview with {plan.limit} Qs</span>
              <a href={`https://leetcode.com/studyplan/${plan.slug}/`} target="_blank" rel="noreferrer" className="learn-more-link">
                Learn More
              </a>
            </div>
            <h1>{plan.title}</h1>
            
            <div className="plan-progress-row">
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${percentComplete}%` }}></div>
              </div>
              <div className="progress-ratio-container">
                <span className="progress-ratio-text">
                  <strong>{solvedCount}</strong> / {totalCount}
                </span>
                <div className="mini-target-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <circle cx="12" cy="12" r="10" stroke="var(--muted)" strokeWidth="1.5" fill="none" />
                    <circle cx="12" cy="12" r="6" stroke="var(--muted)" strokeWidth="1.5" fill="none" />
                    <circle cx="12" cy="12" r="2" fill="var(--accent)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Show tags row */}
        <div className="show-tags-row">
          <label className="show-tags-label">
            <input 
              type="checkbox" 
              checked={showTags} 
              onChange={(e) => setShowTags(e.target.checked)} 
              className="tags-checkbox"
            />
            <span>Show tags</span>
          </label>
        </div>
      </section>

      {/* Syllabus Groups */}
      <section className="study-plan-body">
        {categories.map(([category, items]) => (
          <div key={category} className="study-topic-group">
            <h3 className="topic-group-title">{category}</h3>
            
            <div className="problem-list glass-panel">
              {items.map((problem) => (
                <div 
                  className={`problem-row ${problem.is_premium ? "is-premium-row" : ""} ${problem.solved ? "is-solved-row" : ""}`} 
                  key={problem.id}
                >
                  {/* Solve Tick Checkbox Column */}
                  <div className="tick-col">
                    <button
                      className={`tick-checkbox ${problem.solved ? "checked" : ""}`}
                      disabled={updatingIds.has(problem.id) || ('isStub' in problem && problem.isStub)}
                      onClick={() => handleToggleSolved(problem.id, problem.slug, problem.solved)}
                      title={problem.solved ? "Mark as Unsolved" : "Mark as Solved"}
                    >
                      {updatingIds.has(problem.id) ? (
                        <Loader2 className="tick-spinner" size={11} />
                      ) : problem.solved ? (
                        <Check size={11} className="tick-icon" />
                      ) : null}
                    </button>
                  </div>
                  
                  {/* Title and Tags */}
                  <div className="title-col">
                    <Link className="problem-title-link" href={`/problems/${problem.slug}`}>
                      {problem.title}
                    </Link>
                    {showTags && problem.problem_tags && (
                      <div className="row-tags-container">
                        {problem.problem_tags.map(({ tags }: { tags: { name: string; slug: string } }) => (
                          <span key={tags.slug} className="row-tag-bubble">
                            {tags.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Premium status emoji marker */}
                  <div className="premium-emoji-col" title={problem.is_premium ? "LeetCode Premium problem" : undefined}>
                    {problem.is_premium ? "🔒" : ""}
                  </div>

                  {/* Solution Link */}
                  <div className="solution-col">
                    <Link href={`/problems/${problem.slug}#solutions`} className="solution-link-button">
                      <FileText size={13} className="sol-doc-icon" />
                      <span>Solution</span>
                    </Link>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="difficulty-col">
                    <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                      {problem.difficulty.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
