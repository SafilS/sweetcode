-- Create discussion threads table
create table public.discussion_threads (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title varchar(255) not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create discussion replies table
create table public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discussion_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create thread votes table
create table public.discussion_thread_votes (
  thread_id uuid not null references public.discussion_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  primary key (thread_id, user_id)
);

-- Enable Row-Level Security (RLS)
alter table public.discussion_threads enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.discussion_thread_votes enable row level security;

-- Policies for discussion_threads
create policy "Anyone can read threads" on public.discussion_threads
  for select using (true);

create policy "Users can insert own threads" on public.discussion_threads
  for insert with check (auth.uid() = user_id);

create policy "Users can update own threads" on public.discussion_threads
  for update using (auth.uid() = user_id);

create policy "Users can delete own threads" on public.discussion_threads
  for delete using (auth.uid() = user_id);

-- Policies for discussion_replies
create policy "Anyone can read replies" on public.discussion_replies
  for select using (true);

create policy "Users can insert own replies" on public.discussion_replies
  for insert with check (auth.uid() = user_id);

create policy "Users can update own replies" on public.discussion_replies
  for update using (auth.uid() = user_id);

create policy "Users can delete own replies" on public.discussion_replies
  for delete using (auth.uid() = user_id);

-- Policies for discussion_thread_votes
create policy "Anyone can read votes" on public.discussion_thread_votes
  for select using (true);

create policy "Users can insert own votes" on public.discussion_thread_votes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own votes" on public.discussion_thread_votes
  for delete using (auth.uid() = user_id);

-- Update public.profiles select policy to be readable by anyone
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Public can read profiles" on public.profiles
  for select using (true);
