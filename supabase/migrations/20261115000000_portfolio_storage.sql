create table if not exists public.portfolio_state (
  id smallint primary key check (id = 1),
  revision bigint not null default 0,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_state enable row level security;
revoke all on public.portfolio_state from public, anon, authenticated, service_role;

create or replace function public.portfolio_read()
returns table (revision bigint, payload jsonb)
language sql
security definer
set search_path = ''
as $$
  select state.revision, state.payload
  from public.portfolio_state as state
  where state.id = 1;
$$;

create or replace function public.portfolio_initialize(p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.portfolio_state (id, revision, payload)
  values (1, 0, p_payload)
  on conflict (id) do nothing;
$$;

create or replace function public.portfolio_write(
  p_expected_revision bigint,
  p_payload jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  update public.portfolio_state
  set payload = p_payload,
      revision = revision + 1,
      updated_at = now()
  where id = 1
    and revision = p_expected_revision
  returning revision into next_revision;

  return next_revision;
end;
$$;

revoke all on function public.portfolio_read() from public, anon, authenticated;
revoke all on function public.portfolio_initialize(jsonb) from public, anon, authenticated;
revoke all on function public.portfolio_write(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.portfolio_read() to service_role;
grant execute on function public.portfolio_initialize(jsonb) to service_role;
grant execute on function public.portfolio_write(bigint, jsonb) to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portfolio-media',
  'portfolio-media',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
