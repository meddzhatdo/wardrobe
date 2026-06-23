-- ============================================================
-- Wardrobe App — full database schema
-- Run this once in a fresh Supabase project to set everything up.
-- Individual files under migrations/ apply the same DDL and can
-- be run instead when using the Supabase CLI migration workflow.
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
-- Extends auth.users with display preferences.
-- Country, style_preferences, outfit_goals, and onboarding_complete
-- are stored in auth.users.user_metadata (updated via supabase.auth.updateUser).
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  bio         text not null default '',
  top_size    text not null default '',
  bottom_size text not null default '',
  shoe_size   text not null default '',
  styles      text[] not null default '{}'
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can upsert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ── items ───────────────────────────────────────────────────
create table if not exists items (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  user_id     uuid        not null    references auth.users(id) on delete cascade,
  name        text        not null    default '',
  brand       text        not null    default '',
  price       numeric,
  size        text        not null    default '',
  material    text        not null    default '',
  color       text        not null    default '',
  category    text        not null    default '',
  notes       text        not null    default '',
  image_url   text        not null    default '',
  liked       boolean     not null    default false,
  board_names text[]      not null    default '{}',
  -- JSONB blob set by the enrich-item API; includes warmthRating and AI-derived tags
  attributes  jsonb       not null    default '{"warmthRating":"none"}'
);

alter table items enable row level security;

create policy "Users can manage own items"
  on items for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index items_user_created_idx on items (user_id, created_at desc);

-- ── boards ──────────────────────────────────────────────────
-- Named groupings for items (item.board_names stores the names).
create table if not exists boards (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  user_id     uuid        not null    references auth.users(id) on delete cascade,
  name        text        not null,
  description text        not null    default '',
  unique (user_id, name)
);

alter table boards enable row level security;

create policy "Users can manage own boards"
  on boards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index boards_user_created_idx on boards (user_id, created_at);

-- ── outfits ─────────────────────────────────────────────────
-- Collage-style outfits composed of items.
-- canvas_items stores an array of { id, x, y, width, height, rotation, zIndex }.
create table if not exists outfits (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null    default now(),
  user_id      uuid        not null    references auth.users(id) on delete cascade,
  name         text        not null    default '',
  canvas_items jsonb       not null    default '[]',
  thumbnail    text        not null    default '',
  is_draft     boolean     not null    default false,
  liked        boolean     not null    default false,
  board_names  text[]      not null    default '{}'
);

alter table outfits enable row level security;

create policy "Users can manage own outfits"
  on outfits for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index outfits_user_created_idx on outfits (user_id, created_at desc);

-- ── outfit_boards ────────────────────────────────────────────
-- Named groupings for outfits (outfit.board_names stores the names).
create table if not exists outfit_boards (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  user_id     uuid        not null    references auth.users(id) on delete cascade,
  name        text        not null,
  description text        not null    default '',
  unique (user_id, name)
);

alter table outfit_boards enable row level security;

create policy "Users can manage own outfit boards"
  on outfit_boards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index outfit_boards_user_created_idx on outfit_boards (user_id, created_at);

-- ── wear_logs ────────────────────────────────────────────────
-- Records which items/outfit were worn on a given date.
-- source: 'today_ai' | 'studio_collage' | 'manual'
create table if not exists wear_logs (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null    default now(),
  user_id    uuid        not null    references auth.users(id) on delete cascade,
  worn_date  date        not null    default current_date,
  item_ids   text[]      not null    default '{}',
  outfit_id  uuid        references outfits(id) on delete set null,
  source     text        not null    default 'manual'
);

alter table wear_logs enable row level security;

create policy "Users can manage own wear_logs"
  on wear_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index wear_logs_user_date_idx on wear_logs (user_id, worn_date desc);
create index wear_logs_user_id_idx   on wear_logs (user_id);

-- ── stylist_conversations ────────────────────────────────────
-- Persistent AI stylist chat history.
-- messages is an array of { role, content } objects.
create table if not exists stylist_conversations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null    references auth.users(id) on delete cascade,
  title      text        not null    default 'New conversation',
  messages   jsonb       not null    default '[]',
  created_at timestamptz not null    default now(),
  updated_at timestamptz not null    default now()
);

alter table stylist_conversations enable row level security;

create policy "Users can manage own stylist conversations"
  on stylist_conversations for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index stylist_conversations_user_updated
  on stylist_conversations (user_id, updated_at desc);

-- ── audit_logs ───────────────────────────────────────────────
-- Server-side event log written only by the service role.
-- No RLS policies — anon/user keys cannot read or write.
create table if not exists audit_logs (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null    default now(),
  event      text        not null,
  user_id    uuid,
  endpoint   text,
  ip         text,
  metadata   jsonb
);

alter table audit_logs enable row level security;

create index audit_logs_created_at_idx on audit_logs (created_at desc);
create index audit_logs_user_id_idx    on audit_logs (user_id);
create index audit_logs_event_idx      on audit_logs (event);

-- ── storage ──────────────────────────────────────────────────
-- Create the item-images bucket via the Supabase dashboard or CLI:
--   supabase storage create item-images --public
--
-- Storage policy (set in dashboard or via SQL):
--   Users can upload to their own folder: storage.foldername(name)[1] = auth.uid()::text
--   Public read access for all objects in item-images
