-- Tables for DevTools approvals workflow

create table if not exists public.devtools_developers (
  user_id uuid primary key,
  approved_at timestamptz not null default now()
);

create table if not exists public.devtools_requests (
  user_id uuid not null,
  status text not null check (status in ('pending','approved','denied')) default 'pending',
  requested_at timestamptz not null default now(),
  constraint devtools_requests_pk primary key (user_id)
);

create table if not exists public.approvals_log (
  id bigserial primary key,
  admin_id uuid not null,
  user_id uuid not null,
  action text not null check (action in ('approved','denied')),
  created_at timestamptz not null default now(),
  metadata jsonb
);

-- Enable RLS
alter table public.devtools_developers enable row level security;
alter table public.devtools_requests enable row level security;
alter table public.approvals_log enable row level security;

-- Policies
-- devtools_developers: only the member can select their own row; no writes from client
drop policy if exists devtools_developers_select_self on public.devtools_developers;
create policy devtools_developers_select_self on public.devtools_developers
  for select using (auth.uid() = user_id);

-- devtools_requests: user can insert their own request; admin can view/update
drop policy if exists devtools_requests_insert_self on public.devtools_requests;
create policy devtools_requests_insert_self on public.devtools_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists devtools_requests_select_admin on public.devtools_requests;
create policy devtools_requests_select_admin on public.devtools_requests
  for select using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role')::text, '') = 'admin' or
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

drop policy if exists devtools_requests_update_admin on public.devtools_requests;
create policy devtools_requests_update_admin on public.devtools_requests
  for update using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role')::text, '') = 'admin' or
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

-- approvals_log: admin can select; writes only via service role
drop policy if exists approvals_log_select_admin on public.approvals_log;
create policy approvals_log_select_admin on public.approvals_log
  for select using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role')::text, '') = 'admin' or
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

-- No insert/update/delete policies on devtools_developers or approvals_log so that only service role (Edge Function) can write
