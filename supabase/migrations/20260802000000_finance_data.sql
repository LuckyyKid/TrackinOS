-- Table de stockage par utilisateur : un JSONB par user (schéma FinanceData côté client)
create table if not exists public.finance_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS : chaque utilisateur voit / modifie uniquement sa propre ligne
alter table public.finance_data enable row level security;

drop policy if exists "finance_data select own" on public.finance_data;
create policy "finance_data select own"
  on public.finance_data for select
  using (auth.uid() = user_id);

drop policy if exists "finance_data insert own" on public.finance_data;
create policy "finance_data insert own"
  on public.finance_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "finance_data update own" on public.finance_data;
create policy "finance_data update own"
  on public.finance_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "finance_data delete own" on public.finance_data;
create policy "finance_data delete own"
  on public.finance_data for delete
  using (auth.uid() = user_id);
