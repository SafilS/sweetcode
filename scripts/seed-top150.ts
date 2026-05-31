import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TOP_150_SYLLABUS = [
  { title: "Merge Sorted Array", difficulty: "EASY", topic: "Array / String", number: "88" },
  { title: "Remove Element", difficulty: "EASY", topic: "Array / String", number: "27" },
  { title: "Remove Duplicates from Sorted Array", difficulty: "EASY", topic: "Array / String", number: "26" },
  { title: "Remove Duplicates from Sorted Array II", difficulty: "MEDIUM", topic: "Array / String", number: "80" },
  { title: "Majority Element", difficulty: "EASY", topic: "Array / String", number: "169" },
  { title: "Rotate Array", difficulty: "MEDIUM", topic: "Array / String", number: "189" },
  { title: "Best Time to Buy and Sell Stock", difficulty: "EASY", topic: "Array / String", number: "121" },
  { title: "Best Time to Buy and Sell Stock II", difficulty: "MEDIUM", topic: "Array / String", number: "122" },
  { title: "Jump Game", difficulty: "MEDIUM", topic: "Array / String", number: "55" },
  { title: "Jump Game II", difficulty: "MEDIUM", topic: "Array / String", number: "45" },
  { title: "H-Index", difficulty: "MEDIUM", topic: "Array / String", number: "274" },
  { title: "Insert Delete GetRandom O(1)", difficulty: "MEDIUM", topic: "Array / String", number: "380" },
  { title: "Product of Array Except Self", difficulty: "MEDIUM", topic: "Array / String", number: "238" },
  { title: "Gas Station", difficulty: "MEDIUM", topic: "Array / String", number: "134" },
  { title: "Candy", difficulty: "HARD", topic: "Array / String", number: "135" },
  { title: "Trapping Rain Water", difficulty: "HARD", topic: "Array / String", number: "42" },
  { title: "Roman to Integer", difficulty: "EASY", topic: "Array / String", number: "13" },
  { title: "Integer to Roman", difficulty: "MEDIUM", topic: "Array / String", number: "12" },
  { title: "Length of Last Word", difficulty: "EASY", topic: "Array / String", number: "58" },
  { title: "Longest Common Prefix", difficulty: "EASY", topic: "Array / String", number: "14" },
  { title: "Reverse Words in a String", difficulty: "MEDIUM", topic: "Array / String", number: "151" },
  { title: "Zigzag Conversion", difficulty: "MEDIUM", topic: "Array / String", number: "6" },
  { title: "Find the Index of the First Occurrence in a String", difficulty: "EASY", topic: "Array / String", number: "28" },
  { title: "Text Justification", difficulty: "HARD", topic: "Array / String", number: "68" },
  { title: "Valid Palindrome", difficulty: "EASY", topic: "Two Pointers", number: "125" },
  { title: "Is Subsequence", difficulty: "EASY", topic: "Two Pointers", number: "392" },
  { title: "Two Sum II - Input Array Is Sorted", difficulty: "MEDIUM", topic: "Two Pointers", number: "167" },
  { title: "Container With Most Water", difficulty: "MEDIUM", topic: "Two Pointers", number: "11" },
  { title: "3Sum", difficulty: "MEDIUM", topic: "Two Pointers", number: "15" },
  { title: "Minimum Size Subarray Sum", difficulty: "MEDIUM", topic: "Sliding Window", number: "209" },
  { title: "Longest Substring Without Repeating Characters", difficulty: "MEDIUM", topic: "Sliding Window", number: "3" },
  { title: "Substring with Concatenation of All Words", difficulty: "HARD", topic: "Sliding Window", number: "30" },
  { title: "Minimum Window Substring", difficulty: "HARD", topic: "Sliding Window", number: "76" },
  { title: "Valid Sudoku", difficulty: "MEDIUM", topic: "Matrix", number: "36" },
  { title: "Spiral Matrix", difficulty: "MEDIUM", topic: "Matrix", number: "54" },
  { title: "Rotate Image", difficulty: "MEDIUM", topic: "Matrix", number: "48" },
  { title: "Set Matrix Zeroes", difficulty: "MEDIUM", topic: "Matrix", number: "73" },
  { title: "Game of Life", difficulty: "MEDIUM", topic: "Matrix", number: "289" },
  { title: "Ransom Note", difficulty: "EASY", topic: "Hashmap", number: "383" },
  { title: "Isomorphic Strings", difficulty: "EASY", topic: "Hashmap", number: "205" },
  { title: "Word Pattern", difficulty: "EASY", topic: "Hashmap", number: "290" },
  { title: "Valid Anagram", difficulty: "EASY", topic: "Hashmap", number: "242" },
  { title: "Group Anagrams", difficulty: "MEDIUM", topic: "Hashmap", number: "49" },
  { title: "Two Sum", difficulty: "EASY", topic: "Hashmap", number: "1" },
  { title: "Happy Number", difficulty: "EASY", topic: "Hashmap", number: "202" },
  { title: "Contains Duplicate II", difficulty: "EASY", topic: "Hashmap", number: "219" },
  { title: "Longest Consecutive Sequence", difficulty: "MEDIUM", topic: "Hashmap", number: "128" },
  { title: "Summary Ranges", difficulty: "EASY", topic: "Intervals", number: "228" },
  { title: "Merge Intervals", difficulty: "MEDIUM", topic: "Intervals", number: "56" },
  { title: "Insert Interval", difficulty: "MEDIUM", topic: "Intervals", number: "57" },
  { title: "Minimum Number of Arrows to Burst Balloons", difficulty: "MEDIUM", topic: "Intervals", number: "452" },
  { title: "Valid Parentheses", difficulty: "EASY", topic: "Stack", number: "20" },
  { title: "Simplify Path", difficulty: "MEDIUM", topic: "Stack", number: "71" },
  { title: "Min Stack", difficulty: "MEDIUM", topic: "Stack", number: "155" },
  { title: "Evaluate Reverse Polish Notation", difficulty: "MEDIUM", topic: "Stack", number: "150" },
  { title: "Basic Calculator", difficulty: "HARD", topic: "Stack", number: "224" },
  { title: "Linked List Cycle", difficulty: "EASY", topic: "Linked List", number: "141" },
  { title: "Add Two Numbers", difficulty: "MEDIUM", topic: "Linked List", number: "2" },
  { title: "Merge Two Sorted Lists", difficulty: "EASY", topic: "Linked List", number: "21" },
  { title: "Copy List with Random Pointer", difficulty: "MEDIUM", topic: "Linked List", number: "138" },
  { title: "Reverse Linked List II", difficulty: "MEDIUM", topic: "Linked List", number: "92" },
  { title: "Reverse Nodes in k-Group", difficulty: "HARD", topic: "Linked List", number: "25" },
  { title: "Remove Nth Node From End of List", difficulty: "MEDIUM", topic: "Linked List", number: "19" },
  { title: "Remove Duplicates from Sorted List II", difficulty: "MEDIUM", topic: "Linked List", number: "82" },
  { title: "Rotate List", difficulty: "MEDIUM", topic: "Linked List", number: "61" },
  { title: "Partition List", difficulty: "MEDIUM", topic: "Linked List", number: "86" },
  { title: "LRU Cache", difficulty: "MEDIUM", topic: "Linked List", number: "146" },
  { title: "Maximum Depth of Binary Tree", difficulty: "EASY", topic: "Binary Tree General", number: "104" },
  { title: "Same Tree", difficulty: "EASY", topic: "Binary Tree General", number: "100" },
  { title: "Invert Binary Tree", difficulty: "EASY", topic: "Binary Tree General", number: "226" },
  { title: "Symmetric Tree", difficulty: "EASY", topic: "Binary Tree General", number: "101" },
  { title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "MEDIUM", topic: "Binary Tree General", number: "105" },
  { title: "Construct Binary Tree from Inorder and Postorder Traversal", difficulty: "MEDIUM", topic: "Binary Tree General", number: "106" },
  { title: "Populating Next Right Pointers in Each Node II", difficulty: "MEDIUM", topic: "Binary Tree General", number: "117" },
  { title: "Flatten Binary Tree to Linked List", difficulty: "MEDIUM", topic: "Binary Tree General", number: "114" },
  { title: "Path Sum", difficulty: "EASY", topic: "Binary Tree General", number: "112" },
  { title: "Sum Root to Leaf Numbers", difficulty: "MEDIUM", topic: "Binary Tree General", number: "129" },
  { title: "Binary Tree Maximum Path Sum", difficulty: "HARD", topic: "Binary Tree General", number: "124" },
  { title: "Binary Search Tree Iterator", difficulty: "MEDIUM", topic: "Binary Tree General", number: "173" },
  { title: "Count Complete Tree Nodes", difficulty: "EASY", topic: "Binary Tree General", number: "222" },
  { title: "Lowest Common Ancestor of a Binary Tree", difficulty: "MEDIUM", topic: "Binary Tree General", number: "236" },
  { title: "Binary Tree Right Side View", difficulty: "MEDIUM", topic: "Binary Tree BFS", number: "199" },
  { title: "Average of Levels in Binary Tree", difficulty: "EASY", topic: "Binary Tree BFS", number: "637" },
  { title: "Binary Tree Level Order Traversal", difficulty: "MEDIUM", topic: "Binary Tree BFS", number: "102" },
  { title: "Binary Tree Zigzag Level Order Traversal", difficulty: "MEDIUM", topic: "Binary Tree BFS", number: "103" },
  { title: "Minimum Absolute Difference in BST", difficulty: "EASY", topic: "Binary Search Tree", number: "530" },
  { title: "Kth Smallest Element in a BST", difficulty: "MEDIUM", topic: "Binary Search Tree", number: "230" },
  { title: "Validate Binary Search Tree", difficulty: "MEDIUM", topic: "Binary Search Tree", number: "98" },
  { title: "Number of Islands", difficulty: "MEDIUM", topic: "Graph General", number: "200" },
  { title: "Surrounded Regions", difficulty: "MEDIUM", topic: "Graph General", number: "130" },
  { title: "Clone Graph", difficulty: "MEDIUM", topic: "Graph General", number: "133" },
  { title: "Evaluate Division", difficulty: "MEDIUM", topic: "Graph General", number: "399" },
  { title: "Course Schedule", difficulty: "MEDIUM", topic: "Graph General", number: "207" },
  { title: "Course Schedule II", difficulty: "MEDIUM", topic: "Graph General", number: "210" },
  { title: "Snakes and Ladders", difficulty: "MEDIUM", topic: "Graph BFS", number: "909" },
  { title: "Minimum Genetic Mutation", difficulty: "MEDIUM", topic: "Graph BFS", number: "433" },
  { title: "Word Ladder", difficulty: "HARD", topic: "Graph BFS", number: "127" },
  { title: "Implement Trie (Prefix Tree)", difficulty: "MEDIUM", topic: "Trie", number: "208" },
  { title: "Design Add and Search Words Data Structure", difficulty: "MEDIUM", topic: "Trie", number: "211" },
  { title: "Word Search II", difficulty: "HARD", topic: "Trie", number: "212" },
  { title: "Letter Combinations of a Phone Number", difficulty: "MEDIUM", topic: "Backtracking", number: "17" },
  { title: "Combinations", difficulty: "MEDIUM", topic: "Backtracking", number: "77" },
  { title: "Permutations", difficulty: "MEDIUM", topic: "Backtracking", number: "46" },
  { title: "Combination Sum", difficulty: "MEDIUM", topic: "Backtracking", number: "39" },
  { title: "N-Queens II", difficulty: "HARD", topic: "Backtracking", number: "52" },
  { title: "Generate Parentheses", difficulty: "MEDIUM", topic: "Backtracking", number: "22" },
  { title: "Word Search", difficulty: "MEDIUM", topic: "Backtracking", number: "79" },
  { title: "Convert Sorted Array to Binary Search Tree", difficulty: "EASY", topic: "Divide & Conquer", number: "108" },
  { title: "Sort List", difficulty: "MEDIUM", topic: "Divide & Conquer", number: "148" },
  { title: "Construct Quad Tree", difficulty: "MEDIUM", topic: "Divide & Conquer", number: "427" },
  { title: "Merge k Sorted Lists", difficulty: "HARD", topic: "Divide & Conquer", number: "23" },
  { title: "Maximum Subarray", difficulty: "MEDIUM", topic: "Kadane's Algorithm", number: "53" },
  { title: "Maximum Sum Circular Subarray", difficulty: "MEDIUM", topic: "Kadane's Algorithm", number: "918" },
  { title: "Search Insert Position", difficulty: "EASY", topic: "Binary Search", number: "35" },
  { title: "Search a 2D Matrix", difficulty: "MEDIUM", topic: "Binary Search", number: "74" },
  { title: "Find Peak Element", difficulty: "MEDIUM", topic: "Binary Search", number: "162" },
  { title: "Search in Rotated Sorted Array", difficulty: "MEDIUM", topic: "Binary Search", number: "33" },
  { title: "Find First and Last Position of Element in Sorted Array", difficulty: "MEDIUM", topic: "Binary Search", number: "34" },
  { title: "Find Minimum in Rotated Sorted Array", difficulty: "MEDIUM", topic: "Binary Search", number: "153" },
  { title: "Median of Two Sorted Arrays", difficulty: "HARD", topic: "Binary Search", number: "4" },
  { title: "Kth Largest Element in an Array", difficulty: "MEDIUM", topic: "Heap", number: "215" },
  { title: "IPO", difficulty: "HARD", topic: "Heap", number: "502" },
  { title: "Find K Pairs with Smallest Sums", difficulty: "MEDIUM", topic: "Heap", number: "373" },
  { title: "Find Median from Data Stream", difficulty: "HARD", topic: "Heap", number: "295" },
  { title: "Add Binary", difficulty: "EASY", topic: "Bit Manipulation", number: "67" },
  { title: "Reverse Bits", difficulty: "EASY", topic: "Bit Manipulation", number: "190" },
  { title: "Number of 1 Bits", difficulty: "EASY", topic: "Bit Manipulation", number: "191" },
  { title: "Single Number", difficulty: "EASY", topic: "Bit Manipulation", number: "136" },
  { title: "Single Number II", difficulty: "MEDIUM", topic: "Bit Manipulation", number: "137" },
  { title: "Bitwise AND of Numbers Range", difficulty: "MEDIUM", topic: "Bit Manipulation", number: "201" },
  { title: "Palindrome Number", difficulty: "EASY", topic: "Math", number: "9" },
  { title: "Plus One", difficulty: "EASY", topic: "Math", number: "66" },
  { title: "Factorial Trailing Zeroes", difficulty: "MEDIUM", topic: "Math", number: "172" },
  { title: "Sqrt(x)", difficulty: "EASY", topic: "Math", number: "69" },
  { title: "Pow(x, n)", difficulty: "MEDIUM", topic: "Math", number: "50" },
  { title: "Max Points on a Line", difficulty: "HARD", topic: "Math", number: "149" },
  { title: "Climbing Stairs", difficulty: "EASY", topic: "1D DP", number: "70" },
  { title: "House Robber", difficulty: "MEDIUM", topic: "1D DP", number: "198" },
  { title: "Word Break", difficulty: "MEDIUM", topic: "1D DP", number: "139" },
  { title: "Coin Change", difficulty: "MEDIUM", topic: "1D DP", number: "322" },
  { title: "Longest Increasing Subsequence", difficulty: "MEDIUM", topic: "1D DP", number: "300" },
  { title: "Triangle", difficulty: "MEDIUM", topic: "Multidimensional DP", number: "120" },
  { title: "Minimum Path Sum", difficulty: "MEDIUM", topic: "Multidimensional DP", number: "64" },
  { title: "Unique Paths II", difficulty: "MEDIUM", topic: "Multidimensional DP", number: "63" },
  { title: "Longest Palindromic Substring", difficulty: "MEDIUM", topic: "Multidimensional DP", number: "5" },
  { title: "Interleaving String", difficulty: "MEDIUM", topic: "Multidimensional DP", number: "97" },
  { title: "Edit Distance", difficulty: "MEDIUM", topic: "Multidimensional DP", number: "72" },
  { title: "Best Time to Buy and Sell Stock III", difficulty: "HARD", topic: "Multidimensional DP", number: "123" },
  { title: "Best Time to Buy and Sell Stock IV", difficulty: "HARD", topic: "Multidimensional DP", number: "188" },
  { title: "Maximal Square", difficulty: "MEDIUM", topic: "Multidimensional DP", number: "221" }
];

async function main() {
  console.log("Seeding Top Interview 150 stub problems into Supabase database...");

  for (const item of TOP_150_SYLLABUS) {
    const slug = slugify(item.title);
    
    // Check if problem already exists
    const { data: existing, error: fetchErr } = await supabase
      .from("problems")
      .select("id")
      .eq("title", item.title)
      .maybeSingle();

    if (fetchErr) {
      console.error(`Error querying problem "${item.title}":`, fetchErr);
      continue;
    }

    if (!existing) {
      console.log(`Inserting stub for "${item.title}" (#${item.number})...`);
      
      const { data: inserted, error: insertErr } = await supabase
        .from("problems")
        .insert({
          problem_number: item.number,
          title: item.title,
          slug: slug,
          difficulty: item.difficulty,
          is_premium: false
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error(`Failed to insert "${item.title}":`, insertErr);
        continue;
      }

      if (inserted) {
        // Insert empty description/details
        const { error: textErr } = await supabase
          .from("problem_texts")
          .insert({
            problem_id: inserted.id,
            description: `This is a placeholder description for **${item.title}**. Full content and editorials will be loaded soon.`,
            examples: [],
            constraints: []
          });

        if (textErr) {
          console.error(`Failed to insert problem text for "${item.title}":`, textErr);
        }

        // Upsert Tag
        const tagSlug = slugify(item.topic.split(" ")[0]); // simple slug (e.g. array, graph, two, etc.)
        const { data: tag, error: tagErr } = await supabase
          .from("tags")
          .select("id")
          .eq("slug", tagSlug)
          .maybeSingle();

        let tagId = tag?.id;
        if (!tagId) {
          const { data: newTag, error: newTagErr } = await supabase
            .from("tags")
            .insert({ name: item.topic, slug: tagSlug })
            .select("id")
            .single();
          if (newTag) tagId = newTag.id;
        }

        if (tagId) {
          await supabase.from("problem_tags").insert({
            problem_id: inserted.id,
            tag_id: tagId
          });
        }
      }
    } else {
      console.log(`Problem "${item.title}" already exists. Skipping.`);
    }
  }

  console.log("Seeding complete!");
}

main();
