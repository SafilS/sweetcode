import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

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

type RawSolution = {
  approach: string;
  explanation?: string;
  time_complexity?: string;
  space_complexity?: string;
  code?: Record<string, string>;
};

type RawProblem = {
  number: string;
  title: string;
  difficulty: string;
  tags?: string[];
  companies?: string[];
  is_premium?: boolean;
  premium?: boolean;
  remark?: string;
  link?: string;
  description: string;
  examples?: string[];
  constraints?: string[];
  solutions?: RawSolution[];
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const file = args.find((arg) => !arg.startsWith("--"));

if (!file) {
  throw new Error("Usage: npm run import:problems -- ./path/to/problems.json [--dry-run]");
}

const inputFile = file;
let supabase: SupabaseClient | null = null;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDifficulty(value: string) {
  const normalized = value.toUpperCase();
  if (!["EASY", "MEDIUM", "HARD"].includes(normalized)) {
    throw new Error(`Unknown difficulty: ${value}`);
  }
  return normalized;
}

function isPremiumProblem(raw: RawProblem) {
  return Boolean(raw.is_premium ?? raw.premium ?? raw.remark?.includes("🔒"));
}

function normalizeLanguage(language: string) {
  if (language === "Typescript") return "TypeScript";
  return language;
}

function isValidLanguage(language: string) {
  return language.length <= 32 && !language.includes("\n") && !language.includes("<");
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  return supabase;
}

async function bulkImportProblems(problems: RawProblem[]) {
  const client = requireSupabase();
  const idByNumber = new Map<string, string>();

  for (const [chunkIndex, chunk] of chunkArray(problems, 500).entries()) {
    const { data, error } = await client
      .from("problems")
      .upsert(
        chunk.map((raw) => ({
          problem_number: raw.number,
          title: raw.title,
          slug: slugify(raw.title),
          difficulty: normalizeDifficulty(raw.difficulty),
          is_premium: isPremiumProblem(raw),
          remark: raw.remark ?? null,
          source_link: raw.link ?? null
        })),
        { onConflict: "problem_number" }
      )
      .select("id, problem_number");

    if (error) throw error;
    for (const row of data ?? []) idByNumber.set(row.problem_number as string, row.id as string);
    console.log(`Upserted problem metadata chunk ${chunkIndex + 1}/${Math.ceil(problems.length / 500)}`);
  }

  const problemTexts = problems.map((raw) => ({
    problem_id: idByNumber.get(raw.number),
    description: raw.description,
    examples: raw.examples ?? [],
    constraints: raw.constraints ?? []
  }));

  for (const [chunkIndex, chunk] of chunkArray(problemTexts, 100).entries()) {
    const { error } = await client.from("problem_texts").upsert(chunk, { onConflict: "problem_id" });
    if (error) throw error;
    console.log(`Upserted problem text chunk ${chunkIndex + 1}/${Math.ceil(problemTexts.length / 100)}`);
  }

  const tagNames = Array.from(new Set(problems.flatMap((problem) => problem.tags ?? [])));
  const companyNames = Array.from(new Set(problems.flatMap((problem) => problem.companies ?? [])));
  const tagIdBySlug = new Map<string, string>();
  const companyIdBySlug = new Map<string, string>();

  for (const chunk of chunkArray(tagNames, 500)) {
    const { data, error } = await client
      .from("tags")
      .upsert(chunk.map((name) => ({ name, slug: slugify(name) })), { onConflict: "slug" })
      .select("id, slug");
    if (error) throw error;
    for (const row of data ?? []) tagIdBySlug.set(row.slug as string, row.id as string);
  }

  for (const chunk of chunkArray(companyNames, 500)) {
    const { data, error } = await client
      .from("companies")
      .upsert(chunk.map((name) => ({ name, slug: slugify(name) })), { onConflict: "slug" })
      .select("id, slug");
    if (error) throw error;
    for (const row of data ?? []) companyIdBySlug.set(row.slug as string, row.id as string);
  }

  const problemTagRows = problems.flatMap((problem) => {
    const problemId = idByNumber.get(problem.number);
    return (problem.tags ?? []).map((tag) => ({
      problem_id: problemId,
      tag_id: tagIdBySlug.get(slugify(tag))
    }));
  });

  for (const [chunkIndex, chunk] of chunkArray(problemTagRows, 1000).entries()) {
    const { error } = await client.from("problem_tags").upsert(chunk, { onConflict: "problem_id,tag_id" });
    if (error) throw error;
    console.log(`Upserted tag links chunk ${chunkIndex + 1}/${Math.ceil(problemTagRows.length / 1000)}`);
  }

  const problemCompanyRows = problems.flatMap((problem) => {
    const problemId = idByNumber.get(problem.number);
    return (problem.companies ?? []).map((company) => ({
      problem_id: problemId,
      company_id: companyIdBySlug.get(slugify(company))
    }));
  });

  for (const [chunkIndex, chunk] of chunkArray(problemCompanyRows, 1000).entries()) {
    const { error } = await client.from("problem_companies").upsert(chunk, { onConflict: "problem_id,company_id" });
    if (error) throw error;
    console.log(`Upserted company links chunk ${chunkIndex + 1}/${Math.ceil(problemCompanyRows.length / 1000)}`);
  }

  const problemIds = Array.from(idByNumber.values());
  for (const [chunkIndex, chunk] of chunkArray(problemIds, 500).entries()) {
    const { error } = await client.from("solution_approaches").delete().in("problem_id", chunk);
    if (error) throw error;
    console.log(`Cleared old solution chunk ${chunkIndex + 1}/${Math.ceil(problemIds.length / 500)}`);
  }

  const approachRows = problems.flatMap((problem) => {
    const problemId = idByNumber.get(problem.number);
    return (problem.solutions ?? []).map((solution, index) => ({
      problem_id: problemId,
      title: solution.approach,
      explanation: solution.explanation ?? null,
      time_complexity: solution.time_complexity ?? null,
      space_complexity: solution.space_complexity ?? null,
      sort_order: index
    }));
  });

  const approachIdByKey = new Map<string, string>();
  for (const [chunkIndex, chunk] of chunkArray(approachRows, 500).entries()) {
    const { data, error } = await client
      .from("solution_approaches")
      .insert(chunk)
      .select("id, problem_id, sort_order, title");
    if (error) throw error;
    for (const row of data ?? []) {
      approachIdByKey.set(`${row.problem_id}:${row.sort_order}:${row.title}`, row.id as string);
    }
    console.log(`Inserted approach chunk ${chunkIndex + 1}/${Math.ceil(approachRows.length / 500)}`);
  }

  const snippets = [];
  for (const problem of problems) {
    const problemId = idByNumber.get(problem.number);
    for (const [index, solution] of (problem.solutions ?? []).entries()) {
      const approachId = approachIdByKey.get(`${problemId}:${index}:${solution.approach}`);
      const seenLanguages = new Set<string>();
      for (const [languageKey, code] of Object.entries(solution.code ?? {})) {
        const language = normalizeLanguage(languageKey);
        if (!isValidLanguage(language)) {
          console.warn(`Skipped suspicious language key for ${problem.number} ${problem.title}: ${JSON.stringify(language.slice(0, 80))}`);
          continue;
        }
        if (seenLanguages.has(language)) continue;
        seenLanguages.add(language);
        snippets.push({ approach_id: approachId, language, code });
      }
    }
  }

  for (const [chunkIndex, chunk] of chunkArray(snippets, 250).entries()) {
    const { error } = await client.from("code_snippets").insert(chunk);
    if (error) throw error;
    console.log(`Inserted snippet chunk ${chunkIndex + 1}/${Math.ceil(snippets.length / 250)}`);
  }
}

async function main() {
  await loadLocalEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dryRun && (!url || !serviceRoleKey)) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  supabase = url && serviceRoleKey ? createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  }) : null;

  const payload = JSON.parse(await readFile(inputFile, "utf8"));
  const problems: RawProblem[] = Array.isArray(payload) ? payload : [payload];

  if (dryRun) {
    const stats = {
      total: problems.length,
      premium: 0,
      missingDescription: 0,
      noTags: 0,
      noSolutions: 0,
      skippedLanguageKeys: 0,
      difficulties: {} as Record<string, number>,
      languages: {} as Record<string, number>
    };

    for (const problem of problems) {
      if (isPremiumProblem(problem)) stats.premium += 1;
      if (!problem.description) stats.missingDescription += 1;
      if (!problem.tags?.length) stats.noTags += 1;
      if (!problem.solutions?.length) stats.noSolutions += 1;
      stats.difficulties[problem.difficulty] = (stats.difficulties[problem.difficulty] ?? 0) + 1;

      for (const solution of problem.solutions ?? []) {
        for (const language of Object.keys(solution.code ?? {})) {
          const normalized = normalizeLanguage(language);
          if (!isValidLanguage(normalized)) {
            stats.skippedLanguageKeys += 1;
            continue;
          }
          stats.languages[normalized] = (stats.languages[normalized] ?? 0) + 1;
        }
      }
    }

    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  await bulkImportProblems(problems);
  console.log(`Imported ${problems.length} problems.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
