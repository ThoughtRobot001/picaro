create extension if not exists pgcrypto;

create table if not exists public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id)
    on delete cascade not null,
  month text not null,
  generation_count integer not null default 0,
  updated_at timestamptz default now() not null,
  unique(user_id, month)
);

alter table public.usage enable row level security;

drop policy if exists "Users can view own usage" on public.usage;
create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own usage" on public.usage;
create policy "Users can update own usage"
  on public.usage for update
  using (auth.uid() = user_id);
