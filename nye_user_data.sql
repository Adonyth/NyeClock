-- Nye Clock / Adonyth — run once in Supabase → SQL Editor
-- Enables per-user JSON payload (BaZi charts + app settings from localStorage)

create table if not exists public.nye_user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists nye_user_data_updated_at_idx on public.nye_user_data (updated_at desc);

alter table public.nye_user_data enable row level security;

create policy "nye_select_own"
  on public.nye_user_data for select
  using (auth.uid() = user_id);

create policy "nye_insert_own"
  on public.nye_user_data for insert
  with check (auth.uid() = user_id);

create policy "nye_update_own"
  on public.nye_user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: allow delete
create policy "nye_delete_own"
  on public.nye_user_data for delete
  using (auth.uid() = user_id);
