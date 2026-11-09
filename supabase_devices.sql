-- Run once in Supabase → SQL Editor.
-- Replace PASTE-USER-UID-HERE (3 places) with your admin account's User UID.
-- Safe to run more than once.

create table if not exists public.devices (
  device_id uuid primary key,
  label text check (char_length(label) <= 60),
  device_type text not null default 'desktop',
  os text,
  browser text,
  installed boolean not null default false,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  visit_count integer not null default 1
);

alter table public.devices enable row level security;

-- Visitors can NOT read or write this table directly; only the function below
-- can add a visit. Only your admin account can read, rename or remove devices.
revoke all on public.devices from anon, authenticated;
grant select, update, delete on public.devices to authenticated;

drop policy if exists "Admin can read devices" on public.devices;
drop policy if exists "Admin can update devices" on public.devices;
drop policy if exists "Admin can delete devices" on public.devices;

create policy "Admin can read devices"
  on public.devices for select to authenticated
  using (auth.uid() = 'PASTE-USER-UID-HERE'::uuid);

create policy "Admin can update devices"
  on public.devices for update to authenticated
  using (auth.uid() = 'PASTE-USER-UID-HERE'::uuid)
  with check (auth.uid() = 'PASTE-USER-UID-HERE'::uuid);

create policy "Admin can delete devices"
  on public.devices for delete to authenticated
  using (auth.uid() = 'PASTE-USER-UID-HERE'::uuid);

-- The only thing visitors can do: report a visit for their own device.
create or replace function public.record_visit(
  p_device_id uuid,
  p_device_type text,
  p_os text,
  p_browser text,
  p_installed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.devices (device_id, device_type, os, browser, installed)
  values (
    p_device_id,
    case when p_device_type in ('mobile', 'tablet', 'desktop') then p_device_type else 'desktop' end,
    left(p_os, 40),
    left(p_browser, 40),
    coalesce(p_installed, false)
  )
  on conflict (device_id) do update set
    last_seen = now(),
    visit_count = devices.visit_count + 1,
    device_type = excluded.device_type,
    os = excluded.os,
    browser = excluded.browser,
    installed = excluded.installed;
end;
$$;

revoke all on function public.record_visit(uuid, text, text, text, boolean) from public;
grant execute on function public.record_visit(uuid, text, text, text, boolean) to anon, authenticated;
