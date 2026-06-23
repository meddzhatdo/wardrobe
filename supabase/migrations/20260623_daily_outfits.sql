-- Daily AI-generated outfits, keyed by user + date + weather fingerprint.
-- Enables cross-device sync: the same outfits appear on phone and laptop
-- without re-calling the Anthropic API.

create table daily_outfits (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  date        text        not null,
  fingerprint text        not null,
  outfits     jsonb       not null,
  created_at  timestamptz not null default now(),
  unique (user_id, date, fingerprint)
);

alter table daily_outfits enable row level security;

create policy "Users can read own daily outfits"
  on daily_outfits for select
  using (auth.uid() = user_id);

create policy "Users can insert own daily outfits"
  on daily_outfits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own daily outfits"
  on daily_outfits for update
  using (auth.uid() = user_id);

create index daily_outfits_user_date_idx on daily_outfits (user_id, date);
