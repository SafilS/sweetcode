# Supabase Setup

1. Create a Supabase project.
2. Enable Google provider in Supabase Auth.
3. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor or through the Supabase CLI.
4. Copy credentials into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is only used by the local importer script. Never expose it to the browser.
