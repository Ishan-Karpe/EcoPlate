-- Keep client roles from directly touching KV storage.
alter table if exists public.kv_store_b2407c0b enable row level security;

revoke all on table public.kv_store_b2407c0b from anon;
revoke all on table public.kv_store_b2407c0b from authenticated;

-- Server-side secret key access remains available through service_role.
grant all on table public.kv_store_b2407c0b to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'kv_store_b2407c0b'
      and policyname = 'kv_store_deny_anon'
  ) then
    create policy kv_store_deny_anon
      on public.kv_store_b2407c0b
      as restrictive
      for all
      to anon
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'kv_store_b2407c0b'
      and policyname = 'kv_store_deny_authenticated'
  ) then
    create policy kv_store_deny_authenticated
      on public.kv_store_b2407c0b
      as restrictive
      for all
      to authenticated
      using (false)
      with check (false);
  end if;
end $$;
