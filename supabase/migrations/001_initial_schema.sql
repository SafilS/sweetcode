create extension if not exists pgcrypto;

create type difficulty_level as enum ('EASY', 'MEDIUM', 'HARD');
create type progress_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'SOLVED', 'REVISITING');

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  problem_number varchar(16) not null unique,
  title varchar(255) not null,
  slug varchar(255) not null unique,
  difficulty difficulty_level not null,
  is_premium boolean not null default false,
  remark text,
  source_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.problem_texts (
  problem_id uuid primary key references public.problems(id) on delete cascade,
  description text not null,
  examples jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '[]'::jsonb
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(64) not null unique,
  slug varchar(64) not null unique
);

create table public.problem_tags (
  problem_id uuid not null references public.problems(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (problem_id, tag_id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name varchar(128) not null unique,
  slug varchar(128) not null unique
);

create table public.problem_companies (
  problem_id uuid not null references public.problems(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  primary key (problem_id, company_id)
);

create table public.solution_approaches (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  title varchar(255) not null,
  explanation text,
  time_complexity varchar(64),
  space_complexity varchar(64),
  sort_order integer not null default 0
);

create table public.code_snippets (
  id uuid primary key default gen_random_uuid(),
  approach_id uuid not null references public.solution_approaches(id) on delete cascade,
  language varchar(32) not null,
  code text not null,
  unique (approach_id, language)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username varchar(50) unique,
  avatar_url text,
  preferred_language varchar(32) not null default 'Python3',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_problem_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  status progress_status not null default 'NOT_STARTED',
  last_viewed_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create table public.user_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  content text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create index idx_problems_difficulty_premium on public.problems(difficulty, is_premium);
create index idx_problems_number on public.problems(problem_number);
create index idx_problem_tags_tag_id on public.problem_tags(tag_id) include (problem_id);
create index idx_problem_companies_company_id on public.problem_companies(company_id) include (problem_id);
create index idx_solutions_problem_order on public.solution_approaches(problem_id, sort_order);
create index idx_user_progress_lookup on public.user_problem_progress(user_id, status, last_viewed_at desc);

alter table public.problems enable row level security;
alter table public.problem_texts enable row level security;
alter table public.tags enable row level security;
alter table public.problem_tags enable row level security;
alter table public.companies enable row level security;
alter table public.problem_companies enable row level security;
alter table public.solution_approaches enable row level security;
alter table public.code_snippets enable row level security;
alter table public.profiles enable row level security;
alter table public.user_problem_progress enable row level security;
alter table public.user_notes enable row level security;
alter table public.bookmarks enable row level security;

create policy "Public can read problems" on public.problems for select using (true);
create policy "Public can read problem texts" on public.problem_texts for select using (true);
create policy "Public can read tags" on public.tags for select using (true);
create policy "Public can read problem tags" on public.problem_tags for select using (true);
create policy "Public can read companies" on public.companies for select using (true);
create policy "Public can read problem companies" on public.problem_companies for select using (true);
create policy "Public can read solution approaches" on public.solution_approaches for select using (true);
create policy "Public can read code snippets" on public.code_snippets for select using (true);

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

create policy "Users can read own progress" on public.user_problem_progress for select using (auth.uid() = user_id);
create policy "Users can upsert own progress" on public.user_problem_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.user_problem_progress for update using (auth.uid() = user_id);

create policy "Users can read own notes" on public.user_notes for select using (auth.uid() = user_id);
create policy "Users can upsert own notes" on public.user_notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.user_notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.user_notes for delete using (auth.uid() = user_id);

create policy "Users can read own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users can insert own bookmarks" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can delete own bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
