import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

async function loadLocalEnv() {
  try {
    const envFile = await readFile(".env.local", "utf8");
    for (const line of envFile.split(/\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      process.env[key] ??= value;
    }
  } catch {
    // Environment variables may already be provided by the shell or deployment.
  }
}

type CsvEditorialScreenshot = {
  problemNumber: string;
  problemTitle: string;
  screenshotFilename: string;
  folder: string;
  sourceUrl: string;
  imageUrl: string;
};

type ProblemRow = {
  id: string;
  problem_number: string;
  title: string;
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const file = args.find((arg) => !arg.startsWith("--"));

if (!file) {
  throw new Error("Usage: npm run import:editorials -- ./path/to/leetcode_editorial_screenshots.csv [--dry-run]");
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function normalizeProblemNumber(value: string) {
  return String(Number(value.trim()));
}

function paddedProblemNumber(value: string) {
  return normalizeProblemNumber(value).padStart(3, "0");
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildFallbackFilename(problemNumber: string, problemTitle: string) {
  return `${paddedProblemNumber(problemNumber)}. ${problemTitle.trim()}.png`;
}

function normalizeFilename(problemNumber: string, problemTitle: string, filename: string) {
  const trimmed = filename.trim();
  if (trimmed.toLowerCase().endsWith(".png")) return trimmed;
  return buildFallbackFilename(problemNumber, problemTitle);
}

function toRawGithubUrl(row: {
  problemNumber: string;
  problemTitle: string;
  screenshotFilename: string;
  folder: string;
}) {
  const filename = normalizeFilename(row.problemNumber, row.problemTitle, row.screenshotFilename);
  return `https://raw.githubusercontent.com/akhilkammila/leetcode-screenshotter/main/editorial-screenshots/${encodePathSegment(row.folder.trim())}/${encodePathSegment(filename)}`;
}

function parseEditorialCsv(content: string): CsvEditorialScreenshot[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const rows: CsvEditorialScreenshot[] = [];

  for (const [index, line] of lines.entries()) {
    if (index === 0 && line.startsWith("problem_number,")) continue;

    const parts = line.split(",");
    if (parts.length < 5) {
      console.warn(`Skipped malformed CSV line ${index + 1}: expected at least 5 columns.`);
      continue;
    }

    const problemNumber = parts[0]?.trim();
    const sourceUrl = parts.at(-1)?.trim();
    const folder = parts.at(-2)?.trim();
    const problemTitle = parts[1]?.trim();
    const screenshotFilename = parts.slice(2, -2).join(",").trim();

    if (!problemNumber || !problemTitle || !folder || !sourceUrl) {
      console.warn(`Skipped malformed CSV line ${index + 1}: missing required values.`);
      continue;
    }

    rows.push({
      problemNumber,
      problemTitle,
      screenshotFilename,
      folder,
      sourceUrl,
      imageUrl: toRawGithubUrl({ problemNumber, problemTitle, screenshotFilename, folder })
    });
  }

  return rows;
}

async function main() {
  await loadLocalEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dryRun && (!url || !serviceRoleKey)) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const rows = parseEditorialCsv(await readFile(file!, "utf8"));
  const duplicateNumbers = rows.length - new Set(rows.map((row) => normalizeProblemNumber(row.problemNumber))).size;

  if (!url || !serviceRoleKey) {
    console.log(JSON.stringify({ rows: rows.length, duplicateNumbers }, null, 2));
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const { data: problems, error: problemsError } = await supabase
    .from("problems")
    .select("id, problem_number, title");

  if (problemsError) throw problemsError;

  const problemByNumber = new Map<string, ProblemRow>();
  for (const problem of (problems ?? []) as ProblemRow[]) {
    problemByNumber.set(normalizeProblemNumber(problem.problem_number), problem);
  }

  const importRows = [];
  const missing = [];

  for (const [index, row] of rows.entries()) {
    const problem = problemByNumber.get(normalizeProblemNumber(row.problemNumber));
    if (!problem) {
      missing.push(row);
      continue;
    }

    importRows.push({
      problem_id: problem.id,
      image_url: row.imageUrl,
      source_url: row.sourceUrl,
      caption: `LeetCode editorial screenshot for ${problem.title}`,
      sort_order: index
    });
  }

  if (dryRun) {
    console.log(JSON.stringify({
      csvRows: rows.length,
      matchedProblems: importRows.length,
      missingProblems: missing.length,
      duplicateNumbers,
      sample: rows.slice(0, 3)
    }, null, 2));
    return;
  }

  for (const [chunkIndex, chunk] of chunkArray(importRows, 500).entries()) {
    const { error } = await supabase
      .from("editorial_screenshots")
      .upsert(chunk, { onConflict: "problem_id,image_url" });
    if (error) throw error;
    console.log(`Upserted editorial screenshot chunk ${chunkIndex + 1}/${Math.ceil(importRows.length / 500)}`);
  }

  console.log(`Imported ${importRows.length} editorial screenshots. Missing matches: ${missing.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
