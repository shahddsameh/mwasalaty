alter table public.tickets
add column if not exists activated_at timestamptz null,
add column if not exists expires_at timestamptz null;
