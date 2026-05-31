# SweetCode

SweetCode is a learning-only coding problem platform. It focuses on browsing problems,
reading editorials, comparing multilingual solutions, and tracking learning progress.
It does not execute code or judge submissions.

## MVP Stack

- Next.js app router
- React
- Supabase Auth and Postgres
- Redis-ready architecture for later catalog/detail caching

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Run the SQL in `supabase/migrations/001_initial_schema.sql` against your Supabase project,
then import a dataset shaped like the sample problem JSON:

```bash
npm run import:problems -- /Users/cexcbe/Downloads/leetcode_full.json --dry-run
npm run import:problems -- ./data/problems.json
```

The importer accepts either one problem object or an array of problem objects.
For the full LeetCode dataset, the importer treats `remark: "🔒"` as a premium marker
and skips malformed snippet language keys.
