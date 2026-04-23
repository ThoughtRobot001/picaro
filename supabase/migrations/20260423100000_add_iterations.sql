create table if not exists public.iterations (
  id text primary key,
  user_id uuid references auth.users(id) 
    on delete cascade not null,
  project_id uuid references public.projects(id)
    on delete cascade not null,
  page_number integer not null default 1,
  step text not null,
  prompt text not null,
  thumbnail_url text,
  is_refinement boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz default now() not null
);

alter table public.iterations 
  enable row level security;

create policy "Users can view own iterations"
  on public.iterations for select
  using (auth.uid() = user_id);

create policy "Users can insert own iterations"
  on public.iterations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own iterations"
  on public.iterations for update
  using (auth.uid() = user_id);

create policy "Users can delete own iterations"
  on public.iterations for delete
  using (auth.uid() = user_id);
