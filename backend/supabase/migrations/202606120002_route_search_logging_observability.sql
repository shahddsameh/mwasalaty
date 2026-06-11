-- Additive observability fields for route search logging.
-- Existing route_searches rows remain untouched.

alter table if exists public.route_searches
  add column if not exists anonymous_session_id text,
  add column if not exists status text,
  add column if not exists error_message text,
  add column if not exists source text,
  add column if not exists route_short_names text[],
  add column if not exists route_long_names text[],
  add column if not exists route_ids text[];

create index if not exists route_searches_created_at_idx
  on public.route_searches (created_at desc);

create index if not exists route_searches_status_idx
  on public.route_searches (status);

create index if not exists route_searches_route_short_names_idx
  on public.route_searches using gin (route_short_names);
