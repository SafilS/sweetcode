-- Add welcome_email_sent column to profiles table
alter table public.profiles add column if not exists welcome_email_sent boolean default false;
