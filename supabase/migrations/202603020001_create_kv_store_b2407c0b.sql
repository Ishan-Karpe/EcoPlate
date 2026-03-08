-- Required for EcoPlate API storage in src/lib/kv.ts
create table if not exists public.kv_store_b2407c0b (
  key text primary key,
  value jsonb not null
);

-- Improves prefix scans used by getByPrefix("...") calls.
create index if not exists kv_store_b2407c0b_key_prefix_idx
  on public.kv_store_b2407c0b (key text_pattern_ops);
