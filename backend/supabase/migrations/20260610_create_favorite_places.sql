create table if not exists public.favorite_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (char_length(name) between 1 and 120),
  address text not null check (char_length(address) between 1 and 300),
  type text not null default 'other' check (type in ('home', 'work', 'school', 'other')),
  lat double precision,
  lng double precision,
  created_at bigint not null,
  updated_at bigint not null,
  primary key (user_id, id)
);

alter table public.favorite_places enable row level security;

drop policy if exists "favorite_places_select_own" on public.favorite_places;
create policy "favorite_places_select_own"
on public.favorite_places for select
using (auth.uid() = user_id);

drop policy if exists "favorite_places_insert_own" on public.favorite_places;
create policy "favorite_places_insert_own"
on public.favorite_places for insert
with check (auth.uid() = user_id);

drop policy if exists "favorite_places_update_own" on public.favorite_places;
create policy "favorite_places_update_own"
on public.favorite_places for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "favorite_places_delete_own" on public.favorite_places;
create policy "favorite_places_delete_own"
on public.favorite_places for delete
using (auth.uid() = user_id);
