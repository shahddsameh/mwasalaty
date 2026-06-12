-- Safe support ticket reply relationship hardening.
-- This migration is intentionally additive: it does not delete or rewrite data.

alter table if exists public.support_ticket_replies
  add column if not exists admin_id text,
  add column if not exists admin_email text;

create index if not exists support_ticket_replies_ticket_id_idx
  on public.support_ticket_replies (support_ticket_id);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'support_tickets'
  ) and exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'support_ticket_replies'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'support_ticket_replies_support_ticket_id_fkey'
  ) then
    alter table public.support_ticket_replies
      add constraint support_ticket_replies_support_ticket_id_fkey
      foreign key (support_ticket_id)
      references public.support_tickets(id)
      on delete cascade;
  end if;
end $$;
