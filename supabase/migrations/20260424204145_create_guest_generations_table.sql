create table if not exists public.guest_generations (
  id uuid default gen_random_uuid() primary key,
  guest_token text not null unique,
  image_url text,
  created_at timestamptz default now() not null
);

-- No RLS needed — only accessed by service role
