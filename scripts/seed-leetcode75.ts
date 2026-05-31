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

const LEETCODE_75_SYLLABUS = [
  { title: "Merge Strings Alternately", difficulty: "EASY", topic: "Array / String", number: "1768" },
  { title: "Greatest Common Divisor of Strings", difficulty: "EASY", topic: "Array / String", number: "1071" },
  { title: "Kids With the Greatest Number of Candies", difficulty: "EASY", topic: "Array / String", number: "1431" },
  { title: "Can Place Flowers", difficulty: "EASY", topic: "Array / String", number: "605" },
  { title: "Reverse Vowels of a String", difficulty: "EASY", topic: "Array / String", number: "345" },
  { title: "Reverse Words in a String", difficulty: "MEDIUM", topic: "Array / String", number: "151" },
  { title: "Product of Array Except Self", difficulty: "MEDIUM", topic: "Array / String", number: "238" },
  { title: "Increasing Triplet Subsequence", difficulty: "MEDIUM", topic: "Array / String", number: "334" },
  { title: "String Compression", difficulty: "MEDIUM", topic: "Array / String", number: "443" },
  { title: "Move Zeroes", difficulty: "EASY", topic: "Two Pointers", number: "283" },
  { title: "Is Subsequence", difficulty: "EASY", topic: "Two Pointers", number: "392" },
  { title: "Container With Most Water", difficulty: "MEDIUM", topic: "Two Pointers", number: "11" },
  { title: "Max Number of K-Sum Pairs", difficulty: "MEDIUM", topic: "Two Pointers", number: "1679" },
  { title: "Maximum Average Subarray I", difficulty: "EASY", topic: "Sliding Window", number: "643" },
  { title: "Maximum Number of Vowels in a Substring of Given Length", difficulty: "MEDIUM", topic: "Sliding Window", number: "1456" },
  { title: "Max Consecutive Ones III", difficulty: "MEDIUM", topic: "Sliding Window", number: "1004" },
  { title: "Longest Subarray of 1's After Deleting One Element", difficulty: "MEDIUM", topic: "Sliding Window", number: "1493" },
  { title: "Find the Highest Altitude", difficulty: "EASY", topic: "Prefix Sum", number: "1732" },
  { title: "Find Pivot Index", difficulty: "EASY", topic: "Prefix Sum", number: "724" },
  { title: "Find the Difference of Two Arrays", difficulty: "EASY", topic: "Hash Map / Hash Set", number: "2215" },
  { title: "Unique Number of Occurrences", difficulty: "EASY", topic: "Hash Map / Hash Set", number: "1207" },
  { title: "Determine if Two Strings Are Close", difficulty: "MEDIUM", topic: "Hash Map / Hash Set", number: "1657" },
  { title: "Equal Row and Column Pairs", difficulty: "MEDIUM", topic: "Hash Map / Hash Set", number: "2352" },
  { title: "Removing Stars From a String", difficulty: "MEDIUM", topic: "Stack", number: "2390" },
  { title: "Asteroid Collision", difficulty: "MEDIUM", topic: "Stack", number: "735" },
  { title: "Decode String", difficulty: "MEDIUM", topic: "Stack", number: "394" },
  { title: "Number of Recent Calls", difficulty: "EASY", topic: "Queue", number: "933" },
  { title: "Dota2 Senate", difficulty: "MEDIUM", topic: "Queue", number: "649" },
  { title: "Delete the Middle Node of a Linked List", difficulty: "MEDIUM", topic: "Linked List", number: "2095" },
  { title: "Odd Even Linked List", difficulty: "MEDIUM", topic: "Linked List", number: "328" },
  { title: "Reverse Linked List", difficulty: "EASY", topic: "Linked List", number: "206" },
  { title: "Maximum Twin Sum of a Linked List", difficulty: "MEDIUM", topic: "Linked List", number: "2130" },
  { title: "Maximum Depth of Binary Tree", difficulty: "EASY", topic: "Binary Tree – DFS", number: "104" },
  { title: "Leaf-Similar Trees", difficulty: "EASY", topic: "Binary Tree – DFS", number: "872" },
  { title: "Count Good Nodes in Binary Tree", difficulty: "MEDIUM", topic: "Binary Tree – DFS", number: "1448" },
  { title: "Path Sum III", difficulty: "MEDIUM", topic: "Binary Tree – DFS", number: "437" },
  { title: "Longest ZigZag Path in a Binary Tree", difficulty: "MEDIUM", topic: "Binary Tree – DFS", number: "1372" },
  { title: "Lowest Common Ancestor of a Binary Tree", difficulty: "MEDIUM", topic: "Binary Tree – DFS", number: "236" },
  { title: "Binary Tree Right Side View", difficulty: "MEDIUM", topic: "Binary Tree – BFS", number: "199" },
  { title: "Maximum Level Sum of a Binary Tree", difficulty: "MEDIUM", topic: "Binary Tree – BFS", number: "1161" },
  { title: "Search in a Binary Search Tree", difficulty: "EASY", topic: "Binary Search Tree", number: "700" },
  { title: "Delete Node in a BST", difficulty: "MEDIUM", topic: "Binary Search Tree", number: "450" },
  { title: "Keys and Rooms", difficulty: "MEDIUM", topic: "Graphs – DFS", number: "841" },
  { title: "Number of Provinces", difficulty: "MEDIUM", topic: "Graphs – DFS", number: "547" },
  { title: "Reorder Routes to Make All Paths Lead to the City Zero", difficulty: "MEDIUM", topic: "Graphs – DFS", number: "1466" },
  { title: "Evaluate Division", difficulty: "MEDIUM", topic: "Graphs – DFS", number: "399" },
  { title: "Nearest Exit from Entrance in Maze", difficulty: "MEDIUM", topic: "Graphs – BFS", number: "1926" },
  { title: "Rotting Oranges", difficulty: "MEDIUM", topic: "Graphs – BFS", number: "994" },
  { title: "Kth Largest Element in an Array", difficulty: "MEDIUM", topic: "Heap / Priority Queue", number: "215" },
  { title: "Smallest Number in Infinite Set", difficulty: "MEDIUM", topic: "Heap / Priority Queue", number: "2336" },
  { title: "Maximum Subsequence Score", difficulty: "MEDIUM", topic: "Heap / Priority Queue", number: "2542" },
  { title: "Total Cost to Hire K Workers", difficulty: "MEDIUM", topic: "Heap / Priority Queue", number: "2462" },
  { title: "Guess Number Higher or Lower", difficulty: "EASY", topic: "Binary Search", number: "374" },
  { title: "Successful Pairs of Spells and Potions", difficulty: "MEDIUM", topic: "Binary Search", number: "2300" },
  { title: "Find Peak Element", difficulty: "MEDIUM", topic: "Binary Search", number: "162" },
  { title: "Koko Eating Bananas", difficulty: "MEDIUM", topic: "Binary Search", number: "875" },
  { title: "Letter Combinations of a Phone Number", difficulty: "MEDIUM", topic: "Backtracking", number: "17" },
  { title: "Combination Sum III", difficulty: "MEDIUM", topic: "Backtracking", number: "216" },
  { title: "N-th Tribonacci Number", difficulty: "EASY", topic: "Dynamic Programming – 1D", number: "1137" },
  { title: "Min Cost Climbing Stairs", difficulty: "EASY", topic: "Dynamic Programming – 1D", number: "746" },
  { title: "House Robber", difficulty: "MEDIUM", topic: "Dynamic Programming – 1D", number: "198" },
  { title: "Domino and Tromino Tiling", difficulty: "MEDIUM", topic: "Dynamic Programming – 1D", number: "790" },
  { title: "Unique Paths", difficulty: "MEDIUM", topic: "Dynamic Programming – Multidimensional", number: "62" },
  { title: "Longest Common Subsequence", difficulty: "MEDIUM", topic: "Dynamic Programming – Multidimensional", number: "1143" },
  { title: "Best Time to Buy and Sell Stock with Transaction Fee", difficulty: "MEDIUM", topic: "Dynamic Programming – Multidimensional", number: "714" },
  { title: "Edit Distance", difficulty: "HARD", topic: "Dynamic Programming – Multidimensional", number: "72" },
  { title: "Counting Bits", difficulty: "EASY", topic: "Bit Manipulation", number: "338" },
  { title: "Single Number", difficulty: "EASY", topic: "Bit Manipulation", number: "136" },
  { title: "Minimum Flips to Make a OR b Equal to c", difficulty: "MEDIUM", topic: "Bit Manipulation", number: "1318" },
  { title: "Implement Trie (Prefix Tree)", difficulty: "MEDIUM", topic: "Trie", number: "208" },
  { title: "Search Suggestions System", difficulty: "MEDIUM", topic: "Trie", number: "1268" },
  { title: "Non-overlapping Intervals", difficulty: "MEDIUM", topic: "Intervals", number: "435" },
  { title: "Minimum Number of Arrows to Burst Balloons", difficulty: "MEDIUM", topic: "Intervals", number: "452" },
  { title: "Daily Temperatures", difficulty: "MEDIUM", topic: "Monotonic Stack", number: "739" },
  { title: "Online Stock Span", difficulty: "MEDIUM", topic: "Monotonic Stack", number: "901" }
];

async function main() {
  console.log("Seeding LeetCode 75 stub problems into Supabase database...");

  for (const item of LEETCODE_75_SYLLABUS) {
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
