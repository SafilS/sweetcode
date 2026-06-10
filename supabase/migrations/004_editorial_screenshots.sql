create table if not exists public.editorial_screenshots (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  image_url text not null,
  source_url text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (problem_id, image_url)
);

create index if not exists idx_editorial_screenshots_problem_order
  on public.editorial_screenshots(problem_id, sort_order);

alter table public.editorial_screenshots enable row level security;

drop policy if exists "Public can read editorial screenshots" on public.editorial_screenshots;
create policy "Public can read editorial screenshots"
  on public.editorial_screenshots for select
  using (true);
