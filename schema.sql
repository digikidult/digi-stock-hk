-- Execute once in Supabase SQL Editor. Enable Authentication > Providers > Anonymous Sign-Ins.
create extension if not exists pgcrypto;
create table if not exists public.stores (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 80),
 region text not null check(region in ('香港島','九龍','新界','離島')),
 district text not null check(char_length(district) between 1 and 40),
 address text not null unique check(char_length(address) between 8 and 220),
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now()
);
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete cascade,
 status text not null check(status in ('in','out')),
 note text check(note is null or char_length(note)<=160),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 created_at timestamptz not null default now()
);
create index if not exists idx_reports_store_date on public.reports(store_id,created_at desc);
create index if not exists idx_reports_user_date on public.reports(user_id,created_at desc);
create or replace function public.check_stock_submission() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or new.user_id is distinct from auth.uid() then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.reports where user_id=auth.uid() and created_at>now()-interval '10 minutes') then raise exception '每 10 分鐘只可以回報一次'; end if;
 return new;
end $$;
drop trigger if exists trg_stock_limit on public.reports;
create trigger trg_stock_limit before insert on public.reports for each row execute function public.check_stock_submission();
create or replace function public.check_store_submission() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or new.created_by is distinct from auth.uid() then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.stores where created_by=auth.uid() and created_at>now()-interval '30 minutes') then raise exception '每 30 分鐘只可以新增一間分店'; end if;
 return new;
end $$;
drop trigger if exists trg_store_limit on public.stores;
create trigger trg_store_limit before insert on public.stores for each row execute function public.check_store_submission();
alter table public.stores enable row level security;
alter table public.reports enable row level security;
drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores for select to anon,authenticated using(true);
drop policy if exists stores_user_add on public.stores;
create policy stores_user_add on public.stores for insert to authenticated with check(created_by=auth.uid());
drop policy if exists reports_public_read on public.reports;
create policy reports_public_read on public.reports for select to authenticated using(user_id=auth.uid());
drop policy if exists reports_user_add on public.reports;
create policy reports_user_add on public.reports for insert to authenticated with check(user_id=auth.uid());
-- A public SECURITY DEFINER view exposes only safe reporting fields, not anonymous user ids.
create or replace view public.stock_reports with (security_barrier=true) as
 select store_id,status,note,created_at from public.reports;
revoke all on public.reports from anon;
grant select,insert on public.reports to authenticated;
grant select on public.stock_reports to anon,authenticated;
-- Public view owner must be a trusted owner (SQL editor postgres role).

