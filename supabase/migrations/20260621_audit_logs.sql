create table if not exists audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event       text        not null,
  user_id     uuid,
  endpoint    text,
  ip          text,
  metadata    jsonb
);

alter table audit_logs enable row level security;
-- No permissive policies — anon/user keys cannot read or write.
-- The service role key used in serverless functions bypasses RLS.

create index audit_logs_created_at_idx on audit_logs (created_at desc);
create index audit_logs_user_id_idx    on audit_logs (user_id);
create index audit_logs_event_idx      on audit_logs (event);
