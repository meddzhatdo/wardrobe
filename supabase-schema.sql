-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null default '',
  bio         text not null default '',
  top_size    text not null default '',
  bottom_size text not null default '',
  shoe_size   text not null default '',
  styles      text[] not null default '{}',
  created_at  timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "Users can read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- ── Boards ───────────────────────────────────────────────────────────────────
create table boards (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);
alter table boards enable row level security;
create policy "Users manage own boards" on boards for all using (auth.uid() = user_id);

-- ── Items ────────────────────────────────────────────────────────────────────
create table items (
  id            bigserial primary key,
  user_id       uuid not null references auth.users on delete cascade,
  name          text not null default '',
  brand         text not null default '',
  price         text not null default '',
  size          text not null default '',
  material      text not null default '',
  color         text not null default '',
  category      text not null default '',
  notes         text not null default '',
  image_url     text not null default '',
  liked         boolean not null default false,
  board_names   text[] not null default '{}',
  attributes    jsonb not null default '{"layerType":"none","sleeveLength":"none","warmthRating":"none"}',
  color_profile jsonb not null default '{"primaryHex":"","colorFamily":"","undertone":"Neutral","vibrancy":"Muted"}',
  created_at    timestamptz not null default now()
);
alter table items enable row level security;
create policy "Users manage own items" on items for all using (auth.uid() = user_id);

-- ── Outfits ──────────────────────────────────────────────────────────────────
create table outfits (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null default '',
  canvas_items jsonb not null default '[]',
  thumbnail    text not null default '',
  is_draft     boolean not null default false,
  liked        boolean not null default false,
  board_names  text[] not null default '{}',
  created_at   timestamptz not null default now()
);
alter table outfits enable row level security;
create policy "Users manage own outfits" on outfits for all using (auth.uid() = user_id);

-- ── Outfit boards ─────────────────────────────────────────────────────────────
create table outfit_boards (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);
alter table outfit_boards enable row level security;
create policy "Users manage own outfit boards" on outfit_boards for all using (auth.uid() = user_id);
